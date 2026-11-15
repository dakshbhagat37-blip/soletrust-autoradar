import test from "node:test";
import assert from "node:assert/strict";

import {
  createOrUpdateLeadFromBusiness,
  getLeadById,
  updateLeadStage,
  getLeadActivities,
  createOutreachDraft,
  sendOrLogOutreach,
  recordIncomingReply,
  listFollowUps,
  scheduleMeeting,
  createDeal,
  updateDealStage,
  listCustomers,
  calculateCrmDashboardMetrics,
  resetCrmStoreForTesting,
} from "../lib/crm/store.ts";
import { generateAiSalesStrategy } from "../lib/crm/ai-strategy.ts";

test("Phase 11 - Full CRM & Sales Lifecycle Verification Suite", async (t) => {
  resetCrmStoreForTesting();
  const sampleBusiness = {
    id: "biz-vadodara-cutis-001",
    canonicalName: "Cutis Skin Care & Cosmetology",
    website: "https://cutisskincare.in",
    domain: "cutisskincare.in",
    industry: "Dermatology Clinic",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 87,
    qualificationScore: 88,
    status: "qualified",
    serviceTrack: "creative+technical",
    sources: [
      {
        sourceUrl: "https://cutisskincare.in",
        sourceHost: "cutisskincare.in",
        sourceType: "official_website",
        evidenceText: "Advanced laser dermatology and clinical skin care in Race Course, Vadodara",
        discoveredAt: new Date().toISOString(),
      },
    ],
    contacts: [
      {
        id: "c-1",
        businessId: "biz-vadodara-cutis-001",
        contactType: "phone",
        contactValue: "+91 265 244 5566",
        ownershipType: "reception",
        verificationStatus: "confirmed",
      },
      {
        id: "c-2",
        businessId: "biz-vadodara-cutis-001",
        contactType: "email",
        contactValue: "dr.chirag@cutisskincare.in",
        ownershipType: "decision_maker_direct",
        verificationStatus: "domain_valid",
      },
    ],
    decisionMakers: [
      {
        id: "dm-1",
        businessId: "biz-vadodara-cutis-001",
        fullName: "Dr. Chirag Desai",
        role: "Founder & Lead Dermatologist",
        roleLabel: "Founder & Lead Dermatologist",
        credentials: ["MD", "DDVL"],
        specialization: "Clinical & Aesthetic Dermatology",
        email: "dr.chirag@cutisskincare.in",
        phone: null,
        linkedinUrl: "https://linkedin.com/in/dr-chirag-desai",
        verificationStatus: "verified",
        confidenceScore: 95,
      },
    ],
    qualification: {
      overallScore: 88,
      isQualified: true,
      serviceFitScore: 80,
      reasons: ["No automated mobile booking CTA", "Outdated mobile viewport"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let lead;

  await t.test("1. Lead creation from business discovery", () => {
    lead = createOrUpdateLeadFromBusiness(sampleBusiness);
    assert.ok(lead.id);
    assert.equal(lead.companyName, "Cutis Skin Care & Cosmetology");
    assert.equal(lead.stage, "qualified");
    assert.equal(lead.qualificationScore, 88);
    assert.equal(lead.city, "Vadodara");
  });

  await t.test("2. Initial activity timeline contains complete provenance", () => {
    const activities = getLeadActivities(lead.id);
    assert.ok(activities.length >= 3);
    const types = activities.map((a) => a.activityType);
    assert.ok(types.includes("lead_created"));
    assert.ok(types.includes("business_discovered"));
    assert.ok(types.includes("business_verified"));
    assert.ok(types.includes("lead_qualified"));
  });

  await t.test("3. Evidence-backed AI Sales Strategy generates Why/Who/What/How", () => {
    const strategy = generateAiSalesStrategy(sampleBusiness, lead);
    assert.equal(strategy.leadId, lead.id);

    // Why Contact
    assert.ok(strategy.whyContact.summary.includes("Cutis Skin Care & Cosmetology"));
    assert.ok(strategy.whyContact.locationRelevance.includes("Vadodara"));

    // Who Contact (preserves Dr. Chirag Desai MD, DDVL)
    assert.ok(strategy.whoContact.recommendedPerson.includes("Dr. Chirag Desai"));
    assert.ok(strategy.whoContact.recommendedPerson.includes("MD"));
    assert.equal(strategy.whoContact.role, "Founder & Lead Dermatologist");

    // What Offer
    assert.ok(strategy.whatOffer.primaryService);
    assert.ok(strategy.whatOffer.valueProposition);

    // How Approach (tailored drafts)
    assert.ok(strategy.howApproach.emailDraft.subject.includes("Cutis Skin Care & Cosmetology"));
    assert.ok(strategy.howApproach.emailDraft.body.includes("Dr. Chirag Desai"));
    assert.ok(strategy.howApproach.linkedinDraft.connectionNote.includes("Vadodara"));
    assert.ok(strategy.howApproach.phoneScript.qualifyingQuestions.length >= 2);
  });

  let outreach;
  await t.test("4. Outreach drafting and sending advances lead stage to 'contacted'", () => {
    outreach = createOutreachDraft(lead.id, {
      channel: "email",
      subject: "Appointment Booking for Cutis Skin Care",
      body: "Hello Dr. Desai, we noticed an opportunity...",
    });
    assert.equal(outreach.status, "draft");

    const sent = sendOrLogOutreach(outreach.id, {
      provider: "Gmail SMTP",
      deliveryConfirmed: true,
    });
    assert.equal(sent.status, "delivered");
    assert.ok(sent.sentAt);
    assert.ok(sent.deliveredAt);

    // Verify lead stage advanced to contacted
    const updatedLead = getLeadById(lead.id);
    assert.equal(updatedLead.stage, "contacted");
    assert.ok(updatedLead.firstContactedAt);

    // Verify auto-scheduled follow-up
    const followUps = listFollowUps(lead.id);
    assert.ok(followUps.length > 0);
    assert.equal(followUps[0].status, "pending");
  });

  await t.test("5. Inbound positive reply pauses follow-ups & advances stage to 'engaged'", () => {
    const replyRes = recordIncomingReply(lead.id, {
      channel: "email",
      body: "Hi! Yes, we have been looking to upgrade our booking calendar. Can you show us a demo tomorrow?",
      senderName: "Dr. Chirag Desai",
      senderEmail: "dr.chirag@cutisskincare.in",
      classification: "positive",
    });

    assert.equal(replyRes.lead.stage, "engaged");

    // Verify pending follow-up is now paused
    const followUps = listFollowUps(lead.id);
    assert.equal(followUps[0].status, "paused");
    assert.ok(followUps[0].pausedReason.includes("Paused due to incoming reply"));
  });

  let meeting;
  await t.test("6. Meeting scheduling advances stage to 'meeting_scheduled'", () => {
    meeting = scheduleMeeting({
      leadId: lead.id,
      title: "Clinic Growth & Booking Demo with Dr. Chirag",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      attendees: [{ name: "Dr. Chirag Desai", email: "dr.chirag@cutisskincare.in" }],
    });

    assert.ok(meeting.id);
    assert.equal(meeting.status, "scheduled");

    const updatedLead = getLeadById(lead.id);
    assert.equal(updatedLead.stage, "meeting_scheduled");
  });

  let deal;
  await t.test("7. Deal creation records proposal stage", () => {
    deal = createDeal({
      leadId: lead.id,
      title: "Cutis Clinic Booking Architecture Contract",
      amount: 120000,
      currency: "INR",
      stage: "proposal",
    });

    assert.ok(deal.id);
    assert.equal(deal.amount, 120000);
    assert.equal(deal.stage, "proposal");

    const updatedLead = getLeadById(lead.id);
    assert.equal(updatedLead.stage, "proposal_sent");
  });

  await t.test("8. Winning deal automatically converts lead to active Customer", () => {
    const winResult = updateDealStage(deal.id, "won");
    assert.equal(winResult.deal.stage, "won");
    assert.equal(winResult.deal.probability, 100);
    assert.ok(winResult.customer);
    assert.equal(winResult.customer.companyName, "Cutis Skin Care & Cosmetology");
    assert.equal(winResult.customer.totalRevenue, 120000);
    assert.equal(winResult.customer.status, "active");

    const updatedLead = getLeadById(lead.id);
    assert.equal(updatedLead.stage, "won");

    const customers = listCustomers();
    assert.ok(customers.some((c) => c.companyName === "Cutis Skin Care & Cosmetology"));
  });

  await t.test("9. Unsubscribe reply automatically disqualifies lead", () => {
    const unsubBusiness = {
      id: "biz-unsub-test-999",
      canonicalName: "Unsubscribe Test Clinic",
      qualificationScore: 70,
      status: "qualified",
      sources: [],
    };
    const unsubLead = createOrUpdateLeadFromBusiness(unsubBusiness);
    updateLeadStage(unsubLead.id, "contacted");

    recordIncomingReply(unsubLead.id, {
      channel: "email",
      body: "Please unsubscribe me from your list.",
      senderEmail: "stop@unsubtest.com",
      classification: "unsubscribe",
    });

    const refreshed = getLeadById(unsubLead.id);
    assert.equal(refreshed.stage, "disqualified");
    assert.ok(refreshed.lostReason.includes("Unsubscribe"));
  });

  await t.test("10. Analytics dashboard calculates real events and conversion rates", () => {
    const metrics = calculateCrmDashboardMetrics();
    assert.ok(metrics.totalDiscovered >= 2);
    assert.ok(metrics.messagesSent >= 1);
    assert.ok(metrics.messagesDelivered >= 1);
    assert.ok(metrics.actualReplies >= 2);
    assert.ok(metrics.positiveReplies >= 1);
    assert.ok(metrics.wonDeals >= 1);
    assert.equal(metrics.actualRevenue, 120000);
    assert.ok(metrics.conversionRates.outreachToReply > 0);
  });
});
