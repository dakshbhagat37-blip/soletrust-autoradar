import test from "node:test";
import assert from "node:assert/strict";

// 1. Mock Provider & Production Guard
import { MockDiscoveryProvider } from "../lib/providers/mock.ts";

// 2. Location Verification
import { verifyLocation } from "../lib/verification/location.ts";

// 3. Decision-Maker Intelligence & Roles
import {
  matchRoleInText,
  getAuthorityClassification,
} from "../lib/decision-makers/roles.ts";
import { discoverDecisionMakers } from "../lib/decision-makers/pipeline.ts";

// 4. Contact Verification & Classification
import { classifyAndVerifyBusinessContacts } from "../lib/contacts/classification.ts";
import { verifyEmail } from "../lib/contacts/email-verifier.ts";

// 5. Jobs Store, Persistence & Lifecycle
import {
  createInitialSearchJob,
  saveSearchJob,
  getSearchJob,
  cancelSearchJob,
  retrySearchJob,
  saveJobBusinesses,
  getJobBusinesses,
} from "../lib/jobs/store.ts";

// 6. CRM Store & Lifecycle
import {
  createOrUpdateLeadFromBusiness,
  getLeadById,
  createOutreachDraft,
  sendOrLogOutreach,
  recordIncomingReply,
  scheduleFollowUp,
  createTask,
  createDeal,
  updateDealStage,
  addToSuppressionList,
  isSuppressed,
} from "../lib/crm/store.ts";

// 7. Security & SSRF
import { validateUrlSafe, isPrivateIp } from "../lib/intelligence/crawler.ts";

// ============================================================
// TEST SUITE: CRITICAL PRODUCTION ACCEPTANCE CHECKS
// ============================================================

test("Audit A: Production Mock Provider Guard - Never leaks into production", async () => {
  const origEnv = process.env.NODE_ENV;
  const origEnable = process.env.ENABLE_MOCK_PROVIDER;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.ENABLE_MOCK_PROVIDER;

    const prodMock = new MockDiscoveryProvider();
    assert.equal(prodMock.isEnabled, false, "Mock provider isEnabled must be false in production without explicit flag");

    const health = await prodMock.checkHealth();
    assert.equal(health.status, "disabled", "Provider health must report disabled in production");

    // Must throw an honest failure rather than silently returning mock businesses
    await assert.rejects(
      async () => {
        await prodMock.discover({
          industry: "Dermatology",
          city: "Vadodara",
          country: "India",
        });
      },
      /disabled in production/i,
      "Mock discover must throw in production to prevent fake business generation"
    );

    // Verify candidate records are rejected in production even with ENABLE_MOCK_PROVIDER="true"
    process.env.ENABLE_MOCK_PROVIDER = "true";
    const prodMockWithFlag = new MockDiscoveryProvider();
    assert.equal(prodMockWithFlag.isEnabled, false, "Mock provider must remain disabled in production even with ENABLE_MOCK_PROVIDER=true");
    await assert.rejects(
      async () => {
        await prodMockWithFlag.discover({
          industry: "Dermatology",
          city: "Vadodara",
          country: "India",
        });
      },
      /strictly and unconditionally disabled in production/i,
      "Mock discover must unconditionally reject in production"
    );

    // In non-production (development), mock provider is allowed and candidate records are tagged as mock
    process.env.NODE_ENV = "development";
    const devMock = new MockDiscoveryProvider();
    const result = await devMock.discover({
      industry: "Dermatology",
      city: "Vadodara",
      country: "India",
      limit: 2,
    });
    assert.ok(result.candidates.length > 0);
    for (const cand of result.candidates) {
      assert.equal(cand.isMock, true, "Candidate generated from mock must carry isMock: true");
    }
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origEnable) process.env.ENABLE_MOCK_PROVIDER = origEnable;
    else delete process.env.ENABLE_MOCK_PROVIDER;
  }
});

