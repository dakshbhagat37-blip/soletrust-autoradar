import test from "node:test";
import assert from "node:assert/strict";

import {
  matchRoleInText,
} from "../lib/decision-makers/roles.ts";

import {
  parsePersonName,
} from "../lib/decision-makers/name-parser.ts";

import {
  extractDecisionMakersFromHtml,
} from "../lib/decision-makers/website-extractor.ts";

import {
  generateDecisionMakerQueries,
  extractCandidatesFromSearchSnippets,
} from "../lib/decision-makers/web-search.ts";

import {
  verifyDecisionMakerCandidate,
} from "../lib/decision-makers/verifier.ts";

import {
  discoverDecisionMakers,
} from "../lib/decision-makers/pipeline.ts";

test("Phase 6 - Role Matching: matches clinical and executive leadership with priority", () => {
  const medicalDir = matchRoleInText("Dr. Anita Patel is the Medical Director of our clinic");
  assert.ok(medicalDir);
  assert.equal(medicalDir.role, "medical_director");
  assert.equal(medicalDir.priority, 96);

  const chiefDerma = matchRoleInText("Consultation with Chief Dermatologist & Cosmetologist");
  assert.ok(chiefDerma);
  assert.equal(chiefDerma.role, "clinic_director");
  assert.equal(chiefDerma.priority, 92);

  const founder = matchRoleInText("Founded by Dr. Chirag Desai in 2012");
  assert.ok(founder);
  assert.equal(founder.role, "founder");
  assert.equal(founder.priority, 100);

  const owner = matchRoleInText("Managing Partner and Owner of the practice");
  assert.ok(owner);
  assert.equal(owner.role, "owner");
  assert.equal(owner.priority, 98);

  const nonRole = matchRoleInText("Providing standard laser facial and chemical peels");
  assert.equal(nonRole, null);
});

test("Phase 6 - Name Parsing: standardizes names, strips credentials, and rejects UI noise", () => {
  // Valid medical names with credentials
  const doc1 = parsePersonName("Dr. Anita Patel, MD (Dermatology)");
  assert.equal(doc1.isValid, true);
  assert.equal(doc1.cleanName, "Anita Patel");
  assert.equal(doc1.honorific, "Dr.");
  assert.ok(doc1.credentials.includes("MD"));

  const doc2 = parsePersonName("Dr. Chirag K. Desai, MBBS, DVD");
  assert.equal(doc2.isValid, true);
  assert.equal(doc2.cleanName, "Chirag K. Desai");
  assert.ok(doc2.credentials.includes("MBBS"));
  assert.ok(doc2.credentials.includes("DVD"));

  // Valid business names
  const bizPerson = parsePersonName("Mr. Rohan Verma");
  assert.equal(bizPerson.isValid, true);
  assert.equal(bizPerson.cleanName, "Rohan Verma");

  // Rejection of UI and marketing noise
  const noise1 = parsePersonName("Book Appointment");
  assert.equal(noise1.isValid, false);

  const noise2 = parsePersonName("Aura Skin Clinic Vadodara");
  assert.equal(noise2.isValid, false);

  const noise3 = parsePersonName("Terms & Conditions");
  assert.equal(noise3.isValid, false);

  const noise4 = parsePersonName("Call Now: 0265-2345678");
  assert.equal(noise4.isValid, false);

  const noise5 = parsePersonName("Dermatology");
  assert.equal(noise5.isValid, false);
});

test("Phase 6 - Website Extractor: extracts structured doctor cards and narrative bios", () => {
  const teamHtml = `
    <html>
    <body>
      <section class="team-section">
        <div class="doctor-card">
          <h3>Dr. Anita Patel, MD</h3>
          <p class="role">Founder &amp; Medical Director</p>
          <p class="bio">Dr. Anita Patel is the Founder and Chief Medical Director of Aura Skin Clinic Vadodara.</p>
          <a href="https://linkedin.com/in/dranitapatel">LinkedIn Profile</a>
        </div>
        <div class="doctor-card">
          <h3>Dr. Rajiv Shah, MBBS, DVD</h3>
          <p class="role">Senior Consultant Dermatologist</p>
          <p class="bio">15 years of experience in clinical dermatology.</p>
        </div>
      </section>
      <div class="about-content">
        <p>Founded by Dr. Chirag Desai in 2010 to provide comprehensive skin healthcare in Vadodara.</p>
      </div>
    </body>
    </html>
  `;

  const candidates = extractDecisionMakersFromHtml(teamHtml, "https://auraskin.in/our-doctors");

  assert.ok(candidates.length >= 2);

  const anita = candidates.find((c) => c.fullName.includes("Anita Patel"));
  assert.ok(anita);
  assert.equal(anita.role, "founder");
  assert.equal(anita.profileUrl, "https://linkedin.com/in/dranitapatel");

  const rajiv = candidates.find((c) => c.fullName.includes("Rajiv Shah"));
  assert.ok(rajiv);
  assert.equal(rajiv.role, "clinic_director");

  const chirag = candidates.find((c) => c.fullName.includes("Chirag Desai"));
  assert.ok(chirag);
  assert.equal(chirag.role, "founder");
});

