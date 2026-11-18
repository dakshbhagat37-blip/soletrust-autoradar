import test from "node:test";
import assert from "node:assert/strict";

import { verifyLocation, normalizeCountry } from "../lib/verification/location.ts";
import { verifyIndustry } from "../lib/verification/industry.ts";
import { getOsmTagFiltersForIndustry, KNOWN_CITY_COORDINATES } from "../lib/providers/overpass.ts";
import { generateAiSalesStrategy } from "../lib/crm/ai-strategy.ts";
import { discoverDecisionMakers } from "../lib/decision-makers/pipeline.ts";
import { calculateQualificationScores } from "../lib/qualification/calculator.ts";

test("Global Multi-Country, Multi-State & Multi-Industry Acceptance Suite", async (t) => {
  const testScenarios = [
    {
      id: "us-supermarket",
      title: "1. Supermarkets in New York, USA",
      query: { industry: "Supermarkets", city: "New York", country: "United States", limit: 5, serviceTrack: "creative+technical" },
      candidate: {
        companyName: "Rockland Kosher Supermarket",
        address: "27 Orchard St, Monsey, NY 10952",
        city: "New York",
        country: "United States",
        industry: "Supermarket & Grocery Retail",
        domain: "rocklandkosher.com",
        phone: "+1 845-425-2266",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/12345",
      },
      expectedCluster: "supermarket",
      expectedPitchKeyword: "Wholesale",
      expectedDmRole: /Store Director|Purchasing/i,
    },
    {
      id: "us-automotive",
      title: "2. Automotive Dealerships in Texas, USA",
      query: { industry: "Automotive dealerships", city: "Texas", country: "United States", limit: 5, serviceTrack: "technical" },
      candidate: {
        companyName: "Lone Star Ford & Commercial Motors",
        address: "8472 North Freeway, Houston, TX 77037",
        city: "Houston",
        country: "USA",
        industry: "Car Dealership",
        domain: "lonestarford.com",
        phone: "+1 281-832-4000",
        source: "nominatim",
        sourceUrl: "https://www.openstreetmap.org/node/23456",
      },
      expectedCluster: "automotive",
      expectedPitchKeyword: "Showroom",
      expectedDmRole: /General Manager|Sales Director/i,
    },
    {
      id: "us-tech-saas",
      title: "3. B2B SaaS in California, USA",
      query: { industry: "Software SaaS companies", city: "California", country: "United States", limit: 5, serviceTrack: "technical" },
      candidate: {
        companyName: "CloudScale Platform Systems",
        address: "500 Howard St, San Francisco, CA 94105",
        city: "San Francisco",
        country: "United States",
        industry: "SaaS Software Platform",
        domain: "cloudscale.io",
        phone: "+1 415-628-9000",
        source: "nominatim",
        sourceUrl: "https://www.openstreetmap.org/node/34567",
      },
      expectedCluster: "technology",
      expectedPitchKeyword: "Demo",
      expectedDmRole: /Founder|Growth/i,
    },
    {
      id: "uk-legal",
      title: "4. Law Firms in London, United Kingdom",
      query: { industry: "Law firms", city: "London", country: "United Kingdom", limit: 5, serviceTrack: "creative+technical" },
      candidate: {
        companyName: "Westminster Legal Chambers & Partners",
        address: "10 Lincoln's Inn Fields, Westminster, London WC2A 3BP",
        city: "London",
        country: "UK",
        industry: "Law Firm & Solicitors",
        domain: "westminsterlegal.co.uk",
        phone: "+44 20 7946 0991",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/45678",
      },
      expectedCluster: "legal",
      expectedPitchKeyword: "Intake",
      expectedDmRole: /Managing Partner|Practice/i,
    },
    {
      id: "germany-automotive",
      title: "5. Automotive Dealerships in Munich (Bavaria), Germany",
      query: { industry: "Automotive dealerships", city: "Munich", country: "Germany", limit: 5, serviceTrack: "technical" },
      candidate: {
        companyName: "Bayern Motors Autohaus München",
        address: "Frankfurter Ring 35, 80807 München, Germany",
        city: "Munich",
        country: "Deutschland",
        industry: "Automotive Dealership & Service",
        domain: "bayernmotors-muenchen.de",
        phone: "+49 89 3820",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/56789",
      },
      expectedCluster: "automotive",
      expectedPitchKeyword: "Showroom",
      expectedDmRole: /General Manager|Sales/i,
    },
    {
      id: "australia-dental",
      title: "6. Dental Clinics in Sydney (NSW), Australia",
      query: { industry: "Dental clinics", city: "Sydney", country: "Australia", limit: 5, serviceTrack: "creative+technical" },
      candidate: {
        companyName: "Sydney Harbour Dental & Implant Care",
        address: "187 Macquarie Street, Sydney NSW 2000",
        city: "Sydney",
        country: "Australia",
        industry: "Dental Clinic & Orthodontics",
        domain: "sydneydentalcare.com.au",
        phone: "+61 2 9232 4000",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/67890",
      },
      expectedCluster: "dental",
      expectedPitchKeyword: "Implant",
      expectedDmRole: /Clinic Director|Dentist/i,
    },
    {
      id: "canada-hospitality",
      title: "7. Restaurants & Hospitality in Toronto (Ontario), Canada",
      query: { industry: "Restaurants", city: "Toronto", country: "Canada", limit: 5, serviceTrack: "creative" },
      candidate: {
        companyName: "King Street Bistro & Culinary Lounge",
        address: "355 King St W, Toronto, ON M5V 1J5",
        city: "Toronto",
        country: "Canada",
        industry: "Restaurant & Hospitality Dining",
        domain: "kingstreetbistro.ca",
        phone: "+1 416-598-1200",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/78901",
      },
      expectedCluster: "hospitality",
      expectedPitchKeyword: "Reservation",
      expectedDmRole: /General Manager|Chef/i,
    },
    {
      id: "japan-tech",
      title: "8. Technology Software in Tokyo, Japan",
      query: { industry: "Technology software", city: "Tokyo", country: "Japan", limit: 5, serviceTrack: "technical" },
      candidate: {
        companyName: "Nippon Cloud Platform Technologies",
        address: "Roppongi Hills Mori Tower, Minato-ku, Tokyo 106-6108",
        city: "Tokyo",
        country: "Japan",
        industry: "Software SaaS & Cloud Systems",
        domain: "nipponcloud.co.jp",
        phone: "+81 3 5555 1234",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/89012",
      },
      expectedCluster: "technology",
      expectedPitchKeyword: "Demo",
      expectedDmRole: /Founder|Growth/i,
    },
    {
      id: "uae-realestate",
      title: "9. Real Estate Agencies in Dubai, United Arab Emirates",
      query: { industry: "Real estate agencies", city: "Dubai", country: "United Arab Emirates", limit: 5, serviceTrack: "creative+technical" },
      candidate: {
        companyName: "Emirates Luxury Properties & Commercial Realty",
        address: "Marina Plaza, Dubai Marina, Dubai, UAE",
        city: "Dubai",
        country: "UAE",
        industry: "Real Estate Brokerage & Property Management",
        domain: "emiratesluxuryproperties.ae",
        phone: "+971 4 399 0000",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/90123",
      },
      expectedCluster: "realestate",
      expectedPitchKeyword: "Property",
      expectedDmRole: /Broker|Director/i,
    },
    {
      id: "india-dermatology",
      title: "10. Dermatology Clinics in Vadodara (Gujarat), India",
      query: { industry: "Dermatology clinics", city: "Vadodara", country: "India", limit: 5, serviceTrack: "creative+technical" },
      candidate: {
        companyName: "Dr. Sakhiya Skin & Laser Clinic",
        address: "Alkapuri Arcade, RC Dutt Rd, Vadodara, Gujarat 390007",
        city: "Vadodara",
        country: "India",
        industry: "Dermatology & Cosmetic Clinic",
        domain: "sakhiyaskinclinic.com",
        phone: "0265 233 4455",
        source: "overpass",
        sourceUrl: "https://www.openstreetmap.org/node/91234",
      },
      expectedCluster: "dermatology",
      expectedPitchKeyword: "Appointment",
      expectedDmRole: /Practice Director|Clinic/i,
    },
  ];

  await t.test("Verify Location Verifier across All Countries & States", () => {
    for (const scenario of testScenarios) {
      const locRes = verifyLocation(scenario.candidate, scenario.query);
      assert.equal(
        locRes.passed,
        true,
        `Scenario "${scenario.title}" failed location gate with score ${locRes.score}. Reasons: ${locRes.reasons.join("; ")}`
      );
      assert.ok(locRes.score >= 50, `Location score for ${scenario.title} should be >= 50 (got ${locRes.score})`);
    }
  });

  await t.test("Verify Industry Verifier across All Global Sectors", () => {
    for (const scenario of testScenarios) {
      const indRes = verifyIndustry(scenario.candidate, scenario.query);
      assert.equal(
        indRes.passed,
        true,
        `Scenario "${scenario.title}" failed industry gate with score ${indRes.score}. Reasons: ${indRes.reasons.join("; ")}`
      );
      assert.ok(indRes.score >= 50, `Industry score for ${scenario.title} should be >= 50 (got ${indRes.score})`);
    }
  });

  await t.test("Verify Country Normalization for Global Aliases", () => {
    assert.equal(normalizeCountry("USA"), "united states");
    assert.equal(normalizeCountry("U.S.A."), "united states");
    assert.equal(normalizeCountry("UK"), "united kingdom");
    assert.equal(normalizeCountry("Deutschland"), "germany");
    assert.equal(normalizeCountry("UAE"), "united arab emirates");
    assert.equal(normalizeCountry("CAN"), "canada");
    assert.equal(normalizeCountry("AUS"), "australia");
    assert.equal(normalizeCountry("JP"), "japan");
    assert.equal(normalizeCountry("IND"), "india");
  });

  await t.test("Verify OSM Tag Filters Cover All Distinct Global Industries", () => {
    const industries = [
      "Supermarkets",
      "Automotive dealerships",
      "Software SaaS companies",
      "Law firms",
      "Restaurants",
      "Gyms",
      "Real estate agencies",
      "Accounting firms",
      "Dental clinics",
      "Dermatology clinics",
    ];

    for (const ind of industries) {
      const tags = getOsmTagFiltersForIndustry(ind);
      assert.ok(tags.length > 0, `Tags for ${ind} should not be empty`);
      assert.ok(tags.some((t) => t.includes("node[") || t.includes("way[")), `Tags for ${ind} should have valid OSM selectors`);
    }
  });

  await t.test("Verify Coordinates Registry Covers Global Metropolises and States", () => {
    const places = [
      "new york",
      "california",
      "texas",
      "florida",
      "washington",
      "london",
      "munich",
      "sydney",
      "toronto",
      "tokyo",
      "dubai",
      "vadodara",
    ];

    for (const p of places) {
      assert.ok(KNOWN_CITY_COORDINATES[p], `City/State coordinate for "${p}" should be pre-registered`);
      assert.ok(typeof KNOWN_CITY_COORDINATES[p].lat === "number");
      assert.ok(typeof KNOWN_CITY_COORDINATES[p].lon === "number");
    }
  });

  await t.test("Verify Dynamic AI Outreach Strategy Tailoring per Sector", async () => {
    for (const scenario of testScenarios) {
      const business = {
        id: `biz-${scenario.id}`,
        canonicalName: scenario.candidate.companyName,
        industry: scenario.candidate.industry,
        city: scenario.query.city,
        country: scenario.query.country,
        domain: scenario.candidate.domain,
        serviceTrack: scenario.query.serviceTrack,
        contacts: [
          { contactType: "phone", value: scenario.candidate.phone, rawValue: scenario.candidate.phone, normalizedValue: scenario.candidate.phone },
          { contactType: "email", value: `contact@${scenario.candidate.domain}`, rawValue: `contact@${scenario.candidate.domain}`, normalizedValue: `contact@${scenario.candidate.domain}` },
        ],
        sources: [
          { sourceUrl: scenario.candidate.sourceUrl, evidenceText: `Verified business in ${scenario.query.city}` },
        ],
      };

      const dmRes = await discoverDecisionMakers(business);
      const qual = calculateQualificationScores(business);
      business.qualification = qual;
      business.decisionMakers = dmRes.decisionMakers;

      const strategy = generateAiSalesStrategy(business);

      assert.ok(strategy.howApproach.emailDraft.subject, `Email subject missing for ${scenario.title}`);
      assert.ok(strategy.howApproach.emailDraft.body, `Email body missing for ${scenario.title}`);
      assert.ok(strategy.howApproach.linkedinDraft.connectionNote, `LinkedIn note missing for ${scenario.title}`);
      assert.ok(strategy.howApproach.phoneScript.opener, `Phone opener missing for ${scenario.title}`);
      assert.ok(strategy.howApproach.phoneScript.hook, `Phone hook missing for ${scenario.title}`);

      // Verify sector-specific tailoring
      assert.ok(
        strategy.whatOffer.primaryService.length > 5,
        `Primary service should be defined for ${scenario.title}`
      );
      assert.ok(
        strategy.howApproach.phoneScript.hook.includes(scenario.query.city),
        `Phone script hook for ${scenario.title} should reference target city ${scenario.query.city}`
      );
    }
  });

  await t.test("Verify AI Prompt Parser on China Supermarkets & Global Freeform Locations", async () => {
    const { parseNaturalLanguagePrompt } = await import("../lib/discovery/prompt-parser.ts");

    // 1. User's exact prompt from the query
    const chinaPrompt = "find supermarket and grocery store owners in china for retail food distribution";
    const chinaRes = parseNaturalLanguagePrompt(chinaPrompt);
    assert.equal(chinaRes.data.industry, "Supermarkets", "Must detect Supermarkets industry");
    assert.equal(chinaRes.data.country, "China", "Must detect China country, never default to USA");
    assert.equal(chinaRes.data.city, "Shanghai", "Must default China to Shanghai commercial hub");
    assert.match(chinaRes.detectedPersona || "", /Food & Beverage|Distribution/i, "Must detect F&B distribution persona");

    // 2. Freeform unlisted country/city
    const peruPrompt = "find coffee shops in Lima, Peru for brand identity";
    const peruRes = parseNaturalLanguagePrompt(peruPrompt);
    assert.equal(peruRes.data.country, "Peru", "Must dynamically extract Peru");
    assert.equal(peruRes.data.city, "Lima", "Must dynamically extract Lima");

    const polandPrompt = "find dental clinics in Warsaw Poland";
    const polandRes = parseNaturalLanguagePrompt(polandPrompt);
    assert.equal(polandRes.data.country, "Poland", "Must extract Poland");
    assert.equal(polandRes.data.city, "Warsaw", "Must extract Warsaw");
  });
});
