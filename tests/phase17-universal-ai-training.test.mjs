import test from "node:test";
import assert from "node:assert/strict";

import { parseNaturalLanguagePrompt } from "../lib/discovery/prompt-parser.ts";
import { queryCopilotBrain } from "../lib/ai/copilot-brain.ts";
import { dbStore } from "../server/db/store.ts";

test.beforeEach(() => {
  dbStore.__resetForTests();
});

test("Phase 17.1 — Exhaustive Global Industry Taxonomy & Complex Query Parsing (40+ Verticals)", () => {
  // 1. Aerospace & Defense
  const aero = parseNaturalLanguagePrompt("find 20 precision aerospace suppliers in Texas");
  assert.equal(aero.data.industry, "Aerospace & Defense Engineering");
  assert.equal(aero.data.city, "Texas");
  assert.equal(aero.data.country, "United States");
  assert.equal(aero.data.limit, 20);

  // 2. FinTech & Wealth Management
  const fintech = parseNaturalLanguagePrompt("locate fintech wealth management firms in Singapore");
  assert.equal(fintech.data.industry, "FinTech & Wealth Management");
  assert.equal(fintech.data.city, "Singapore");
  assert.equal(fintech.data.country, "Singapore");

  // 3. Robotics & Industrial Automation
  const robotics = parseNaturalLanguagePrompt("robotics industrial automation companies in Tokyo, Japan");
  assert.equal(robotics.data.industry, "Robotics & Industrial Automation");
  assert.equal(robotics.data.city, "Tokyo");
  assert.equal(robotics.data.country, "Japan");

  // 4. BioTech & Pharma
  const biotech = parseNaturalLanguagePrompt("discover biotech pharmaceutical formulation manufacturers in Boston");
  assert.equal(biotech.data.industry, "BioTech & Pharmaceutical Formulations");
  assert.equal(biotech.data.city, "Boston");
  assert.equal(biotech.data.country, "United States");

  // 5. Waste Management & Recycling
  const waste = parseNaturalLanguagePrompt("top 15 waste management & recycling services in Melbourne");
  assert.equal(waste.data.industry, "Waste Management & Recycling Services");
  assert.equal(waste.data.city, "Melbourne");
  assert.equal(waste.data.country, "Australia");
  assert.equal(waste.data.limit, 15);

  // 6. Cleanroom Engineering
  const cleanroom = parseNaturalLanguagePrompt("find cleanroom engineering contractors in Frankfurt");
  assert.equal(cleanroom.data.industry, "Cleanroom Engineering & Contamination Control");
  assert.equal(cleanroom.data.city, "Frankfurt");
  assert.equal(cleanroom.data.country, "Germany");

  // 7. Veterinary Clinics
  const vet = parseNaturalLanguagePrompt("search for veterinary animal hospitals in Nairobi");
  assert.equal(vet.data.industry, "Veterinary Clinics & Animal Hospitals");
  assert.equal(vet.data.city, "Nairobi");
  assert.equal(vet.data.country, "Kenya");

  // 8. Luxury Fine Jewelry
  const luxury = parseNaturalLanguagePrompt("luxury fine jewelry and watch salons in Zurich");
  assert.equal(luxury.data.industry, "Luxury Goods & Fine Jewelry");
  assert.equal(luxury.data.city, "Zurich");
  assert.equal(luxury.data.country, "Switzerland");

  // 9. Mining & Minerals
  const mining = parseNaturalLanguagePrompt("mining aggregate and iron ore extraction in Perth");
  assert.equal(mining.data.industry, "Mining & Mineral Extraction");
  assert.equal(mining.data.city, "Perth");
  assert.equal(mining.data.country, "Australia");

  // 10. Packaging & Corrugated Boxes
  const packaging = parseNaturalLanguagePrompt("packaging corrugated box manufacturers in Chicago");
  assert.equal(packaging.data.industry, "Packaging & Corrugated Box Manufacturing");
  assert.equal(packaging.data.city, "Chicago");
  assert.equal(packaging.data.country, "United States");

  // Verify none fell back to generic "Commercial Businesses"
  const allParsed = [aero, fintech, robotics, biotech, waste, cleanroom, vet, luxury, mining, packaging];
  for (const res of allParsed) {
    assert.notEqual(res.data.industry, "Commercial Businesses");
    assert.ok(res.detectedPersona && res.detectedPersona.length > 5);
  }
});

