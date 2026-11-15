import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialSearchJob,
  saveSearchJob,
} from "../lib/jobs/store.ts";

import { POST as executePipeline } from "../app/api/search-jobs/[id]/execute/route.ts";
import { FACTOR_WEIGHTS } from "../lib/qualification/calculator.ts";

test("Phase 10 - Acceptance Benchmark: 10 Dermatology Clinics in Vadodara, India (Creative + Technical)", async () => {
  // 1. Initialize search job matching the exact user brief
  const job = createInitialSearchJob({
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    limit: 10,
    serviceTrack: "creative+technical",
  });
  await saveSearchJob(job);

  assert.equal(job.status, "pending");
  assert.equal(job.progress, 0);

  // 2. Execute end-to-end AutoRadar intelligence pipeline
  const request = new Request(`http://localhost:3000/api/search-jobs/${job.id}/execute`, {
    method: "POST",
  });

  const response = await executePipeline(request, {
    params: Promise.resolve({ id: job.id }),
  });

  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.ok(json.data);

  const { job: completedJob, businesses, qualifiedCount } = json.data;

  // 3. Verify Job Completion State
  assert.equal(completedJob.id, job.id);
  assert.equal(completedJob.status, "completed");
  assert.equal(completedJob.currentStage, "completed");
  assert.equal(completedJob.progress, 100);
  assert.ok(completedJob.completedAt);

  // 4. Verify Pipeline Waterfall Stage Metrics
  assert.equal(completedJob.stageStats.candidatesFound, 10, "Should discover 10 candidate clinics");
  assert.equal(completedJob.stageStats.uniqueBusinesses, 10, "Should deduplicate to 10 unique businesses");
  assert.ok(completedJob.stageStats.identityVerified >= 10, "Identity gate must evaluate all candidates");
  assert.ok(completedJob.stageStats.industryVerified >= 10, "Industry gate must evaluate all candidates");
  assert.ok(completedJob.stageStats.locationVerified >= 10, "Location gate must evaluate all candidates");
  assert.ok(qualifiedCount >= 5, "Must qualify high-confidence dermatology clinics");
  assert.equal(businesses.length, 10, "Should return 10 evaluated clinic leads");

  // 5. Verify Ranking: Results must be strictly sorted by qualification score descending
  for (let i = 0; i < businesses.length - 1; i++) {
    assert.ok(
      businesses[i].qualificationScore >= businesses[i + 1].qualificationScore,
      `Lead at index ${i} (${businesses[i].qualificationScore}) must have score >= lead at ${i + 1} (${businesses[i + 1].qualificationScore})`
    );
  }

  // 6. Verify 6-Factor Mathematical Transparency for Each Lead
  for (const biz of businesses) {
    const qual = biz.qualification;
    assert.ok(qual, `Business ${biz.canonicalName} must have qualification breakdown`);

    // Verify factor score ranges [0, 100]
    assert.ok(qual.identityScore >= 0 && qual.identityScore <= 100);
    assert.ok(qual.industryScore >= 0 && qual.industryScore <= 100);
    assert.ok(qual.locationScore >= 0 && qual.locationScore <= 100);
    assert.ok(qual.contactabilityScore >= 0 && qual.contactabilityScore <= 100);
    assert.ok(qual.decisionMakerScore >= 0 && qual.decisionMakerScore <= 100);
    assert.ok(qual.serviceFitScore >= 0 && qual.serviceFitScore <= 100);
    assert.ok(qual.overallScore >= 0 && qual.overallScore <= 100);

    // Verify mathematical weighting formula
    const expectedScore = Math.round(
      qual.identityScore * FACTOR_WEIGHTS.identity +
      qual.industryScore * FACTOR_WEIGHTS.industry +
      qual.locationScore * FACTOR_WEIGHTS.location +
      qual.contactabilityScore * FACTOR_WEIGHTS.contactability +
      qual.decisionMakerScore * FACTOR_WEIGHTS.decisionMaker +
      qual.serviceFitScore * FACTOR_WEIGHTS.serviceFit
    );
    assert.equal(
      qual.overallScore,
      expectedScore,
      `Overall score (${qual.overallScore}) must match weighted sum (${expectedScore})`
    );

    // Verify explanation string is present and human-readable
    assert.ok(qual.explanation.length > 20, "Explanation must be detailed");
    assert.ok(Array.isArray(qual.reasons) && qual.reasons.length > 0);
  }
});