test("Phase 6 - Web Search Fallback: queries targeted sources and extracts candidates from snippets", () => {
  const queries = generateDecisionMakerQueries("Cutis Skin Clinic", "Vadodara");
  assert.ok(queries.length >= 2);
  assert.ok(queries[0].includes("Cutis Skin Clinic"));
  assert.ok(queries[0].includes("founder"));

  const mockSnippets = [
    {
      title: "Dr. Sandeep Patel - Medical Director - Cutis Skin Clinic | LinkedIn",
      url: "https://www.linkedin.com/in/dr-sandeep-patel-cutis",
      snippet: "Experienced Medical Director at Cutis Skin Clinic in Vadodara.",
    },
    {
      title: "Cutis Skin Clinic in Vadodara - JustDial Directory",
      url: "https://justdial.com/Vadodara/Cutis-Skin-Clinic",
      snippet: "Phone numbers, address, and ratings for Cutis Skin Clinic.",
    },
  ];

  const extracted = extractCandidatesFromSearchSnippets(mockSnippets, "Cutis Skin Clinic");

  // Justdial must be blocked
  assert.ok(!extracted.some((c) => c.sourceUrl.includes("justdial.com")));

  // LinkedIn candidate must be extracted
  const sandeep = extracted.find((c) => c.fullName.includes("Sandeep Patel"));
  assert.ok(sandeep);
  assert.equal(sandeep.role, "medical_director");
  assert.equal(sandeep.sourceHost, "linkedin.com");
});

test("Phase 6 - Multi-Host Corroboration & Verification: rewards distinct hosts and creates provenance", () => {
  const mockBusiness = {
    id: "biz-123",
    canonicalName: "Aura Skin Clinic",
    domain: "auraskin.in",
    website: "https://auraskin.in",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [],
    decisionMakers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const candWebsite = {
    fullName: "Dr. Anita Patel",
    role: "medical_director",
    roleLabel: "Founder & Medical Director",
    sourceUrl: "https://auraskin.in/our-doctors",
    sourceHost: "auraskin.in",
    sourceType: "official_team",
    evidenceText: "Dr. Anita Patel is the Founder and Medical Director of Aura Skin Clinic.",
    confidenceScore: 85,
  };

  const candLinkedIn = {
    fullName: "Dr. Anita Patel",
    role: "founder",
    roleLabel: "Founder",
    sourceUrl: "https://linkedin.com/in/dranitapatel",
    sourceHost: "linkedin.com",
    sourceType: "public_professional_profile",
    evidenceText: "Founder & Medical Director at Aura Skin Clinic Vadodara",
    confidenceScore: 75,
  };

  const verified = verifyDecisionMakerCandidate(candWebsite, mockBusiness, [candWebsite, candLinkedIn]);

  assert.ok(verified);
  assert.equal(verified.fullName, "Dr. Anita Patel");
  assert.equal(verified.verificationStatus, "verified");
  // Multi-host bonus should push confidenceScore to 95+
  assert.ok(verified.confidenceScore >= 95);
  assert.ok(verified.reason?.includes("independent domains"));
  assert.ok(verified.evidence.length >= 1);

  // UNKNOWN > WRONG Compliance:
  // Decision-maker contacts must NOT contain reception phone lines!
  assert.equal(verified.contacts.length, 0);
});

test("Phase 6 - End-to-End Pipeline & UNKNOWN > WRONG: returns null when no decision maker is found", async () => {
  const noOwnerBiz = {
    id: "biz-unknown-001",
    canonicalName: "Generic Vadodara Skin Care",
    domain: "genericskincare.in",
    website: "https://genericskincare.in",
    industry: "Dermatology",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 80,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [],
    decisionMakers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const genericHtml = `
    <html>
    <head><title>Generic Skin Care</title></head>
    <body>
      <h1>Vadodara Skin Treatments</h1>
      <p>We provide chemical peels and acne treatments. Call reception at 0265-2334455.</p>
    </body>
    </html>
  `;

  const result = await discoverDecisionMakers(noOwnerBiz, {
    websiteHtml: genericHtml,
  });

  // UNKNOWN > WRONG: System must return primaryDecisionMaker = null rather than guessing!
  assert.equal(result.primaryDecisionMaker, null);
  assert.equal(result.decisionMakers.length, 0);
});
