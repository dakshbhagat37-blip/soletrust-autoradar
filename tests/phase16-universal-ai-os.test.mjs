import test from "node:test";
import assert from "node:assert/strict";

import { parseNaturalLanguagePrompt } from "../lib/discovery/prompt-parser.ts";
import { getOsmTagFiltersForIndustry } from "../lib/providers/overpass.ts";
import { generateDiscoveryQueries } from "../lib/discovery/queries.ts";
import { corporateRegistryProvider } from "../lib/providers/corporate-registry.ts";
import { waterfall } from "../lib/providers/waterfall.ts";
import { isGenericEmail } from "../lib/enrichment/crawler.ts";
import { classifyAndVerifyBusinessContacts } from "../lib/contacts/classification.ts";
import {
  calculateTaxAndCompliance,
  queryCopilotBrain,
} from "../lib/ai/copilot-brain.ts";
import { dbStore } from "../server/db/store.ts";

test.beforeEach(() => {
  dbStore.__resetForTests();
});

test("Phase 16.1 — Universal Any-Industry Global Discovery Engine & Query Translator", () => {
  // 1. Test Taxation & CA firms in Delhi, India
  const caResult = parseNaturalLanguagePrompt("find 15 taxation & CA firms in Delhi, India");
  assert.equal(caResult.data.industry, "Taxation & Chartered Accountants");
  assert.equal(caResult.data.city, "Delhi");
  assert.equal(caResult.data.country, "India");
  assert.equal(caResult.data.limit, 15);

  // 2. Test Commercial Solar EPC installers in Texas
  const solarResult = parseNaturalLanguagePrompt("commercial solar installers in Texas 20 leads");
  assert.equal(solarResult.data.industry, "Commercial Solar & Renewable Energy EPC");
  assert.equal(solarResult.data.city, "Texas");
  assert.equal(solarResult.data.country, "United States");
  assert.equal(solarResult.data.limit, 20);

  // 3. Test Logistics & freight forwarders in Rotterdam, Netherlands
  const logResult = parseNaturalLanguagePrompt("top 10 logistics companies in Rotterdam");
  assert.equal(logResult.data.industry, "Logistics & Freight Services");
  assert.equal(logResult.data.city, "Rotterdam");
  assert.equal(logResult.data.country, "Netherlands");
  assert.equal(logResult.data.limit, 10);

  // 4. Test EdTech education platforms in London, UK
  const edtechResult = parseNaturalLanguagePrompt("discover edtech education companies in London, UK");
  assert.equal(edtechResult.data.industry, "EdTech & Educational Services");
  assert.equal(edtechResult.data.city, "London");
  assert.equal(edtechResult.data.country, "United Kingdom");

  // 5. Test Dynamic Freeform Industry Extractor (Custom arbitrary industry)
  const aeroResult = parseNaturalLanguagePrompt("find precision aerospace suppliers in Seattle");
  assert.ok(aeroResult.data.industry.toLowerCase().includes("aerospace"));
  assert.equal(aeroResult.data.city, "Seattle");
  assert.equal(aeroResult.data.country, "United States");

  // 6. Verify Dynamic Overpass Tag Generation across global sectors
  const taxOsmTags = getOsmTagFiltersForIndustry("Taxation & Chartered Accountants");
  assert.ok(taxOsmTags.some((t) => t.includes("accountant|tax_advisor|financial")));

  const solarOsmTags = getOsmTagFiltersForIndustry("Commercial Solar & Renewable Energy EPC");
  assert.ok(solarOsmTags.some((t) => t.includes("photovoltaic|electrician")));

  const logOsmTags = getOsmTagFiltersForIndustry("Logistics & Freight Services");
  assert.ok(logOsmTags.some((t) => t.includes("logistics|transport|shipping")));

  const customOsmTags = getOsmTagFiltersForIndustry("Precision Aerospace Manufacturing");
  assert.ok(customOsmTags.some((t) => t.includes("manufacturing|warehouse|production") || t.includes("office")));

  // 7. Verify Live Web Query Generation
  const queries = generateDiscoveryQueries({
    industry: "Taxation & Chartered Accountants",
    city: "Delhi",
    country: "India",
    limit: 10,
  });
  assert.ok(queries.allQueries.some((q) => q.includes("Taxation & Chartered Accountants")));
  assert.ok(queries.allQueries.some((q) => q.includes("site:*.in")));

  // 8. Verify Discovery Waterfall Provider Chain includes Corporate Registries
  const providerIds = waterfall.listProviders().map((p) => p.id);
  assert.ok(providerIds.includes("overpass"));
  assert.ok(providerIds.includes("searxng"));
  assert.ok(providerIds.includes("corporate_registry"));
  assert.equal(corporateRegistryProvider.id, "corporate_registry");
});