test("Phase 17.2 — Regional Metros & Acronyms Resolution across Global Economic Hubs", () => {
  // NCR (National Capital Region) -> Delhi, India
  const ncr = parseNaturalLanguagePrompt("tax firms in NCR");
  assert.equal(ncr.data.city, "Delhi");
  assert.equal(ncr.data.country, "India");

  // Tri-State -> New York, United States
  const tristate = parseNaturalLanguagePrompt("corporate law firms in Tri-State");
  assert.equal(tristate.data.city, "New York");
  assert.equal(tristate.data.country, "United States");

  // Bay Area / Silicon Valley -> California, United States
  const bay = parseNaturalLanguagePrompt("saas software companies in Bay Area");
  assert.equal(bay.data.city, "California");
  assert.equal(bay.data.country, "United States");

  // BKC (Bandra Kurla Complex) -> Mumbai, India
  const bkc = parseNaturalLanguagePrompt("wealth management advisors in BKC");
  assert.equal(bkc.data.city, "Mumbai");
  assert.equal(bkc.data.country, "India");

  // Canary Wharf -> London, United Kingdom
  const wharf = parseNaturalLanguagePrompt("fintech startups in Canary Wharf");
  assert.equal(wharf.data.city, "London");
  assert.equal(wharf.data.country, "United Kingdom");

  // Hitech City -> Hyderabad, India
  const hitech = parseNaturalLanguagePrompt("cloud tech companies in Hitech City");
  assert.equal(hitech.data.city, "Hyderabad");
  assert.equal(hitech.data.country, "India");
});

test("Phase 17.3 — Deep Tax & Compliance Statutory Guidance (RCM, ITC, LUT)", async () => {
  // 1. Reverse Charge Mechanism (RCM) for Legal Services
  const rcmQuery = await queryCopilotBrain("What are the Reverse Charge rules for legal services by an advocate under GST?");
  assert.equal(rcmQuery.intent, "tax_calculation");
  assert.ok(rcmQuery.taxGuidance);
  assert.equal(rcmQuery.taxGuidance.topic, "Reverse Charge Mechanism (RCM)");
  assert.ok(rcmQuery.reply.includes("Reverse Charge Mechanism"));
  assert.ok(rcmQuery.reply.includes("Section 9(3)"));

  // 2. Input Tax Credit (ITC) Blocked Credits under Section 17(5)
  const itcQuery = await queryCopilotBrain("Can I claim input tax credit (ITC) on food, beverages, and personal motor vehicles under Section 17(5)?");
  assert.equal(itcQuery.intent, "tax_calculation");
  assert.ok(itcQuery.taxGuidance);
  assert.ok(itcQuery.reply.includes("Section 17(5)"));
  assert.ok(itcQuery.reply.includes("BLOCKS ITC on: Motor vehicles"));

  // 3. Export of Services under LUT (Zero-Rated Supply)
  const lutQuery = await queryCopilotBrain("How does zero-rated export of service under LUT work, and do I need FIRC?");
  assert.equal(lutQuery.intent, "tax_calculation");
  assert.ok(lutQuery.taxGuidance);
  assert.ok(lutQuery.reply.includes("Letter of Undertaking"));
  assert.ok(lutQuery.reply.includes("FIRC"));
});