test("Phase 10 - UNKNOWN > WRONG Enforcement Across Discovered Leads", async () => {
  const job = createInitialSearchJob({
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    limit: 5,
    serviceTrack: "creative+technical",
  });
  await saveSearchJob(job);

  const request = new Request(`http://localhost:3000/api/search-jobs/${job.id}/execute`, {
    method: "POST",
  });

  const response = await executePipeline(request, {
    params: Promise.resolve({ id: job.id }),
  });

  const json = await response.json();
  const businesses = json.data.businesses;

  for (const b of businesses) {
    // 1. Reception phones must never be attributed to decision-makers
    for (const c of b.contacts) {
      if (c.contactType === "phone") {
        if (c.ownershipType === "reception" || c.ownershipType === "business_main") {
          assert.equal(
            c.decisionMakerId,
            undefined,
            `Reception phone line (${c.value}) must NOT have a decisionMakerId`
          );
        }
      }
    }

    // 2. If decision maker is unknown, decisionMakers array is empty and score reflects this honestly
    if (b.decisionMakers.length === 0) {
      assert.equal(b.qualification.decisionMakerScore, 0);
      assert.ok(
        b.qualification.reasons.some((r) => r.includes("UNKNOWN > WRONG")),
        "Reason must explicitly state UNKNOWN > WRONG when decision maker is missing"
      );
    }

    // 3. Vadodara STD code or Indian mobile verification
    if (b.phone) {
      assert.ok(
        b.phone.includes("265") || b.phone.startsWith("+91"),
        `Phone ${b.phone} must match Vadodara STD (0265) or Indian mobile prefix (+91)`
      );
    }
  }
});

test("Phase 10 - Hard Verification Gates Enforce Non-Bypassability", async () => {
  const { calculateQualificationScores } = await import("../lib/qualification/calculator.ts");

  // Create a base business object
  const baseBiz = {
    id: "test-biz-id",
    canonicalName: "Test Clinic",
    domain: "testclinic.in",
    website: "https://testclinic.in",
    city: "Vadodara",
    country: "India",
    address: "Alkapuri, Vadodara, Gujarat 390007",
    industry: "Dermatology",
    identityStatus: "verified",
    identityScore: 90,
    sources: [{ id: "src-1", provider: "mock", evidenceText: "Industry score: 90", url: "https://testclinic.in" }],
    contacts: [
      { id: "c-1", contactType: "phone", value: "+91 265 233 4455", ownershipType: "reception" },
      { id: "c-2", contactType: "email", value: "info@testclinic.in", ownershipType: "business_main", verificationStatus: "mx_valid" }
    ],
    decisionMakers: [],
  };

  // Case 1: Low Identity (< 60)
  const failedIdentity = calculateQualificationScores({
    ...baseBiz,
    identityScore: 40,
    identityStatus: "unverified",
  });
  assert.equal(failedIdentity.isQualified, false);
  assert.equal(failedIdentity.status, "rejected");
  assert.ok(failedIdentity.gateFailures.some((g) => g.includes("Failed Identity Gate")));

  // Case 2: Low Industry (< 50)
  const failedIndustry = calculateQualificationScores({
    ...baseBiz,
    industry: "Accounting",
    sources: [{ id: "src-1", provider: "mock", evidenceText: "Industry relevance score: 30", url: "https://testclinic.in" }],
  });
  assert.equal(failedIndustry.isQualified, false);
  assert.equal(failedIndustry.status, "rejected");
  assert.ok(failedIndustry.gateFailures.some((g) => g.includes("Failed Industry Gate")));

  // Case 3: Low Location (< 50)
  const failedLocation = calculateQualificationScores(
    {
      ...baseBiz,
      city: "Mumbai",
      contacts: [],
    },
    null,
    { requestedCity: "Vadodara" }
  );
  assert.equal(failedLocation.isQualified, false);
  assert.equal(failedLocation.status, "rejected");
  assert.ok(failedLocation.gateFailures.some((g) => g.includes("Failed Location Gate")));

  // Case 4: Passes all hard gates and threshold (>= 65)
  const passedAll = calculateQualificationScores(baseBiz, null, {
    requestedCity: "Vadodara",
    requestedIndustry: "Dermatology",
    requestedCountry: "India",
  });
  assert.equal(passedAll.isQualified, true);
  assert.equal(passedAll.status, "qualified");
  assert.equal(passedAll.gateFailures.length, 0);
});
