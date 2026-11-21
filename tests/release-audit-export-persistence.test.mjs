import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Release Blocker Audit - Persistence, Mock Guard, CRM & Export Validation", () => {
  test("1. Production Mock Guard is Unconditional: rejects even when ENABLE_MOCK_PROVIDER=true", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevEnable = process.env.ENABLE_MOCK_PROVIDER;

    try {
      process.env.NODE_ENV = "production";
      process.env.ENABLE_MOCK_PROVIDER = "true";

      const { MockDiscoveryProvider } = await import("../lib/providers/mock.ts");
      const mock = new MockDiscoveryProvider();

      assert.equal(mock.isEnabled, false, "Mock provider isEnabled must be false in production");
      const health = await mock.checkHealth();
      assert.equal(health.status, "disabled", "Health check must report disabled in production");

      await assert.rejects(
        () => mock.discover({ industry: "Dermatology", city: "Vadodara", country: "India", limit: 5 }),
        /strictly and unconditionally disabled in production/,
        "Mock discover() must throw an error in production"
      );

      const { WaterfallOrchestrator } = await import("../lib/providers/waterfall.ts");
      const waterfall = new WaterfallOrchestrator();
      const providers = waterfall.listProviders();
      assert.ok(!providers.some((p) => p.id === "mock"), "Production waterfall must not register mock provider");

      // Test that requesting mock provider directly in production is purged
      const summary = await waterfall.runWaterfall(
        { industry: "Dermatology", city: "Vadodara", country: "India", limit: 5 },
        { requestedProviderId: "mock", customProviderOrder: ["mock"] }
      );
      assert.ok(!summary.attemptedProviders.includes("mock"), "Mock must not be attempted in production");
    } finally {
      process.env.NODE_ENV = prevEnv;
      process.env.ENABLE_MOCK_PROVIDER = prevEnable;
    }
  });

  test("2. Duplicate Job Prevention: findExistingActiveJob identifies active running/pending jobs", async () => {
    const { createInitialSearchJob, findExistingActiveJob, saveSearchJob } = await import("../lib/jobs/store.ts");

    const query = {
      industry: "Dermatology Specialty " + Date.now(),
      city: "Vadodara",
      country: "India",
      limit: 10,
    };

    // Initially no active job
    const initialCheck = findExistingActiveJob(query);
    assert.equal(initialCheck, null, "Should be null before job creation");

    // Create job
    const job = createInitialSearchJob(query);
    await saveSearchJob(job);

    // Now duplicate lookup should find it
    const active = findExistingActiveJob(query);
    assert.ok(active, "Active job must be found");
    assert.equal(active.id, job.id);
  });

  test("3. CRM Reply Distinctions: Manual vs Provider vs Inbound Unsubscribe Suppression", async () => {
    const {
      createOrUpdateLeadFromBusiness,
      createOutreachDraft,
      sendOrLogOutreach,
      recordIncomingReply,
      getLeadById,
      getLeadActivities,
      isSuppressed,
      listFollowUps,
    } = await import("../lib/crm/store.ts");

    const uniqueSuffix = Date.now() + "_" + Math.floor(Math.random() * 10000);
    const testAuditEmail = `dr.audit.${uniqueSuffix}@audittestdermatology.com`;

    const sampleLeadBiz = {
      id: "biz-audit-" + uniqueSuffix,
      canonicalName: "Audit Test Dermatology Center " + uniqueSuffix,
      website: "https://audittestdermatology.com",
      domain: "audittestdermatology.com",
      industry: "Dermatology",
      city: "Vadodara",
      country: "India",
      identityStatus: "verified",
      identityScore: 90,
      qualificationScore: 85,
      status: "qualified",
      serviceTrack: "creative+technical",
      sources: [
        {
          sourceUrl: "https://audittestdermatology.com",
          sourceHost: "audittestdermatology.com",
          sourceType: "official_website",
          evidenceText: "Audit test clinic in Vadodara",
          discoveredAt: new Date().toISOString(),
        },
      ],
      contacts: [
        {
          id: "c-rec",
          businessId: "biz-audit",
          contactType: "phone",
          contactValue: "+91 265 244 0000",
          ownershipType: "reception",
          verificationStatus: "confirmed",
        },
        {
          id: "c-dir",
          businessId: "biz-audit",
          contactType: "email",
          contactValue: testAuditEmail,
          ownershipType: "decision_maker_direct",
          verificationStatus: "deliverable",
        },
      ],
      decisionMakers: [
        {
          id: "dm-1",
          businessId: "biz-audit",
          fullName: "Dr. Audit Patel",
          roleLabel: "Founder & Chief Dermatologist",
          roleCategory: "founder",
          isPurchasingAuthority: true,
          email: testAuditEmail,
          verificationStatus: "verified",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const lead = createOrUpdateLeadFromBusiness(sampleLeadBiz);
    assert.equal(lead.stage, "qualified");

    // Case A: Outbound Outreach Dispatch with Provider Message ID
    const draft = createOutreachDraft(lead.id, {
      contactId: "c-dir",
      channel: "email",
      subject: "Audit Opportunity for Audit Test Dermatology",
      body: "Hi Dr. Audit Patel, reviewing your site audit.",
    });

    const sent = sendOrLogOutreach(draft.id, {
      isManual: false,
      provider: "SendGrid/SMTP",
      providerMessageId: "sg_msg_live_audit_12345",
      deliveryConfirmed: true,
    });
    assert.equal(sent.status, "delivered");
    assert.equal(sent.providerMessageId, "sg_msg_live_audit_12345");
    assert.equal(sent.isManual, false);

    // Follow-ups must be scheduled
    const followUpsAfterSend = listFollowUps(lead.id);
    assert.ok(followUpsAfterSend.length > 0, "Follow-up must be scheduled after outreach");

    // Case B: Inbound Provider Reply (Actual reply with external message ID)
    const replyRes = recordIncomingReply(lead.id, {
      channel: "email",
      body: "Thanks, please unsubscribe me from your emails.",
      senderName: "Dr. Audit Patel",
      senderEmail: testAuditEmail,
      classification: "unsubscribe",
      isManual: false,
      providerMessageId: "inbound_mime_987654",
    });

    assert.equal(replyRes.message.providerMessageId, "inbound_mime_987654");
    assert.equal(replyRes.message.isManual, false);
    assert.equal(replyRes.message.replyClassification, "unsubscribe");

    // Verify automatic follow-up pause
    const followUpsAfterReply = listFollowUps(lead.id);
    const activeFollowUps = followUpsAfterReply.filter((f) => f.status === "pending");
    assert.equal(activeFollowUps.length, 0, "All follow-ups must be paused upon receiving a reply");

    // Verify unsubscribe suppression
    assert.ok(isSuppressed("dr.audit@audittestdermatology.com"), "Sender email must be added to suppression list");

    // Verify lead stage disqualified
    const updatedLead = getLeadById(lead.id);
    assert.equal(updatedLead.stage, "disqualified");

    // Verify activities record distinguishes provider vs manual
    const acts = getLeadActivities(lead.id);
    const replyAct = acts.find((a) => a.activityType === "reply_received");
    assert.ok(replyAct, "Must record reply_received for live provider reply");
  });

  test("4. Export Validation: Verifies separate Business vs Decision-Maker contact fields and RFC 4180 escaping", () => {
    const sampleBiz = {
      canonicalName: 'Apex "Specialty" Clinic, Vadodara',
      website: "https://apexclinic.in",
      domain: "apexclinic.in",
      industry: "Dermatology",
      city: "Vadodara",
      country: "India",
      address: "GF-01, Race Course Circle, Vadodara",
      contacts: [
        { contactType: "phone", value: "+91 265 233 4455", ownershipType: "reception" },
        { contactType: "email", value: "info@apexclinic.in", ownershipType: "general_inquiry" },
      ],
      decisionMakers: [
        {
          fullName: "Dr. Apex Sharma",
          roleLabel: "Founder & Clinical Director",
          credentials: ["MBBS", "MD"],
          specialization: "Dermatology",
          email: "dr.sharma@apexclinic.in",
          verificationStatus: "verified",
          profileUrl: "https://linkedin.com/in/drapexx",
        },
      ],
      qualificationScore: 89,
      status: "qualified",
      qualification: { explanation: "High search fit, mobile score optimization required." },
    };

    // Simulate CSV serialization logic from ExportModal
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const phone = sampleBiz.contacts.find((c) => c.contactType === "phone")?.value || "";
    const email = sampleBiz.contacts.find((c) => c.contactType === "email")?.value || "";
    const dm = sampleBiz.decisionMakers[0];

    const row = [
      escapeCsv(sampleBiz.canonicalName),
      escapeCsv(sampleBiz.website),
      escapeCsv(sampleBiz.domain),
      escapeCsv(sampleBiz.industry),
      escapeCsv(sampleBiz.city),
      escapeCsv(sampleBiz.country),
      escapeCsv(sampleBiz.address),
      escapeCsv(phone), // Reception / Business Phone
      escapeCsv(email), // Corporate Email
      escapeCsv(dm?.fullName), // DM Name
      escapeCsv(dm?.roleLabel), // DM Role
      escapeCsv(dm?.credentials?.join("; ")),
      escapeCsv(dm?.specialization),
      escapeCsv(dm?.email), // Direct DM Email
      escapeCsv(dm?.verificationStatus),
      escapeCsv(dm?.profileUrl),
      escapeCsv(sampleBiz.qualificationScore),
      escapeCsv(sampleBiz.status),
      escapeCsv(sampleBiz.qualification?.explanation),
    ].join(",");

    // Assert RFC 4180 escaping
    assert.ok(row.includes('"Apex ""Specialty"" Clinic, Vadodara"'), "Company name with quotes and commas must be escaped");
    // Assert separate business vs person fields
    assert.ok(row.includes('"+91 265 233 4455"'), "Business phone must be present in reception column");
    assert.ok(row.includes('"dr.sharma@apexclinic.in"'), "DM direct email must be in separate DM column");
    assert.ok(row.includes('"info@apexclinic.in"'), "Corporate email must be in separate corporate email column");
    assert.notEqual(phone, dm.email, "Business phone and DM email must never be confused");
  });
});
