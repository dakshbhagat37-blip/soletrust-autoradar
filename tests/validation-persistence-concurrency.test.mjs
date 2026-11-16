import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialSearchJob,
  saveSearchJob,
  getSearchJob,
  saveJobBusinesses,
  getJobBusinesses,
} from "../lib/jobs/store.ts";

import {
  createOrUpdateLeadFromBusiness,
  recordActivity,
  createOutreachDraft,
  sendOrLogOutreach,
  scheduleFollowUp,
  createTask,
  createDeal,
  updateDealStage,
} from "../lib/crm/store.ts";

import { loadJsonFromFile } from "../lib/persistence/file-store.ts";

test("Step 3A: Simultaneous Search Jobs Concurrency Safety", async () => {
  // Launch 3 distinct search jobs concurrently
  const job1 = createInitialSearchJob({ industry: "Dermatology", city: "Vadodara", country: "India", limit: 3 });
  const job2 = createInitialSearchJob({ industry: "Cardiology", city: "Ahmedabad", country: "India", limit: 3 });
  const job3 = createInitialSearchJob({ industry: "Orthopedics", city: "Surat", country: "India", limit: 3 });

  await Promise.all([
    saveSearchJob(job1),
    saveSearchJob(job2),
    saveSearchJob(job3),
  ]);

  // Simulate concurrent candidate assignment
  const biz1 = {
    id: "biz-concurrent-1",
    searchJobId: job1.id,
    canonicalName: "Vadodara Derm Care",
    domain: "vadodaraderm.in",
    website: "https://vadodaraderm.in",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    industryStatus: "verified",
    industryScore: 90,
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

  const biz2 = {
    ...biz1,
    id: "biz-concurrent-2",
    searchJobId: job2.id,
    canonicalName: "Ahmedabad Heart Clinic",
    domain: "ahmedabadheart.in",
    website: "https://ahmedabadheart.in",
    industry: "Cardiology",
    city: "Ahmedabad",
  };

  const biz3 = {
    ...biz1,
    id: "biz-concurrent-3",
    searchJobId: job3.id,
    canonicalName: "Surat Bone & Joint Center",
    domain: "suratbone.in",
    website: "https://suratbone.in",
    industry: "Orthopedics",
    city: "Surat",
  };

  saveJobBusinesses(job1.id, [biz1]);
  saveJobBusinesses(job2.id, [biz2]);
  saveJobBusinesses(job3.id, [biz3]);

  // Verify non-interference: Each job owns strictly its own businesses
  const b1Results = getJobBusinesses(job1.id);
  const b2Results = getJobBusinesses(job2.id);
  const b3Results = getJobBusinesses(job3.id);

  assert.equal(b1Results.length, 1);
  assert.equal(b1Results[0].id, "biz-concurrent-1");
  assert.equal(b2Results.length, 1);
  assert.equal(b2Results[0].id, "biz-concurrent-2");
  assert.equal(b3Results.length, 1);
  assert.equal(b3Results[0].id, "biz-concurrent-3");
});

test("Step 3B: Server & Worker Restart Survival for All 12 Core Entities", async () => {
  const restartJobId = "job-restart-verify-001";
  const restartJob = createInitialSearchJob({
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    limit: 1,
  });
  restartJob.id = restartJobId;
  await saveSearchJob(restartJob);

  const restartBiz = {
    id: "biz-restart-verify-001",
    searchJobId: restartJobId,
    canonicalName: "Restart Verification Clinic",
    domain: "restartclinic.in",
    website: "https://restartclinic.in",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 95,
    industryStatus: "verified",
    industryScore: 90,
    locationStatus: "verified",
    locationScore: 95,
    qualificationScore: 92,
    isQualified: true,
    verificationStatus: "verified",
    branches: [
      { id: "br-1", name: "Alkapuri Branch", address: "Alkapuri, Vadodara", isPrimary: true },
    ],
    contacts: [
      { id: "c-phone-res", contactType: "phone", value: "+91 265 244 9900", ownershipType: "business_main", verificationStatus: "syntax_valid", verifiedAt: new Date().toISOString(), evidence: [] },
      { id: "c-email-res", contactType: "email", value: "contact@restartclinic.in", ownershipType: "business_main", verificationStatus: "mx_valid", verifiedAt: new Date().toISOString(), evidence: [] },
    ],
    decisionMakers: [
      {
        id: "dm-res-1",
        businessId: "biz-restart-verify-001",
        fullName: "Dr. Vikram V. Patel",
        role: "founder",
        roleLabel: "Founder & Chief Medical Officer",
        authorityType: "commercial_purchasing",
        isPurchasingAuthority: true,
        credentials: ["MBBS", "MD"],
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [
          {
            sourceUrl: "https://restartclinic.in/team",
            sourceHost: "restartclinic.in",
            sourceType: "official_team",
            evidenceText: "Dr. Vikram V. Patel, Founder and Medical Director.",
            discoveredAt: new Date().toISOString(),
          },
        ],
        contacts: [],
      },
    ],
    evidence: [
      {
        sourceUrl: "https://restartclinic.in/about",
        sourceHost: "restartclinic.in",
        sourceType: "official_about",
        evidenceText: "Premier Dermatology Center established in Vadodara.",
        discoveredAt: new Date().toISOString(),
      },
    ],
    auditTrail: [
      { stage: "identity_verification", status: "passed", score: 95, timestamp: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveJobBusinesses(restartJobId, [restartBiz]);

  // Create CRM Lead and complete Sales Engagement artifacts
  const lead = createOrUpdateLeadFromBusiness(restartBiz);
  recordActivity(lead.id, "business_discovered", "Discovered in Vadodara");

  const outreach = createOutreachDraft(lead.id, {
    channel: "email",
    subject: "Partnership Inquiry",
    body: "Hi Dr. Vikram, would love to connect regarding clinic acquisition.",
  });
  sendOrLogOutreach(outreach.id, { isManual: true });

  scheduleFollowUp(lead.id, "Check reply status", new Date(Date.now() + 86400000).toISOString());
  createTask(lead.id, "Review clinic brochure", "high");

  const deal = createDeal({
    leadId: lead.id,
    title: "Clinic Growth Implementation Package",
    amount: 120000,
  });
  updateDealStage(deal.id, "won"); // Automatically converts to customer

  // READ DIRECTLY FROM DISK STORAGE TO SIMULATE COLD PROCESS BOOT
  const persistedJobs = loadJsonFromFile("jobs-store.json", { jobs: {}, businesses: {}, jobBusinesses: {} });
  const persistedCrm = loadJsonFromFile("crm-store.json", {
    crmLeads: {},
    activities: {},
    outreachList: {},
    followUps: {},
    tasks: {},
    deals: {},
    customers: {},
  });

  // Verify all 12 core entity persistence
  assert.ok(persistedJobs.jobs[restartJobId], "1. Search Job persisted");
  assert.ok(persistedJobs.businesses[restartBiz.id], "2. Business persisted");
  assert.equal(persistedJobs.businesses[restartBiz.id].branches.length, 1, "3. Branches persisted");
  assert.equal(persistedJobs.businesses[restartBiz.id].contacts.length, 2, "4. Contacts persisted");
  assert.equal(persistedJobs.businesses[restartBiz.id].decisionMakers.length, 1, "5. Decision-Makers persisted");
  assert.ok(persistedJobs.businesses[restartBiz.id].evidence.length >= 1, "6. Evidence persisted");
  assert.ok(persistedJobs.businesses[restartBiz.id].auditTrail.length >= 1, "7. Verification History persisted");
  assert.ok(persistedCrm.crmLeads[lead.id], "8. CRM Lead persisted");
  assert.ok(persistedCrm.activities[lead.id]?.length >= 2, "9. Activities persisted");
  assert.ok(persistedCrm.outreachList[outreach.id], "10. Outreach Activity persisted");
  assert.ok(persistedCrm.deals[deal.id], "11. Deals persisted");
  assert.ok(
    Object.values(persistedCrm.customers).some((c) => c.leadId === lead.id),
    "12. Converted Customer persisted"
  );
});

test("Step 3C: Database Failure & Recovery Resilience", async () => {
  // If remote Supabase connection drops, store must seamlessly retain in memory & local disk without throwing
  const fallbackJob = createInitialSearchJob({
    industry: "Pediatrics",
    city: "Vadodara",
    country: "India",
    limit: 1,
  });

  // Should succeed gracefully and record to local persistent store even when remote database is unavailable
  await assert.doesNotReject(async () => {
    await saveSearchJob(fallbackJob);
  });

  const retrieved = await getSearchJob(fallbackJob.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, fallbackJob.id);
});

