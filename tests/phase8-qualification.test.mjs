import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateQualificationScores,
  calculateContactabilityScore,
  calculateDecisionMakerScore,
  evaluateServiceFit,
  FACTOR_WEIGHTS,
  HARD_GATES,
} from "../lib/qualification/index.ts";

test("Phase 8 - Weights and Factor Geometry: factor weights sum exactly to 1.0", () => {
  const sum =
    FACTOR_WEIGHTS.identity +
    FACTOR_WEIGHTS.industry +
    FACTOR_WEIGHTS.location +
    FACTOR_WEIGHTS.contactability +
    FACTOR_WEIGHTS.decisionMaker +
    FACTOR_WEIGHTS.serviceFit;

  assert.ok(Math.abs(sum - 1.0) < 0.0001, "Factor weights must sum to 1.0 (100%)");
  assert.equal(FACTOR_WEIGHTS.identity, 0.20);
  assert.equal(FACTOR_WEIGHTS.industry, 0.20);
  assert.equal(FACTOR_WEIGHTS.location, 0.15);
  assert.equal(FACTOR_WEIGHTS.contactability, 0.15);
  assert.equal(FACTOR_WEIGHTS.decisionMaker, 0.15);
  assert.equal(FACTOR_WEIGHTS.serviceFit, 0.15);
});

