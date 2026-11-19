import { test } from "node:test";
import assert from "node:assert/strict";

// 1. Phase 1: ICP Architect
import { analyzeBusinessAndGenerateIcps } from "../lib/intelligence/icp-architect.ts";

// 2. Phase 2: Crawler, OSINT & SMTP
import { generateEmailPermutations, verifyEmailAddress } from "../lib/enrichment/smtp-verifier.ts";
import { resolveOsintIdentity } from "../lib/enrichment/osint-resolver.ts";

// 3. Phase 3: Outreach Brain
import { generateOutreachBrainSuite, resolveLocationTimezone } from "../lib/intelligence/outreach-brain.ts";

// 4. Phase 4: Pitch Deck & Contract Generator
import { generatePitchDeck } from "../lib/closing/pitch-deck-generator.ts";
import { generateContractAgreement } from "../lib/closing/contract-generator.ts";
import { PIPELINE_STAGES, LEAD_STAGE_LABELS } from "../lib/types/lead.ts";

test("Phase 13.1 — In-House ICP & Offer Strategist Engine", () => {
  // Test Case A: Creative & Technical Studio for Australian D2C Brands
  const studioProfile = {
    businessName: "SoleTrust Studio",
    serviceOrProductDescription: "We design bespoke headless eCommerce stores, 3D product visualizers, and sub-second checkout funnels for direct-to-consumer brands.",
    skills: ["Creative UI/UX", "Next.js", "Headless Shopify", "Three.js", "Core Web Vitals"],
    pricingModel: "$10,000 - $30,000 project",
    targetGeography: "Australia",
  };

  const studioAnalysis = analyzeBusinessAndGenerateIcps(studioProfile);
  assert.ok(studioAnalysis.positioning.includes("Commerce Studio"));
  assert.equal(studioAnalysis.icps.length, 3);
  assert.equal(studioAnalysis.icps[0].rank, 1);
  assert.ok(studioAnalysis.icps[0].conversionProbability >= 80);
  assert.ok(studioAnalysis.icps[0].targetGeography.toLowerCase().includes("australia"));
  assert.ok(studioAnalysis.icps[0].searchQueryPrompt.toLowerCase().includes("australia"));
  assert.ok(studioAnalysis.icps[0].decisionMakerTitles.includes("Founder & CEO"));

  // Test Case B: Food & Beverage Wholesale Distribution for Supermarkets
  const fnbProfile = {
    businessName: "Metro Gourmet Logistics",
    serviceOrProductDescription: "Specialty food and beverage wholesale distributor supplying high-margin gourmet drinks, snacks, and Direct-Store-Delivery to supermarkets.",
    skills: ["Direct Store Delivery (DSD)", "Category Resets", "Gourmet Beverages", "Retail Wholesale"],
    pricingModel: "$2,000 - $10,000 stocking orders",
    targetGeography: "China",
  };

  const fnbAnalysis = analyzeBusinessAndGenerateIcps(fnbProfile);
  assert.ok(fnbAnalysis.positioning.includes("Food & Beverage Wholesale"));
  assert.equal(fnbAnalysis.icps.length, 3);
  assert.ok(fnbAnalysis.icps[0].title.includes("Supermarket"));
  assert.ok(fnbAnalysis.icps[0].searchQueryPrompt.includes("supermarket"));
  assert.ok(fnbAnalysis.icps[0].searchQueryPrompt.toLowerCase().includes("china"));
});

test("Phase 13.2 — In-House Email Permutation & Live SMTP Verifier", async () => {
  // Test corporate permutation generator
  const permutations = generateEmailPermutations("Sarah Connor", "cyberdyne-systems.com");
  assert.ok(permutations.includes("sarah.connor@cyberdyne-systems.com"));
  assert.ok(permutations.includes("sconnor@cyberdyne-systems.com"));
  assert.ok(permutations.includes("sarah@cyberdyne-systems.com"));
  assert.ok(permutations.includes("sarahc@cyberdyne-systems.com"));
  assert.ok(permutations.includes("founder@cyberdyne-systems.com"));

  // Test syntax validation failure on malformed email
  const invalidResult = await verifyEmailAddress("not-an-email");
  assert.equal(invalidResult.status, "UNKNOWN");
  assert.equal(invalidResult.confidenceScore, 0.0);

  // Test non-existent domain MX lookup (fails gracefully adhering to UNKNOWN > WRONG)
  const nonExistentResult = await verifyEmailAddress("john.doe@nonexistent-fake-domain-12345xyz.local");
  assert.equal(nonExistentResult.status, "UNKNOWN");
  assert.equal(nonExistentResult.mxRecordFound, false);
});

test("Phase 13.3 — Multi-Vector OSINT Identity Disambiguation", async () => {
  // Negative test: uncorroborated single signal should NOT falsely link
  const emptyQuery = { companyName: "" };
  const emptyRes = await resolveOsintIdentity(emptyQuery);
  assert.equal(emptyRes.personName, null);
  assert.equal(emptyRes.confidenceScore, 0.0);

  // Corroborated entity test with known decision maker
  const corroboratedQuery = {
    companyName: "SoleTrust Technology",
    city: "Melbourne",
    country: "Australia",
    knownDecisionMakerName: "Alexander Vance",
  };
  const res = await resolveOsintIdentity(corroboratedQuery, { timeoutMs: 100 });
  assert.equal(res.personName, "Alexander Vance");
  assert.ok(res.confidenceScore >= 0.6);
});

