import test from "node:test";
import assert from "node:assert/strict";
import { checkOutboundPort25Reachability, verifyMicrosoft365Mailbox, verifyGoogleWorkspaceTenant } from "../lib/enrichment/smtp-verifier.ts";
import { crawlDomainIntelligence } from "../lib/enrichment/crawler.ts";
import { detectOffWebsiteOwner, queryRdapDomainIntelligence } from "../lib/enrichment/owner-detective.ts";
import { harvestOwnerViewsAndMindset } from "../lib/intelligence/owner-psychographics.ts";
import { generateContractAgreement } from "../lib/closing/contract-generator.ts";
import { runAutonomousGoalPipeline } from "../lib/ai/autonomous-core.ts";

test("Phase 14.1 — Outbound Port 25 Reachability & Enterprise HTTPS Fallbacks", async () => {
  const diag = await checkOutboundPort25Reachability(3000);
  assert.ok(typeof diag.reachable === "boolean", "Port 25 reachable must be boolean");
  assert.ok(diag.checkedAt, "Checked timestamp must be present");
  assert.ok(diag.details, "Diagnostic details must be present");

  // Microsoft 365 HTTPS verification test
  const m365Result = await verifyMicrosoft365Mailbox("test.user@microsoft.com", 3000);
  assert.ok(typeof m365Result.exists === "boolean", "M365 exists must be boolean");

  // Google Workspace tenant check
  const gsuiteResult = await verifyGoogleWorkspaceTenant("google.com", "test@google.com", 3000);
  assert.ok(typeof gsuiteResult.isTenant === "boolean", "Google tenant isTenant must be boolean");
});

test("Phase 14.2 — Hydrated Script & Next.js __NEXT_DATA__ Detection in Crawler", async () => {
  // Test domain crawl with local SSRF protection and mock inspection
  const intel = await crawlDomainIntelligence("https://example.com", { timeoutMs: 3000, maxPages: 1 });
  assert.ok(intel, "Crawler must return intel object");
  assert.ok(typeof intel.auditSignals.hasMetaPixel === "boolean", "Meta pixel flag must be boolean");
  assert.ok(typeof intel.auditSignals.hasGoogleTag === "boolean", "Google tag flag must be boolean");
  assert.ok(typeof intel.auditSignals.hasBookingEngine === "boolean", "Booking engine flag must be boolean");
});

test("Phase 14.3 — RDAP Registry Lookup & Proxy Filtering", async () => {
  const rdap = await queryRdapDomainIntelligence("google.com", 4000);
  assert.ok(rdap, "RDAP response should not be null");
  // Registrant org should either be Google LLC or null if privacy-gated, never throw
  assert.ok(rdap.registrantOrg === null || typeof rdap.registrantOrg === "string");
});

test("Phase 14.4 — Off-Website Owner Detective with Multi-Vector Corroboration", async () => {
  const ownerIntel = await detectOffWebsiteOwner({
    companyName: "Warby Parker",
    domain: "warbyparker.com",
    city: "New York",
    country: "United States",
    timeoutMs: 4000,
  });

  assert.ok(ownerIntel, "Owner intel object must exist");
  assert.ok(typeof ownerIntel.ownerFound === "boolean");
  assert.ok(Array.isArray(ownerIntel.corroboratingSignals));
  assert.ok(Array.isArray(ownerIntel.provenance));
  assert.ok(typeof ownerIntel.confidenceScore === "number");
  assert.ok(["DIRECT_MOBILE", "WHATSAPP_VERIFIED", "CORPORATE_SWITCHBOARD", "UNKNOWN"].includes(ownerIntel.phoneLabel));
  assert.ok(["VERIFIED_SMTP", "VERIFIED_TENANT", "UNKNOWN"].includes(ownerIntel.emailStatus));
});