test("Phase 8 - Service Fit Engine: scores sub-optimal web presence as high creative+technical opportunity", () => {
  const mockBiz = {
    id: "biz-fit-001",
    canonicalName: "Aura Skin Clinic",
    website: "http://auraskin.in", // No HTTPS
    domain: "auraskin.in",
    industry: "Dermatology Clinic",
    city: "Vadodara",
    country: "India",
    address: "302 Alkapuri Plaza, Vadodara",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [
      {
        contactType: "phone",
        value: "0265-2345678",
        ownershipType: "reception",
        verificationStatus: "syntax_valid",
      },
    ],
    decisionMakers: [
      {
        fullName: "Dr. Anita Patel",
        role: "founder",
        roleLabel: "Founder & Medical Director",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [],
        contacts: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockIntel = {
    url: "http://auraskin.in",
    finalUrl: "http://auraskin.in",
    reachable: true,
    statusCode: 200,
    title: null, // missing title
    description: null, // missing description
    headings: ["Skin Care"],
    textSnippet: "General clinical care",
    metaTags: {},
    links: [],
    socialLinks: [],
    discoveredPages: { contact: null, about: null, team: null, services: null },
    hasHttps: false, // Opportunity!
    hasContactPage: false,
    hasTeamPage: true,
    hasCallToAction: false, // Opportunity!
    signals: ["no_https", "missing_title", "missing_meta_description"],
    fetchedAt: new Date().toISOString(),
  };

  const fitResult = evaluateServiceFit(mockBiz, mockIntel, {
    requestedIndustry: "Dermatology clinics",
    requestedCity: "Vadodara",
    requestedServiceTrack: "creative+technical",
  });

  // Since website lacks HTTPS, lacks CTA, and lacks title/meta description, opportunity score should be high
  assert.ok(fitResult.score >= 80);
  assert.ok(fitResult.signals.some((s) => s.id === "no_https"));
  assert.ok(fitResult.signals.some((s) => s.id === "weak_cta"));
  assert.ok(fitResult.signals.some((s) => s.id === "missing_title"));
  assert.ok(fitResult.signals.some((s) => s.id === "established_practice"));
});

test("Phase 8 - Contactability and Decision-Maker Scoring: evaluates channels and enforces UNKNOWN > WRONG", () => {
  // A. Business with rich contactability & verified founder
  const richBiz = {
    id: "biz-rich-001",
    canonicalName: "Aura Skin & Hair Clinic",
    domain: "auraskin.in",
    website: "https://auraskin.in",
    city: "Vadodara",
    country: "India",
    address: "Alkapuri, Vadodara",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [
      {
        contactType: "phone",
        value: "0265-2345678",
        ownershipType: "reception",
        verificationStatus: "syntax_valid",
      },
      {
        contactType: "email",
        value: "info@auraskin.in",
        ownershipType: "business_main",
        verificationStatus: "mx_valid",
      },
    ],
    decisionMakers: [
      {
        fullName: "Dr. Anita Patel",
        role: "founder",
        roleLabel: "Founder & Medical Director",
        profileUrl: "https://linkedin.com/in/dranitapatel",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [],
        contacts: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const contactScore = calculateContactabilityScore(richBiz);
  assert.ok(contactScore.score >= 85);
  assert.ok(contactScore.reasons.some((r) => r.includes("reception line")));
  assert.ok(contactScore.reasons.some((r) => r.includes("corporate email")));

  const dmScore = calculateDecisionMakerScore(richBiz);
  assert.ok(dmScore.score >= 85);
  assert.ok(dmScore.reasons.some((r) => r.includes("Founder")));

  // B. Business with NO decision maker (UNKNOWN > WRONG principle)
  const unknownOwnerBiz = {
    ...richBiz,
    decisionMakers: [],
  };

  const zeroDmScore = calculateDecisionMakerScore(unknownOwnerBiz);
  assert.equal(zeroDmScore.score, 0);
  assert.ok(zeroDmScore.reasons.some((r) => r.includes("UNKNOWN > WRONG")));
});

test("Phase 8 - Hard Eligibility Gates: high score CANNOT bypass failed location gate (UNKNOWN > WRONG)", () => {
  // Lead is located in Mumbai, not the target city Vadodara
  const wrongCityBiz = {
    id: "biz-mumbai-001",
    canonicalName: "Mumbai Laser Clinic",
    domain: "mumbailaser.com",
    website: "https://mumbailaser.com",
    city: "Mumbai", // Conflict!
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [
      {
        contactType: "phone",
        value: "022-26001234", // Mumbai STD 022
        ownershipType: "business_main",
        verificationStatus: "syntax_valid",
      },
    ],
    decisionMakers: [
      {
        fullName: "Dr. Rajesh Kothari",
        role: "founder",
        roleLabel: "Founder",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 90,
        evidence: [],
        contacts: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scores = calculateQualificationScores(wrongCityBiz, null, {
    requestedIndustry: "Dermatology clinics",
    requestedCity: "Vadodara",
    requestedServiceTrack: "creative+technical",
  });

  // Master Brief Rule: Even if identity and service fit are high, it must fail the Location Gate!
  assert.equal(scores.isQualified, false);
  assert.equal(scores.status, "rejected");
  assert.ok(scores.gateFailures.length > 0);
  assert.ok(scores.gateFailures.some((g) => g.includes("Location Gate")));
  assert.ok(scores.explanation.includes("Failed Location Gate"));
});

test("Phase 8 - Hard Eligibility Gates: rejects when identity or industry gate fails", () => {
  // Unverified identity (score < 60)
  const weakIdentityBiz = {
    id: "biz-weak-001",
    canonicalName: "Unknown Entity",
    domain: null,
    website: null,
    city: "Vadodara",
    country: "India",
    identityStatus: "unverified",
    identityScore: 40, // Below 60 threshold
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [],
    decisionMakers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scores = calculateQualificationScores(weakIdentityBiz, null, {
    requestedIndustry: "Dermatology clinics",
    requestedCity: "Vadodara",
  });

  assert.equal(scores.isQualified, false);
  assert.equal(scores.status, "rejected");
  assert.ok(scores.gateFailures.some((g) => g.includes("Identity Gate")));
});

test("Phase 8 - Transparent Explanations & Full Pipeline: qualifies genuine prospect with explanation", () => {
  const genuineBiz = {
    id: "biz-vadodara-genuine",
    canonicalName: "Aura Skin & Hair Clinic",
    domain: "auraskin.in",
    website: "https://auraskin.in",
    industry: "Dermatology Clinic",
    city: "Vadodara",
    country: "India",
    address: "302 Alkapuri Plaza, RC Dutt Road, Vadodara, Gujarat",
    identityStatus: "verified",
    identityScore: 92,
    qualificationScore: 0,
    status: "researching",
    sources: [
      {
        sourceUrl: "https://auraskin.in",
        sourceHost: "auraskin.in",
        sourceType: "official_website",
        evidenceText: "Industry verification score: 85. Medical dermatology clinic.",
        discoveredAt: new Date().toISOString(),
      },
    ],
    contacts: [
      {
        contactType: "phone",
        value: "0265-2345678",
        ownershipType: "reception",
        verificationStatus: "syntax_valid",
      },
      {
        contactType: "email",
        value: "info@auraskin.in",
        ownershipType: "business_main",
        verificationStatus: "mx_valid",
      },
    ],
    decisionMakers: [
      {
        fullName: "Dr. Anita Patel",
        role: "founder",
        roleLabel: "Founder & Medical Director",
        profileUrl: "https://linkedin.com/in/dranitapatel",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [],
        contacts: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scores = calculateQualificationScores(genuineBiz, null, {
    requestedIndustry: "Dermatology clinics",
    requestedCity: "Vadodara",
    requestedServiceTrack: "creative+technical",
  });

  // Verify all 3 hard gates passed
  assert.equal(scores.gateFailures.length, 0);
  assert.ok(scores.identityScore >= HARD_GATES.minIdentityScore);
  assert.ok(scores.industryScore >= HARD_GATES.minIndustryScore);
  assert.ok(scores.locationScore >= HARD_GATES.minLocationScore);

  // Overall qualification
  assert.ok(scores.overallScore >= HARD_GATES.minQualifiedOverallScore);
  assert.equal(scores.isQualified, true);
  assert.equal(scores.status, "qualified");

  // Transparent explanation
  assert.ok(scores.explanation.includes("Qualified prospect"));
  assert.ok(scores.explanation.includes("Vadodara"));
  assert.equal(scores.reasons.length, 6); // 1 breakdown per factor
});

