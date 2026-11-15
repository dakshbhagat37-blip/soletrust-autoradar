import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialSearchJob,
  saveSearchJob,
} from "../lib/jobs/store.ts";

import { POST as executePipeline } from "../app/api/search-jobs/[id]/execute/route.ts";

test("Phase 9 - Pipeline Execution API: executes full 8-stage intelligence workflow for Vadodara Dermatology clinics", async () => {
  // Create an initial job for the Vadodara use case
  const initialJob = createInitialSearchJob({
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    limit: 5,
    serviceTrack: "creative+technical",
  });
  await saveSearchJob(initialJob);

  const request = new Request(`http://localhost:3000/api/search-jobs/${initialJob.id}/execute`, {
    method: "POST",
  });

  const response = await executePipeline(request, {
    params: Promise.resolve({ id: initialJob.id }),
  });

  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.ok(json.data);

  const { job, businesses, qualifiedCount, reviewCount, rejectedCount } = json.data;

  // Job status assertions
  assert.equal(job.id, initialJob.id);
  assert.equal(job.status, "completed");
  assert.equal(job.currentStage, "completed");
  assert.equal(job.progress, 100);
  assert.ok(job.completedAt);

  // Stage stats verification
  assert.ok(job.stageStats.candidatesFound >= 1);
  assert.ok(job.stageStats.uniqueBusinesses >= 1);
  assert.ok(job.stageStats.identityVerified >= 1);
  assert.ok(job.stageStats.locationVerified >= 1);
  assert.ok(qualifiedCount + reviewCount + rejectedCount === businesses.length);

  // Business verification and intelligence assertions
  assert.ok(businesses.length >= 1);
  for (const b of businesses) {
    // 6-Factor Qualification
    assert.ok(b.qualification);
    assert.ok(typeof b.qualification.identityScore === "number");
    assert.ok(typeof b.qualification.industryScore === "number");
    assert.ok(typeof b.qualification.locationScore === "number");
    assert.ok(typeof b.qualification.contactabilityScore === "number");
    assert.ok(typeof b.qualification.decisionMakerScore === "number");
    assert.ok(typeof b.qualification.serviceFitScore === "number");
    assert.ok(b.qualification.explanation);

    // UNKNOWN > WRONG Compliance:
    // Any phone extracted from business website must NOT be attributed to a decision-maker
    for (const c of b.contacts) {
      if (c.contactType === "phone" && (c.ownershipType === "reception" || c.ownershipType === "business_main")) {
        assert.ok(!c.decisionMakerId, "Reception phone line must NEVER have decisionMakerId!");
      }
    }
  }
});

test("Phase 9 - Pipeline Execution API: returns 404 on nonexistent search job ID", async () => {
  const request = new Request("http://localhost:3000/api/search-jobs/nonexistent-id/execute", {
    method: "POST",
  });

  const response = await executePipeline(request, {
    params: Promise.resolve({ id: "nonexistent-id" }),
  });

  assert.equal(response.status, 404);
  const json = await response.json();
  assert.equal(json.success, false);
  assert.equal(json.error.code, "NOT_FOUND");
});

test("Phase 9 - Ranked Qualified Leads: qualified leads are sorted in descending order of score", async () => {
  const initialJob = createInitialSearchJob({
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    limit: 5,
    serviceTrack: "creative+technical",
  });
  await saveSearchJob(initialJob);

  const request = new Request(`http://localhost:3000/api/search-jobs/${initialJob.id}/execute`, {
    method: "POST",
  });

  const response = await executePipeline(request, {
    params: Promise.resolve({ id: initialJob.id }),
  });

  const json = await response.json();
  const businesses = json.data.businesses;

  // Verify descending sort order
  for (let i = 0; i < businesses.length - 1; i++) {
    assert.ok(
      businesses[i].qualificationScore >= businesses[i + 1].qualificationScore,
      `Business at index ${i} score (${businesses[i].qualificationScore}) must be >= index ${i + 1} (${businesses[i + 1].qualificationScore})`
    );
  }
});