test("Phase 17.4 — Sales Objection Battlecards & Outreach Strategy Matrix", async () => {
  // 1. "Already have an in-house team"
  const teamQuery = await queryCopilotBrain("Prospect says: We already have an in-house team handling this.");
  assert.equal(teamQuery.intent, "sales_strategy");
  assert.ok(teamQuery.battlecardData);
  assert.equal(teamQuery.battlecardData.category, "competition");
  assert.ok(teamQuery.reply.includes("Psychological Driver"));
  assert.ok(teamQuery.reply.includes("Executive Cold Email Script"));
  assert.ok(teamQuery.reply.includes("Phone / WhatsApp Voice Script"));

  // 2. "Price is too high / no budget"
  const priceQuery = await queryCopilotBrain("What do I say when client says your price is too high and we have no budget?");
  assert.equal(priceQuery.intent, "sales_strategy");
  assert.ok(priceQuery.battlecardData);
  assert.equal(priceQuery.battlecardData.category, "budget");
  assert.ok(priceQuery.reply.includes("What is your average client lifetime value"));

  // 3. "How did you get my number?"
  const numberQuery = await queryCopilotBrain("Client asked: where did you find my email and how did you get my number?");
  assert.equal(numberQuery.intent, "sales_strategy");
  assert.ok(numberQuery.battlecardData);
  assert.equal(numberQuery.battlecardData.category, "authority");
  assert.ok(numberQuery.reply.includes("public corporate filings"));

  // 4. Outreach angle for specific vertical (Cleanroom Engineering)
  const angleQuery = await queryCopilotBrain("Give me a cold outreach angle for Cleanroom Engineering & Contamination Control");
  assert.equal(angleQuery.intent, "sales_strategy");
  assert.ok(angleQuery.matchedIndustry);
  assert.ok(angleQuery.matchedIndustry.name.includes("Cleanroom"));
  assert.ok(angleQuery.reply.includes("Target Decision Makers"));
  assert.ok(angleQuery.reply.includes("Cleanroom"));
});

test("Phase 17.5 — Sovereign System Diagnostics & Troubleshooting Runbooks", async () => {
  // 1. SMTP Port 25 Outbound Block
  const smtpQuery = await queryCopilotBrain("Why is SMTP Port 25 failing on my cloud server?");
  assert.equal(smtpQuery.intent, "system_diagnostics");
  assert.ok(smtpQuery.diagnosticData);
  assert.equal(smtpQuery.diagnosticData.component, "smtp_port_25");
  assert.ok(smtpQuery.reply.includes("Test-NetConnection"));
  assert.ok(smtpQuery.reply.includes("Port 25"));

  // 2. Local Ollama Server Offline
  const ollamaQuery = await queryCopilotBrain("Ollama connection refused 127.0.0.1:11434");
  assert.equal(ollamaQuery.intent, "system_diagnostics");
  assert.ok(ollamaQuery.diagnosticData);
  assert.equal(ollamaQuery.diagnosticData.component, "ollama_vllm");
  assert.ok(smtpQuery.reply.includes("Diagnostic Verification Command"));
  assert.ok(ollamaQuery.reply.includes("ollama serve"));

  // 3. SearXNG Rate Limit & Waterfall Degradation
  const searxQuery = await queryCopilotBrain("SearXNG 429 rate limit error in waterfall");
  assert.equal(searxQuery.intent, "system_diagnostics");
  assert.ok(searxQuery.diagnosticData);
  assert.equal(searxQuery.diagnosticData.component, "searxng_waterfall");
  assert.ok(searxQuery.reply.includes("Overpass"));
});

test("Phase 17.6 — Multi-Intent Stress Test & Sovereign Zero Hallucination Guarantee", async () => {
  // Test that diverse prompt formulations never cross-contaminate or crash
  const q1 = await queryCopilotBrain("Show my overdue invoices and cash collection health");
  assert.equal(q1.intent, "finance_health");
  assert.ok(q1.financeData);

  const q2 = await queryCopilotBrain("Calculate GST on ₹3,00,000 retainer from Maharashtra to Delhi");
  assert.equal(q2.intent, "tax_calculation");
  assert.equal(q2.taxBreakdown?.subtotalCents, 30000000);
  assert.equal(q2.taxBreakdown?.totalTaxCents, 5400000); // 18% of 300,000 = 54,000 -> 5,400,000 cents

  const q3 = await queryCopilotBrain("How do I handle the objection: we tried lead gen before and got burned?");
  assert.equal(q3.intent, "sales_strategy");
  assert.ok(q3.battlecardData);
  assert.equal(q3.battlecardData.category, "skepticism");
  assert.ok(q3.reply.includes("UNKNOWN > WRONG"));

  const q4 = await queryCopilotBrain("Why did the client portal magic-link expired?");
  assert.equal(q4.intent, "system_diagnostics");
  assert.ok(q4.diagnosticData);
  assert.equal(q4.diagnosticData.component, "client_portal");

  // Verify sovereign rules inference
  assert.equal(q1.inferenceProvider, "self_sovereign_rules");
  assert.equal(q2.inferenceProvider, "self_sovereign_rules");
  assert.equal(q3.inferenceProvider, "self_sovereign_rules");
  assert.equal(q4.inferenceProvider, "self_sovereign_rules");
});