test("Phase 13.4 — Timing, Channel & Behavioral Outreach Brain", () => {
  const testBusiness = {
    id: "biz-au-dtc-1",
    canonicalName: "Aether Lifestyle Goods",
    industry: "D2C Fashion & Apparel eCommerce",
    city: "Melbourne",
    country: "Australia",
    website: "https://aethergoods.com.au",
    address: "120 Collins St, Melbourne VIC 3000",
    contacts: [
      { contactType: "phone", value: "+61 3 9000 1234", ownershipType: "business_main", verificationStatus: "confirmed" },
      { contactType: "email", value: "hello@aethergoods.com.au", ownershipType: "business_main", verificationStatus: "confirmed" },
    ],
    decisionMakers: [
      { fullName: "Liam Hemsworth", roleLabel: "Founder & Creative Director", verificationStatus: "verified", confidenceScore: 92 },
    ],
  };

  // Test Timezone resolution
  const tz = resolveLocationTimezone("Melbourne", "Australia");
  assert.equal(tz, "Australia/Melbourne");

  const tzShanghai = resolveLocationTimezone("Shanghai", "China");
  assert.equal(tzShanghai, "Asia/Shanghai");

  // Test Full Outreach Brain Suite Generation
  const brain = generateOutreachBrainSuite(testBusiness);
  assert.equal(brain.businessName, "Aether Lifestyle Goods");
  assert.equal(brain.decisionMakerName, "Liam Hemsworth");
  assert.ok(brain.timing.timezone.includes("Melbourne"));
  assert.ok(brain.audit.whyToReachOut.length > 0);
  assert.ok(brain.rankedChannels.length > 0);

  // Multichannel scripts validation
  assert.ok(brain.emailSequence.touch1.subject.includes("Liam") || brain.emailSequence.touch1.subject.includes("Aether"));
  assert.ok(brain.emailSequence.touch2.body.toLowerCase().includes("following up"));
  assert.ok(brain.emailSequence.touch3.subject.includes("Closing the loop"));
  assert.ok(brain.whatsAppVoiceNote.script.length > 20);
  assert.ok(brain.instagramDmScript.dmMessage.includes("Aether"));
  assert.ok(brain.phoneBattlecard.objectionHandlers["Already have a provider or agency"]);
});

test("Phase 13.5 — In-House Pitch Deck Generator (8 Slides)", () => {
  const testBusiness = {
    id: "biz-cn-grocery-1",
    canonicalName: "Freshippo Gourmet Superstores",
    industry: "Supermarket & Grocery Retail",
    city: "Shanghai",
    country: "China",
    website: "https://freshippo.com",
    address: "Pudong New Area, Shanghai",
    contacts: [],
    decisionMakers: [
      { fullName: "Hou Yi", roleLabel: "CEO & Store Director", verificationStatus: "verified", confidenceScore: 95 },
    ],
  };

  const deck = generatePitchDeck(testBusiness);
  assert.equal(deck.companyName, "Freshippo Gourmet Superstores");
  assert.ok(deck.decisionMaker.includes("Hou Yi"));
  assert.equal(deck.slides.length, 8);
  assert.equal(deck.slides[0].slideNumber, 1);
  assert.equal(deck.slides[7].slideNumber, 8);
  assert.ok(deck.markdownExport.includes("Slide 1:"));
  assert.ok(deck.htmlExport.includes("<!DOCTYPE html>"));
  assert.ok(deck.htmlExport.includes("Freshippo Gourmet Superstores"));
});

test("Phase 13.6 — Automated SOW & Legal Contract Suite", () => {
  const testBusiness = {
    id: "biz-au-dtc-2",
    canonicalName: "Koa Organic Botanicals",
    industry: "D2C Clean Skincare",
    city: "Sydney",
    country: "Australia",
    address: "George St, Sydney NSW 2000",
    contacts: [],
    decisionMakers: [
      { fullName: "Chloe Bennett", roleLabel: "Founder & Chief Executive", verificationStatus: "verified", confidenceScore: 90 },
    ],
  };

  const agreement = generateContractAgreement(testBusiness);
  assert.ok(agreement.agreementNumber.startsWith("SOW-"));
  assert.equal(agreement.clientLegalName, "Koa Organic Botanicals");
  assert.equal(agreement.clientSignerName, "Chloe Bennett");
  assert.ok(agreement.scopeOfWork.length >= 3);
  assert.equal(agreement.milestones.length, 3);
  assert.ok(agreement.markdownDocument.includes("STATEMENT OF WORK"));
  assert.ok(agreement.markdownDocument.includes("Chloe Bennett"));
  assert.ok(agreement.htmlDocument.includes("<!DOCTYPE html>"));
});

test("Phase 13.7 — Full Lifecycle Pipeline Stages in Kanban", () => {
  assert.ok(PIPELINE_STAGES.includes("pitch_sent"));
  assert.ok(PIPELINE_STAGES.includes("contract_sent"));
  assert.ok(PIPELINE_STAGES.includes("won"));
  assert.equal(LEAD_STAGE_LABELS["pitch_sent"], "Pitch Sent");
  assert.equal(LEAD_STAGE_LABELS["contract_sent"], "Contract Sent");
});