test("Phase 16.2 — Owner-First Decision-Maker Engine & Generic Email Demotion", async () => {
  // 1. Generic email validation checks
  assert.equal(isGenericEmail("info@company.com"), true);
  assert.equal(isGenericEmail("contact@firm.in"), true);
  assert.equal(isGenericEmail("sales@enterprise.co.uk"), true);
  assert.equal(isGenericEmail("support@app.io"), true);
  assert.equal(isGenericEmail("admin@business.com"), true);
  assert.equal(isGenericEmail("office@agency.com.au"), true);
  assert.equal(isGenericEmail("hello@startup.co"), true);
  assert.equal(isGenericEmail("rajesh.sharma@apextax.in"), false);
  assert.equal(isGenericEmail("sarah.miller@kinetix.com"), false);

  // 2. Classify candidate with ONLY generic email and unverified owner
  const dummyBusiness = {
    id: "biz-test-1",
    canonicalName: "Apex Global Advisors",
    website: "https://apexglobal.in",
    domain: "apexglobal.in",
    industry: "Taxation & Accounting",
    city: "Mumbai",
    country: "India",
    identityStatus: "verified",
    identityScore: 85,
    qualificationScore: 80,
    status: "qualified",
    sources: [],
    contacts: [
      {
        id: "c-1",
        businessId: "biz-test-1",
        contactType: "email",
        value: "info@apexglobal.in",
        ownershipType: "business_main",
        verificationStatus: "unverified",
      },
      {
        id: "c-2",
        businessId: "biz-test-1",
        contactType: "phone",
        value: "+91 22 6677 8899",
        ownershipType: "business_main",
        verificationStatus: "unverified",
      },
    ],
    decisionMakers: [
      {
        fullName: "Rajesh Sharma",
        role: "managing_partner",
        roleLabel: "Managing Partner",
        email: "info@apexglobal.in", // Intentionally test generic email passed to decision maker
        discoveryStatus: "discovered",
        verificationStatus: "partially_verified",
        confidenceScore: 0.6,
        evidence: [],
        contacts: [
          {
            id: "dmc-1",
            contactType: "email",
            value: "info@apexglobal.in",
            ownershipType: "decision_maker_direct",
            verificationStatus: "unverified",
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { business, summary } = await classifyAndVerifyBusinessContacts(dummyBusiness);

  // 3. Verify generic email is stripped from Decision Maker (UNKNOWN > WRONG)
  assert.equal(business.decisionMakers[0].email, null);
  assert.equal(business.decisionMakers[0].contacts.length, 0); // Demoted out of decision maker contacts
  assert.equal(business.fallbackCorporateEmail, "info@apexglobal.in"); // Saved to fallback corporate email
  assert.equal(summary.verifiedDecisionMakerEmails, 0);
  assert.equal(summary.hasDirectDecisionMakerContact, false);

  // 4. Verify verified personal email IS accepted for Decision Maker
  const verifiedBusiness = {
    ...dummyBusiness,
    decisionMakers: [
      {
        ...dummyBusiness.decisionMakers[0],
        email: "rajesh.sharma@apexglobal.in",
        contacts: [
          {
            id: "dmc-2",
            contactType: "email",
            value: "rajesh.sharma@apexglobal.in",
            ownershipType: "decision_maker_direct",
            verificationStatus: "unverified",
          },
        ],
      },
    ],
  };

  const { business: verifiedBiz, summary: verifiedSummary } = await classifyAndVerifyBusinessContacts(verifiedBusiness);
  assert.equal(verifiedBiz.decisionMakers[0].email, "rajesh.sharma@apexglobal.in");
  assert.equal(verifiedBiz.decisionMakers[0].contacts.length, 1);
  assert.equal(verifiedSummary.verifiedDecisionMakerEmails, 1);
  assert.equal(verifiedSummary.hasDirectDecisionMakerContact, true);
});

test("Phase 16.3 — Integer-Cent Tax & Compliance Calculation Engine", () => {
  // Test Case 1: Intra-State Retainer (₹1,50,000 within Maharashtra)
  const intraGst = calculateTaxAndCompliance(150000, {
    stateOrigin: "Maharashtra",
    stateDestination: "Maharashtra",
    currency: "INR",
  });

  assert.equal(intraGst.subtotalCents, 15000000); // 15,000,000 paise
  assert.equal(intraGst.taxType, "gst_intra");
  assert.equal(intraGst.taxRatePercent, 18);
  assert.equal(intraGst.cgstCents, 1350000); // 9% of ₹1,50,000 = ₹13,500 = 1,350,000 paise
  assert.equal(intraGst.sgstCents, 1350000); // 9% of ₹1,50,000 = ₹13,500 = 1,350,000 paise
  assert.equal(intraGst.totalTaxCents, 2700000); // Total Tax = ₹27,000 = 2,700,000 paise
  assert.equal(intraGst.totalAmountCents, 17700000); // Total Gross = ₹1,77,000 = 17,700,000 paise
  assert.equal(intraGst.sacCode, "998314");
  assert.ok(intraGst.notes.some((n) => n.includes("9% CGST + 9% SGST")));

  // Test Case 2: Inter-State Retainer (₹1,50,000 Maharashtra to Delhi)
  const interGst = calculateTaxAndCompliance(150000, {
    stateOrigin: "Maharashtra",
    stateDestination: "Delhi",
    currency: "INR",
  });

  assert.equal(interGst.subtotalCents, 15000000);
  assert.equal(interGst.taxType, "gst_inter");
  assert.equal(interGst.taxRatePercent, 18);
  assert.equal(interGst.igstCents, 2700000); // 18% of ₹1,50,000 = ₹27,000 = 2,700,000 paise
  assert.equal(interGst.totalTaxCents, 2700000);
  assert.equal(interGst.totalAmountCents, 17700000);
  assert.ok(interGst.notes.some((n) => n.includes("18% Integrated GST (IGST)")));

  // Test Case 3: Zero-Rated Export under Letter of Undertaking (LUT)
  const lutExport = calculateTaxAndCompliance(5000, {
    currency: "USD",
    isExport: true,
    hasLut: true,
  });

  assert.equal(lutExport.subtotalCents, 500000); // $5,000 = 500,000 cents
  assert.equal(lutExport.taxType, "export_lut");
  assert.equal(lutExport.taxRatePercent, 0);
  assert.equal(lutExport.totalTaxCents, 0);
  assert.equal(lutExport.totalAmountCents, 500000);
  assert.ok(lutExport.notes.some((n) => n.includes("Letter of Undertaking (LUT)")));

  // Test Case 4: International VAT (UK GBP 20%)
  const ukVat = calculateTaxAndCompliance(2000, {
    currency: "GBP",
  });
  assert.equal(ukVat.taxType, "vat");
  assert.equal(ukVat.taxRatePercent, 20);
  assert.equal(ukVat.vatCents, 40000); // 20% of £2,000 = £400 = 40,000 pence
  assert.equal(ukVat.totalAmountCents, 240000);

  // Test Case 5: International GST (Australia AUD 10%)
  const ausGst = calculateTaxAndCompliance(3000, {
    currency: "AUD",
  });
  assert.equal(ausGst.taxType, "vat");
  assert.equal(ausGst.taxRatePercent, 10);
  assert.equal(ausGst.vatCents, 30000); // 10% of $3,000 = $300 = 30,000 cents
  assert.equal(ausGst.totalAmountCents, 330000);
});

test("Phase 16.4 — Conversational AI Copilot Brain Multi-Intent Query Dispatcher", async () => {
  // Query 1: Tax Comparison Query
  const taxQuery = "How much GST will I charge a client in Maharashtra vs. Delhi on a ₹1,50,000 retainer?";
  const taxRes = await queryCopilotBrain(taxQuery);

  assert.equal(taxRes.intent, "tax_calculation");
  assert.ok(taxRes.reply.includes("CGST (9%)"));
  assert.ok(taxRes.reply.includes("SGST (9%)"));
  assert.ok(taxRes.reply.includes("IGST (18%)"));
  assert.ok(taxRes.taxBreakdown);
  assert.equal(taxRes.taxBreakdown.subtotalCents, 15000000);
  assert.equal(taxRes.taxBreakdown.totalTaxCents, 2700000);

  // Query 2: Live Lead Generation Direct Pipeline Trigger
  const leadQuery = "Find 15 taxation & CA firm owners in Mumbai, find their LinkedIn and numbers, and draft a cold outreach angle";
  const leadRes = await queryCopilotBrain(leadQuery);

  assert.equal(leadRes.intent, "lead_generation");
  assert.ok(leadRes.leadsData);
  assert.ok(leadRes.leadsData.leadsCount > 0);
  assert.ok(leadRes.leadsData.leads[0].ownerName);
  assert.ok(leadRes.leadsData.leads[0].directPhone);
  assert.ok(leadRes.leadsData.leads[0].linkedinUrl);
  assert.ok(leadRes.leadsData.leads[0].outreachAngle);

  // Query 3: 1-Click Pitch Deck & SOW Contract Generation
  const closingQuery = "Create a custom pitch deck and SOW contract for Aura Botanicals with 50% advance";
  const closingRes = await queryCopilotBrain(closingQuery);

  assert.equal(closingRes.intent, "contract_pitch");
  assert.ok(closingRes.closingData);
  assert.ok(closingRes.closingData.pitchDeckSlidesCount >= 8);
  assert.ok(closingRes.closingData.contractTitle);
  assert.ok(closingRes.closingData.contractJurisdiction);
  assert.ok(closingRes.closingData.advanceSplit.includes("50%"));

  // Query 4: Financial & Business Health Q&A
  const finQuery = "What is my net profit margin this month, which invoices are overdue, and how much tax do I need to set aside?";
  const finRes = await queryCopilotBrain(finQuery);

  assert.equal(finRes.intent, "finance_health");
  assert.ok(finRes.financeData);
  assert.ok(typeof finRes.financeData.netProfitMarginPercent === "number");
  assert.ok(typeof finRes.financeData.cashRunwayDays === "number");
  assert.ok(finRes.financeData.taxReserveNeededFormatted);
});

test("Phase 16.5 — Sovereign Local AI Inference Verification (No External Lead Brokers)", async () => {
  const result = await queryCopilotBrain("Calculate GST on ₹2,00,000 consulting retainer in Mumbai");
  assert.equal(result.inferenceProvider, "self_sovereign_rules");
  assert.ok(result.taxBreakdown);
  assert.equal(result.taxBreakdown.subtotalCents, 20000000);
  assert.equal(result.taxBreakdown.cgstCents, 1800000); // 9% = 18,000 = 1,800,000 paise
  assert.equal(result.taxBreakdown.sgstCents, 1800000); // 9% = 18,000 = 1,800,000 paise
  assert.equal(result.taxBreakdown.totalTaxCents, 3600000); // 18% = 36,000 = 3,600,000 paise
});
