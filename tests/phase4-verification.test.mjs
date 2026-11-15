import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Phase 4: Business Verification Engine Verification Suite", () => {
  const vadodaraQuery = {
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    serviceTrack: "creative+technical",
    limit: 10,
  };

  test("1. Business Identity Verification scores domain alignment and distinct names", async () => {
    const { verifyBusinessIdentity } = await import("../lib/verification/identity.ts");

    // Strong domain alignment (Acura Skin Clinic -> acuraclinic.com)
    const strongCandidate = {
      companyName: "Acura Skin Clinic",
      website: "https://www.acuraclinic.com",
      domain: "acuraclinic.com",
      phone: "+91 265 233 4455",
      address: "Alkapuri, Vadodara",
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "mock",
      sourceUrl: "https://mock.example/lead",
      provider: "mock",
      confidence: "high",
    };

    const res = verifyBusinessIdentity(strongCandidate);
    assert.equal(res.status, "verified");
    assert.ok(res.score >= 70, "Should have high identity score");
    assert.equal(res.passed, true);
    assert.ok(res.evidence.length > 0, "Must generate identity evidence");

    // Generic name rejection
    const genericCandidate = {
      companyName: "Clinic",
      website: "https://www.clinic.com",
      domain: "clinic.com",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "mock",
      sourceUrl: "https://mock.example/generic",
      provider: "mock",
      confidence: "low",
    };
    const genericRes = verifyBusinessIdentity(genericCandidate);
    assert.equal(genericRes.status, "rejected");
    assert.equal(genericRes.passed, false);
  });

  test("2. Independent Industry Verification validates medical dermatology & penalizes mismatches", async () => {
    const { verifyIndustry } = await import("../lib/verification/industry.ts");

    // Authentic Dermatology Clinic
    const dermaClinic = {
      companyName: "Cutis Skin Care & Cosmetology",
      website: "https://www.cutisskincare.in",
      domain: "cutisskincare.in",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology and cosmetology skin clinic",
      description: "Advanced medical skin care, laser dermatology and hair treatment.",
      source: "mock",
      sourceUrl: "https://www.cutisskincare.in",
      provider: "mock",
      confidence: "high",
    };

    const dermaRes = verifyIndustry(dermaClinic, vadodaraQuery);
    assert.ok(dermaRes.score >= 50, "Should achieve passing industry score");
    assert.equal(dermaRes.passed, true);
    assert.ok(dermaRes.evidence.length > 0);

    // Unrelated Business in Vadodara (e.g. Software or Restaurant)
    const softwareCompany = {
      companyName: "Vadodara Cloud Software Solutions",
      website: "https://www.vadodaracloud.com",
      domain: "vadodaracloud.com",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Software development and cloud services",
      description: "Custom software engineering and devops.",
      source: "searxng",
      sourceUrl: "https://www.vadodaracloud.com",
      provider: "searxng",
      confidence: "medium",
    };

    const softwareRes = verifyIndustry(softwareCompany, vadodaraQuery);
    assert.ok(softwareRes.score < 50, "Software company must fail dermatology industry gate");
    assert.equal(softwareRes.passed, false);
  });

  test("3. Independent Location Verification checks city, phone STD code and rejects conflicts", async () => {
    const { verifyLocation } = await import("../lib/verification/location.ts");

    // Local Vadodara Clinic with STD code 0265
    const localClinic = {
      companyName: "Dr. Mahendra O. Shah Clinic",
      website: "https://www.drmahendrashah.com",
      domain: "drmahendrashah.com",
      phone: "+91 265 222 3344", // 265 is Vadodara STD code
      address: "Fatehgunj, Vadodara, Gujarat",
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/123",
      provider: "overpass",
      confidence: "high",
    };

    const localRes = verifyLocation(localClinic, vadodaraQuery);
    assert.ok(localRes.score >= 70, "Must receive high score for matching city, address, and STD code");
    assert.equal(localRes.passed, true);

    // Conflicting City (Mumbai clinic returned in search)
    const conflictingClinic = {
      companyName: "Kaya Skin Clinic Mumbai",
      website: "https://www.kayaclinic.com",
      domain: "kayaclinic.com",
      phone: "+91 22 2650 1122", // 022 is Mumbai
      address: "Bandra West, Mumbai",
      city: "Mumbai",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://www.kayaclinic.com",
      provider: "searxng",
      confidence: "medium",
    };

    const conflictRes = verifyLocation(conflictingClinic, vadodaraQuery);
    assert.equal(conflictRes.passed, false);
    assert.ok(conflictRes.reasons.some((r) => r.includes("conflict") || r.includes("Mumbai")));
  });

  test("4. Gatekeeper enforces hard eligibility gates (all 3 gates must pass)", async () => {
    const { evaluateBusinessVerification } = await import("../lib/verification/gatekeeper.ts");

    // Case A: Passes all 3 gates (Identity, Industry, Location)
    const validCandidate = {
      companyName: "SkinSio Advanced Dermatology",
      website: "https://www.skinsio.com",
      domain: "skinsio.com",
      phone: "+91 265 255 6677",
      address: "Sayajigunj, Vadodara",
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/456",
      provider: "overpass",
      confidence: "high",
    };

    const evalA = evaluateBusinessVerification(validCandidate, vadodaraQuery);
    assert.equal(evalA.isVerified, true);
    assert.ok(evalA.business, "Must create verified business entity");
    assert.equal(evalA.business.canonicalName, "SkinSio Advanced Dermatology");
    assert.equal(evalA.business.status, "researching");
    assert.equal(evalA.business.contacts[0].ownershipType, "business_main");

    // Case B: Passes Location + Identity but FAILS Industry
    const techInVadodara = {
      companyName: "Harborline Tech Vadodara",
      website: "https://www.harborline.com",
      domain: "harborline.com",
      phone: "+91 265 234 5678",
      address: "Alkapuri, Vadodara",
      city: "Vadodara",
      country: "India",
      industry: "Software consultancy",
      source: "searxng",
      sourceUrl: "https://www.harborline.com",
      provider: "searxng",
      confidence: "medium",
    };

    const evalB = evaluateBusinessVerification(techInVadodara, vadodaraQuery);
    assert.equal(evalB.isVerified, false, "Must reject because industry gate failed");
    assert.ok(evalB.rejectionReasons.some((r) => r.includes("Industry Verification Failed")));

    // Case C: Passes Industry + Identity but FAILS Location
    const dermaInMumbai = {
      companyName: "Mumbai Aesthetic Dermatology",
      website: "https://www.mumbaiaesthetic.com",
      domain: "mumbaiaesthetic.com",
      phone: "+91 22 2444 5555",
      address: "Andheri West, Mumbai",
      city: "Mumbai",
      country: "India",
      industry: "Dermatology clinic",
      source: "searxng",
      sourceUrl: "https://www.mumbaiaesthetic.com",
      provider: "searxng",
      confidence: "medium",
    };

    const evalC = evaluateBusinessVerification(dermaInMumbai, vadodaraQuery);
    assert.equal(evalC.isVerified, false, "Must reject because location gate failed");
    assert.ok(evalC.rejectionReasons.some((r) => r.includes("Location Verification Failed")));
  });

  test("5. Batch Verification evaluates candidates and outputs drop-off stats", async () => {
    const { verifyCandidateBatch } = await import("../lib/verification/gatekeeper.ts");

    const candidates = [
      {
        companyName: "Acura Skin Clinic",
        website: "https://www.acuraclinic.com",
        domain: "acuraclinic.com",
        phone: "+91 265 233 4455",
        city: "Vadodara",
        country: "India",
        industry: "Dermatology clinic",
        source: "mock",
        sourceUrl: "https://mock.example/1",
        provider: "mock",
        confidence: "high",
      },
      {
        companyName: "Vadodara Pizza House",
        website: "https://www.pizzahouse.com",
        domain: "pizzahouse.com",
        phone: "+91 265 211 1111",
        city: "Vadodara",
        country: "India",
        industry: "Restaurant",
        source: "mock",
        sourceUrl: "https://mock.example/2",
        provider: "mock",
        confidence: "low",
      },
    ];

    const batch = verifyCandidateBatch(candidates, vadodaraQuery);
    assert.equal(batch.stats.totalEvaluated, 2);
    assert.equal(batch.stats.verifiedCount, 1);
    assert.equal(batch.stats.rejectedCount, 1);
    assert.equal(batch.verifiedBusinesses[0].canonicalName, "Acura Skin Clinic");
    assert.equal(batch.rejectedCandidates[0].candidate.companyName, "Vadodara Pizza House");
  });

  test("6. Internal API /api/leads/:id/verify executes on-demand verification", async () => {
    const { POST } = await import("../app/api/leads/[id]/verify/route.ts");

    const req = new Request("http://localhost:3000/api/leads/lead-123/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate: {
          companyName: "Cutis Skin Care & Cosmetology",
          website: "https://www.cutisskincare.in",
          domain: "cutisskincare.in",
          phone: "+91 265 244 5566",
          city: "Vadodara",
          country: "India",
          industry: "Dermatology",
          source: "mock",
          sourceUrl: "https://mock.example/lead",
          provider: "mock",
          confidence: "high",
        },
        industry: "Dermatology clinics",
        city: "Vadodara",
        country: "India",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "lead-123" }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isVerified, true);
    assert.ok(body.data.identity.passed);
    assert.ok(body.data.industry.passed);
    assert.ok(body.data.location.passed);
    assert.equal(body.data.business.canonicalName, "Cutis Skin Care & Cosmetology");
  });
});