test("Audit C: Location Verification - STD Codes Supplementary Only & Mobile Negative Tests", () => {
  const query = {
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
  };

  // 1. Negative Test: Mobile number containing '265' inside its digits (+91 98265 12345)
  // Must NOT match Vadodara STD code
  const mobileCandidate = {
    companyName: "Mobile Test Clinic",
    website: "https://mobileclinic.in",
    domain: "mobileclinic.in",
    phone: "+91 98265 12345",
    address: "Somewhere In Gujarat",
    city: "Vadodara",
    country: "India",
    source: "web",
    sourceUrl: "https://mobileclinic.in",
    provider: "test",
    confidence: "medium",
  };

  const mobileRes = verifyLocation(mobileCandidate, query);
  const matchedStd = mobileRes.reasons.some((r) => r.includes("landline STD area code"));
  assert.equal(matchedStd, false, "Mobile numbers containing 265 must NOT be credited as STD landline matches");

  // 2. Positive Test: Genuine Vadodara Landline (+91 265 233 4455)
  const landlineCandidate = {
    ...mobileCandidate,
    phone: "+91 265 233 4455",
    address: "Alkapuri, Vadodara",
  };
  const landlineRes = verifyLocation(landlineCandidate, query);
  const landlineMatched = landlineRes.reasons.some((r) => r.includes("landline STD area code"));
  assert.equal(landlineMatched, true, "Genuine landlines (+91 265 ...) must be credited as supplementary STD match");

  // 3. Negative Test: Candidate WITHOUT physical address or verified premises proof must FAIL location gate
  const noAddressCandidate = {
    companyName: "Virtual Derm Clinic",
    website: "https://virtualclinic.com",
    domain: "virtualclinic.com",
    phone: "+91 265 233 4455",
    address: "", // No address
    city: "Vadodara",
    country: "India",
    source: "web",
    sourceUrl: "https://virtualclinic.com",
    provider: "test",
    confidence: "medium",
  };
  const noAddressRes = verifyLocation(noAddressCandidate, query);
  assert.equal(
    noAddressRes.passed,
    false,
    "Candidate lacking physical address or reliable premises record must fail verified city gate"
  );
  assert.ok(
    noAddressRes.reasons.some((r) => r.includes("physical address, location page, or reliable business-location record")),
    "Explanation must state that verified city status requires physical premises proof"
  );
});