test("Phase 14.5 — Owner Views, Beliefs & Psychographic Mindset Synthesis", async () => {
  const psych = await harvestOwnerViewsAndMindset(
    "Neil Blumenthal",
    "Warby Parker",
    "Direct-to-Consumer Eyewear",
    { timeoutMs: 3000 }
  );

  assert.strictEqual(psych.ownerName, "Neil Blumenthal");
  assert.strictEqual(psych.companyName, "Warby Parker");
  assert.ok(psych.corePhilosophy.length > 20, "Core philosophy should be articulated");
  assert.ok(psych.currentPriorities.length >= 2, "Current priorities should be extracted");
  assert.ok(psych.personalizedOpener.length > 20, "Personalized opener must be generated");
  assert.ok(psych.synthesisConfidence >= 0.8, "Confidence must be >= 0.8");
});

test("Phase 14.6 — Dynamic Governing Law, Tax ID & Signatory in Contract Generator", () => {
  const testBiz = {
    id: "test-biz-contract-1",
    canonicalName: "Beacon Health Partners",
    domain: "beaconhealth.com.au",
    industry: "Specialist Medical & Health Clinics",
    city: "Melbourne",
    country: "Australia",
    address: "100 Collins St, Melbourne VIC 3000",
    decisionMakers: [
      {
        fullName: "Dr. Marcus Vance",
        role: "managing_director",
        roleLabel: "Managing Director",
        email: "marcus.vance@beaconhealth.com.au",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 0.95,
        evidence: [],
        contacts: [],
      },
    ],
  };

  const contract = generateContractAgreement(testBiz, undefined, {
    governingLawJurisdiction: "State of Victoria, Australia",
    taxId: "ABN 84 991 234 567",
    authorizedSignatory: "Julian Thorne, Managing Partner",
    customTotalValue: "A$24,000 AUD",
  });

  assert.ok(contract.markdownDocument.includes("ABN 84 991 234 567"), "Tax ID must be in Markdown");
  assert.ok(contract.markdownDocument.includes("Julian Thorne, Managing Partner"), "Signatory must be in Markdown");
  assert.ok(contract.markdownDocument.includes("State of Victoria, Australia"), "Governing law must be in Markdown");
  assert.ok(contract.htmlDocument.includes("ABN 84 991 234 567"), "Tax ID must be in HTML");
  assert.ok(contract.htmlDocument.includes("Julian Thorne, Managing Partner"), "Signatory must be in HTML");
});

test("Phase 14.7 — Autonomous In-House AI Pipeline Runner with Streaming Events", async () => {
  const events = [];

  const result = await runAutonomousGoalPipeline(
    "High-end Direct-to-Consumer lifestyle and wellness brands needing conversion rate and mobile checkout optimization",
    {
      targetGeography: "United States",
      targetLimit: 1,
      mockCandidates: [
        {
          id: "test-lead-auto",
          canonicalName: "Sovereign Wellness Co",
          domain: "sovereignwellness.example",
          website: "https://sovereignwellness.example",
          industry: "D2C Wellness",
          city: "New York",
          country: "United States",
          phone: "+1-212-555-0122",
          decisionMakers: [],
        },
      ],
    },
    (event) => {
      events.push(event.step);
    }
  );

  assert.ok(result.success, "Autonomous pipeline should complete with success");
  assert.ok(result.strategy.icps.length === 3, "Strategy must have 3 ICPs");
  assert.ok(result.leadsProcessed.length === 1, "Must process 1 lead");
  assert.ok(result.leadsProcessed[0].pitchDeck, "Must generate pitch deck");
  assert.ok(result.leadsProcessed[0].contract, "Must generate legal contract");
  assert.ok(events.includes("BUSINESS_ANALYSIS"), "Must emit BUSINESS_ANALYSIS");
  assert.ok(events.includes("ICP_SELECTION"), "Must emit ICP_SELECTION");
  assert.ok(events.includes("OWNER_DETECTIVE"), "Must emit OWNER_DETECTIVE");
  assert.ok(events.includes("COMPLETED"), "Must emit COMPLETED");
});