test("Audit D: Decision-Maker Intelligence - Service-Track Ranking & Authority Separation", async () => {
  // 1. Role ranking by service track
  // Creative track: Owner > Founder > CEO > Marketing Director > Marketing Head > Brand Manager
  const creativeMarketingDir = matchRoleInText("Director of Marketing & Communications", "creative");
  const creativeDoctor = matchRoleInText("Consultant Dermatologist", "creative");
  assert.ok(creativeMarketingDir);
  assert.ok(creativeDoctor);
  assert.ok(
    creativeMarketingDir.priority > creativeDoctor.priority,
    "Marketing Director must have higher priority than clinical doctor in Creative track"
  );

  // Technical track: CTO > Technical Director > IT Head > Technology Manager
  const techCto = matchRoleInText("Chief Technology Officer", "technical");
  const techMarketing = matchRoleInText("Marketing Head", "technical");
  assert.ok(techCto);
  assert.ok(techMarketing);
  assert.ok(techCto.priority > techMarketing.priority, "CTO must rank higher than marketing head in Technical track");

  // Medical track: Medical Director > Clinic Director > Managing Partner
  const medDir = matchRoleInText("Medical Director & Chief Consultant", "medical");
  const medOwner = matchRoleInText("Owner & Founder", "medical");
  assert.ok(medDir);
  assert.ok(medOwner);
  assert.ok(medDir.priority > medOwner.priority, "Medical Director must rank at the top in Medical track");

  // 2. Clinical Authority vs Commercial Purchasing Authority
  // Non-negotiable principle: A verified doctor is not automatically a verified owner or purchasing decision-maker.
  const doctorAuth = getAuthorityClassification("clinician_doctor", "Senior Consultant Dermatologist");
  assert.equal(doctorAuth.authorityType, "clinical_authority");
  assert.equal(doctorAuth.isPurchasingAuthority, false, "Verified doctor alone cannot be marked as commercial purchasing authority");

  const directorAuth = getAuthorityClassification("medical_director", "Medical Director");
  assert.equal(directorAuth.authorityType, "commercial_purchasing");
  assert.equal(directorAuth.isPurchasingAuthority, true, "Medical Director is commercial purchasing authority");

  // 3. Multi-decision maker discovery pipeline test
  const testBusiness = {
    id: "test-biz-multi-dm",
    canonicalName: "Multi-Speciality Aesthetic Clinic",
    domain: "aestheticclinic.in",
    website: "https://aestheticclinic.in",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    industryStatus: "verified",
    industryScore: 85,
    locationStatus: "verified",
    locationScore: 90,
    qualificationScore: 88,
    isQualified: true,
    verificationStatus: "verified",
    sources: [],
    branches: [],
    contacts: [],
    decisionMakers: [],
    evidence: [],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const discoveryResult = await discoverDecisionMakers(testBusiness, {
    websiteHtml: `
      <html>
        <body>
          <div class="team">
            <div class="member">
              <h3>Dr. Anita Patel</h3>
              <p>Medical Director</p>
              <a href="mailto:anita@aestheticclinic.in">anita@aestheticclinic.in</a>
            </div>
            <div class="member">
              <h3>Dr. Chirag Desai</h3>
              <p>Consultant Dermatologist</p>
            </div>
          </div>
        </body>
      </html>
    `,
    serviceTrack: "medical",
  });

  assert.ok(discoveryResult.decisionMakers.length >= 2, "Must support multiple decision-makers per business");
  const primary = discoveryResult.primaryDecisionMaker;
  assert.ok(primary);
  assert.equal(primary.fullName, "Dr. Anita Patel", "Medical Director must be chosen as primary over pure consultant");
  assert.equal(primary.isPurchasingAuthority, true);

  const consultant = discoveryResult.decisionMakers.find((d) => d.fullName === "Dr. Chirag Desai");
  assert.ok(consultant);
  assert.equal(consultant.isPurchasingAuthority, false, "Consultant dermatologist has clinical authority, not purchasing authority");
});

test("Audit E: Person-Level Contacts & 4-Way Verification Accounting", async () => {
  const testBiz = {
    id: "biz-contact-acc",
    canonicalName: "Apex Skin Center",
    domain: "apexskin.com",
    website: "https://apexskin.com",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    industryStatus: "verified",
    industryScore: 85,
    locationStatus: "verified",
    locationScore: 90,
    qualificationScore: 85,
    isQualified: true,
    verificationStatus: "verified",
    sources: [],
    branches: [],
    contacts: [
      {
        id: "c-phone-1",
        businessId: "biz-contact-acc",
        contactType: "phone",
        value: "+91 265 244 1122",
        ownershipType: "business_main",
        verificationStatus: "unverified",
        verifiedAt: null,
        evidence: [],
      },
      {
        id: "c-email-1",
        businessId: "biz-contact-acc",
        contactType: "email",
        value: "info@apexskin.com",
        ownershipType: "business_main",
        verificationStatus: "unverified",
        verifiedAt: null,
        evidence: [],
      },
    ],
    decisionMakers: [
      {
        id: "dm-1",
        businessId: "biz-contact-acc",
        fullName: "Dr. Vikram Joshi",
        role: "founder",
        roleLabel: "Founder & Chief Doctor",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [],
        contacts: [
          {
            id: "dm-c-email",
            contactType: "email",
            value: "dr.vikram@apexskin.com",
            ownershipType: "decision_maker_direct",
            verificationStatus: "syntax_valid",
            verifiedAt: null,
            evidence: [],
          },
          {
            id: "dm-c-phone",
            contactType: "phone",
            value: "+91 98250 11223",
            ownershipType: "decision_maker_direct",
            verificationStatus: "syntax_valid",
            verifiedAt: null,
            evidence: [],
          },
        ],
      },
    ],
    evidence: [],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await classifyAndVerifyBusinessContacts(testBiz);
  const summary = result.summary;

  // 1. Four distinct counters must be accurately reported
  assert.equal(summary.verifiedBusinessPhones, 1, "Must report exactly 1 verified business phone");
  assert.equal(summary.verifiedBusinessEmails, 1, "Must report exactly 1 verified business email");
  assert.equal(summary.verifiedDecisionMakerPhones, 1, "Must report exactly 1 verified DM phone");
  assert.equal(summary.verifiedDecisionMakerEmails, 1, "Must report exactly 1 verified DM email");

  // 2. Deliverability principle: syntax/mx valid must not be labeled "deliverable"
  const emailRes = await verifyEmail("dr.vikram@apexskin.com", { businessDomain: "apexskin.com" });
  assert.notEqual(emailRes.verificationStatus, "deliverable", "Status must never be labeled 'deliverable'");
  assert.ok(["syntax_valid", "mx_valid"].includes(emailRes.verificationStatus));
});

test("Audit H: Background Jobs - Persistent State, Cancellation & Retry Lifecycle", async () => {
  // 1. Create a search job
  const job = createInitialSearchJob({
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    limit: 10,
  });
  await saveSearchJob(job);

  assert.equal(job.status, "pending");

  // 2. Cancel the job
  const cancelled = await cancelSearchJob(job.id);
  assert.ok(cancelled);
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.currentStage, "cancelled");
  assert.ok(cancelled.completedAt);

  // Verify retrieval reflects cancellation
  const retrievedCancelled = await getSearchJob(job.id);
  assert.equal(retrievedCancelled?.status, "cancelled");

  // 3. Retry the job
  const retried = await retrySearchJob(job.id);
  assert.ok(retried);
  assert.equal(retried.status, "pending");
  assert.equal(retried.progress, 0);
  assert.equal(retried.currentStage, "queued");
  assert.equal(retried.completedAt, undefined);

  // Verify retrieval reflects reset
  const retrievedRetried = await getSearchJob(job.id);
  assert.equal(retrievedRetried?.status, "pending");
});

test("Audit B: Restart Survival - Atomic Disk Persistence Across Simulated Node Reboots", async () => {
  // Create test entities in jobs and CRM stores
  const testJobId = "restart-test-job-001";
  const initialJob = createInitialSearchJob({
    industry: "Cardiology",
    city: "Mumbai",
    country: "India",
    limit: 5,
  });
  initialJob.id = testJobId;
  await saveSearchJob(initialJob);

  const testBiz = {
    id: "biz-restart-001",
    searchJobId: testJobId,
    canonicalName: "Mumbai Heart & Skin Institute",
    domain: "mumbaiheart.in",
    website: "https://mumbaiheart.in",
    industry: "Cardiology",
    city: "Mumbai",
    country: "India",
    identityStatus: "verified",
    identityScore: 92,
    industryStatus: "verified",
    industryScore: 90,
    locationStatus: "verified",
    locationScore: 95,
    qualificationScore: 90,
    isQualified: true,
    verificationStatus: "verified",
    sources: [],
    branches: [],
    contacts: [],
    decisionMakers: [],
    evidence: [],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveJobBusinesses(testJobId, [testBiz]);

  // Create CRM lead
  const lead = createOrUpdateLeadFromBusiness(testBiz, testJobId);
  assert.ok(lead);

  // Create Deal, Task, FollowUp, and Customer
  const deal = createDeal({
    leadId: lead.id,
    title: "Comprehensive Digital & SEO Engagement",
    amount: 75000,
  });
  createTask(lead.id, "Verify clinical accreditation certificates", "high");
  scheduleFollowUp(lead.id, "Follow up regarding proposal review", new Date(Date.now() + 86400000).toISOString());
  updateDealStage(deal.id, "won"); // Triggers auto customer conversion

  // Verify initial availability
  assert.ok(getLeadById(lead.id));
  assert.ok(getJobBusinesses(testJobId).length > 0);

  // SIMULATE RESTART:
  // Re-read directly from persistent file store
  const { loadJsonFromFile } = await import("../lib/persistence/file-store.ts");
  const persistedJobs = loadJsonFromFile("jobs-store.json", { jobs: {}, businesses: {}, jobBusinesses: {} });
  const persistedCrm = loadJsonFromFile("crm-store.json", { crmLeads: {}, deals: {}, customers: {} });

  assert.ok(persistedJobs.jobs[testJobId], "Job must survive restart in persistent storage");
  assert.ok(persistedJobs.businesses[testBiz.id], "Business must survive restart in persistent storage");
  assert.ok(persistedCrm.crmLeads[lead.id], "CRM lead must survive restart in persistent storage");
  assert.ok(persistedCrm.deals[deal.id], "Deal must survive restart in persistent storage");
  assert.ok(
    Object.values(persistedCrm.customers).some((c) => c.leadId === lead.id),
    "Customer must survive restart in persistent storage"
  );
});

test("Audit I: Suppression List & Unsubscribe Protection", () => {
  const optOutEmail = "optout@unsubscribed-clinic.com";
  addToSuppressionList(optOutEmail);
  assert.equal(isSuppressed(optOutEmail), true, "Email must be present in suppression list");

  // Inbound reply with unsubscribe classification must automatically suppress contact
  const testBiz = {
    id: "biz-unsub-test",
    canonicalName: "Unsub Derm Clinic",
    domain: "unsubderm.com",
    website: "https://unsubderm.com",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 80,
    industryStatus: "verified",
    industryScore: 80,
    locationStatus: "verified",
    locationScore: 80,
    qualificationScore: 80,
    isQualified: true,
    verificationStatus: "verified",
    sources: [],
    branches: [],
    contacts: [{ id: "c-unsub", contactType: "email", value: "stop@unsubderm.com", ownershipType: "business_main", verificationStatus: "syntax_valid", verifiedAt: null, evidence: [] }],
    decisionMakers: [],
    evidence: [],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lead = createOrUpdateLeadFromBusiness(testBiz, "job-unsub");
  recordIncomingReply(lead.id, {
    channel: "email",
    body: "Please unsubscribe me immediately. Do not contact again.",
    senderEmail: "stop@unsubderm.com",
    classification: "unsubscribe",
  });

  assert.equal(isSuppressed("stop@unsubderm.com"), true, "Sender email must be auto-added to suppression list");
  const updatedLead = getLeadById(lead.id);
  assert.equal(updatedLead?.stage, "disqualified", "Unsubscribed lead must be moved to disqualified stage");

  // Verify that drafting & sending outreach to a suppressed lead is blocked
  const draft = createOutreachDraft(lead.id, {
    channel: "email",
    subject: "Follow-up attempt",
    body: "Checking back in",
  });
  assert.throws(
    () => {
      sendOrLogOutreach(draft.id);
    },
    /suppression list/i,
    "Attempting to send outreach to a suppressed contact must throw an error"
  );
});

test("Audit J: Security & SSRF Protection Controls", async () => {
  // 1. Private IPv4 loopback & LAN ranges
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.0.0.5"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("172.16.0.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true, "Cloud metadata IP must be private");

  // 2. IPv6 loopback
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("fc00::1"), true);

  // 3. Public IP must be safe
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);

  // 4. validateUrlSafe rejects internal hostnames
  const localRes = await validateUrlSafe("http://localhost:3000/internal", { skipDns: true });
  assert.equal(localRes.safe, false);
  assert.equal(localRes.reason, "blocked_hostname");

  const metaRes = await validateUrlSafe("http://metadata.google.internal/computeMetadata/v1", { skipDns: true });
  assert.equal(metaRes.safe, false);
  assert.equal(metaRes.reason, "blocked_hostname");

  const rawIpRes = await validateUrlSafe("http://169.254.169.254/latest/meta-data", { skipDns: true });
  assert.equal(rawIpRes.safe, false);
  assert.equal(rawIpRes.reason, "private_ip_blocked");

  // 5. Forbidden protocols
  const ftpRes = await validateUrlSafe("ftp://ftp.example.com/file");
  assert.equal(ftpRes.safe, false);
  assert.equal(ftpRes.reason, "forbidden_protocol");
});
