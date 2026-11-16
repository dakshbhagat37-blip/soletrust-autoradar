import test from "node:test";
import assert from "node:assert/strict";

import { executeBusinessDiscovery } from "../lib/discovery/pipeline.ts";
import { verifyCandidateBatch } from "../lib/verification/gatekeeper.ts";
import { verifyLocation } from "../lib/verification/location.ts";
import { verifyIndustry } from "../lib/verification/industry.ts";
import { getOsmTagFiltersForIndustry, KNOWN_CITY_COORDINATES } from "../lib/providers/overpass.ts";
import { generateDiscoveryQueries } from "../lib/providers/searxng.ts";
import { discoverDecisionMakers } from "../lib/decision-makers/pipeline.ts";
import { calculateQualificationScores } from "../lib/qualification/calculator.ts";
import { createInitialSearchJob, saveSearchJob, saveJobBusinesses } from "../lib/jobs/store.ts";
import { createOrUpdateLeadFromBusiness } from "../lib/crm/store.ts";

test("Multi-Location Discovery: 6 Scenarios Acceptance Suite", async (t) => {
  // Scenario definitions
  const scenarios = [
    {
      id: "scenario-1",
      name: "1. Dermatology clinics — Vadodara, Gujarat",
      query: {
        industry: "Dermatology clinics",
        city: "Vadodara",
        country: "India",
        limit: 5,
        serviceTrack: "creative+technical",
      },
      expectedCluster: "dermatology",
      expectedCityPattern: /vadodara|baroda/i,
      expectedStdCode: "0265",
    },
    {
      id: "scenario-2",
      name: "2. Dermatology clinics — Ahmedabad, Gujarat",
      query: {
        industry: "Dermatology clinics",
        city: "Ahmedabad",
        country: "India",
        limit: 5,
        serviceTrack: "creative+technical",
      },
      expectedCluster: "dermatology",
      expectedCityPattern: /ahmedabad/i,
      expectedStdCode: "079",
    },
    {
      id: "scenario-3",
      name: "3. Dermatology clinics — Surat, Gujarat",
      query: {
        industry: "Dermatology clinics",
        city: "Surat",
        country: "India",
        limit: 5,
        serviceTrack: "creative+technical",
      },
      expectedCluster: "dermatology",
      expectedCityPattern: /surat/i,
      expectedStdCode: "0261",
    },
    {
      id: "scenario-4",
      name: "4. Dental clinics — Jaipur, Rajasthan",
      query: {
        industry: "Dental clinics",
        city: "Jaipur",
        country: "India",
        limit: 5,
        serviceTrack: "technical",
      },
      expectedCluster: "dental",
      expectedCityPattern: /jaipur/i,
      expectedStdCode: "0141",
    },
    {
      id: "scenario-5",
      name: "5. Hospitals — Jammu, Jammu and Kashmir",
      query: {
        industry: "Hospitals",
        city: "Jammu",
        country: "India",
        limit: 5,
        serviceTrack: "creative+technical",
      },
      expectedCluster: "hospital",
      expectedCityPattern: /jammu/i,
      expectedStdCode: "0191",
    },
    {
      id: "scenario-6",
      name: "6. Automotive dealerships — Delhi, India",
      query: {
        industry: "Automotive dealerships",
        city: "Delhi",
        country: "India",
        limit: 5,
        serviceTrack: "technical",
      },
      expectedCluster: "automotive",
      expectedCityPattern: /delhi|new delhi/i,
      expectedStdCode: "011",
    },
  ];

  await t.test("Verify Overpass & SearXNG query specialization across all 6 scenarios", () => {
    for (const sc of scenarios) {
      // 1. Verify OSM tag filter matches industry, not hardcoded dermatology
      const osmFilter = getOsmTagFiltersForIndustry(sc.query.industry);
      assert.ok(osmFilter.length > 0, `OSM filter must exist for ${sc.query.industry}`);

      if (sc.expectedCluster === "dental") {
        assert.ok(osmFilter.some(f => f.includes("dentist")), `Dental industry must target dentist tags, got: ${osmFilter}`);
      } else if (sc.expectedCluster === "hospital") {
        assert.ok(osmFilter.some(f => f.includes("hospital")), `Hospital industry must target hospital tags, got: ${osmFilter}`);
      } else if (sc.expectedCluster === "automotive") {
        assert.ok(osmFilter.some(f => f.includes("car")), `Automotive industry must target car/dealer tags, got: ${osmFilter}`);
      }

      // 2. Verify coordinates table includes city
      const cityKey = sc.query.city.toLowerCase().trim();
      assert.ok(KNOWN_CITY_COORDINATES[cityKey], `City ${sc.query.city} must have known coordinates fallback`);

      // 3. Verify SearXNG search queries include city and industry without hardcoded 'clinic' for non-clinics
      const queries = generateDiscoveryQueries({
        industry: sc.query.industry,
        city: sc.query.city,
        country: sc.query.country,
      }).allQueries;
      assert.ok(queries.length >= 3, `Must generate at least 3 discovery query variations for ${sc.name}`);
      for (const q of queries) {
        assert.ok(q.toLowerCase().includes(sc.query.city.toLowerCase()), `Query must contain target city: ${q}`);
      }
      if (sc.expectedCluster === "automotive") {
        // Must NOT have 'clinic' injected into automotive queries
        const badClinicQuery = queries.find(q => q.toLowerCase().includes("automotive") && q.toLowerCase().includes("clinic"));
        assert.equal(badClinicQuery, undefined, `Automotive queries must never include 'clinic': ${badClinicQuery}`);
      }
    }
  });

  await t.test("Verify Location and Industry Verifier accuracy for each scenario", () => {
    for (const sc of scenarios) {
      // Test industry verification
      const indRes = verifyIndustry(
        {
          companyName: `Premier ${sc.query.industry} Group`,
          industry: sc.query.industry,
          website: `https://example-${sc.query.city.toLowerCase()}.com`,
        },
        sc.query
      );
      assert.ok(indRes.score >= 50, `Industry score for ${sc.name} must pass threshold`);
      assert.equal(indRes.passed, true, `Industry must be verified for ${sc.name}`);

      // Test negative cross-industry rejection
      const crossIndRes = verifyIndustry(
        {
          companyName: "Unrelated Legal Advisory Associates",
          industry: "Legal",
          website: "https://unrelated-legal.com",
        },
        sc.query
      );
      if (sc.expectedCluster !== "legal") {
        assert.equal(crossIndRes.passed, false, `Cross-industry must fail verification for ${sc.name}`);
      }

      // Test location verification with city STD code
      const locRes = verifyLocation(
        {
          companyName: `Premier ${sc.query.industry} Group`,
          city: sc.query.city,
          address: `101 Central Boulevard, ${sc.query.city}, ${sc.query.country}`,
          phone: `${sc.expectedStdCode}2999888`,
        },
        sc.query
      );
      assert.ok(locRes.score >= 60, `Location score for ${sc.name} must be >= 60`);
      assert.equal(locRes.passed, true, `Location must be verified for ${sc.name}`);
      assert.match(locRes.city || "", sc.expectedCityPattern, `Matched city must match target for ${sc.name}`);

      // Negative test: city mismatch rejection (e.g. Vadodara address when searching Ahmedabad)
      const foreignCity = sc.query.city.toLowerCase() === "vadodara" ? "Jaipur" : "Vadodara";
      const mismatchLocRes = verifyLocation(
        {
          companyName: `Premier ${sc.query.industry} Group`,
          city: foreignCity,
          address: `500 Old Palace Road, ${foreignCity}, India`,
          phone: "02652331122",
        },
        sc.query
      );
      assert.equal(mismatchLocRes.passed, false, `Mismatch city location must be rejected for ${sc.name}`);
      assert.ok(mismatchLocRes.score < 50, `Mismatch city location score must be low`);
    }
  });

  await t.test("Execute End-to-End Discovery, Verification & CRM Sync across all 6 scenarios", async () => {
    const resultsSummary = [];

    for (const sc of scenarios) {
      // 1. Create Search Job
      const job = createInitialSearchJob({
        industry: sc.query.industry,
        city: sc.query.city,
        country: sc.query.country,
        limit: sc.query.limit,
        serviceTrack: sc.query.serviceTrack,
        provider: "waterfall",
      });
      job.status = "discovering";
      await saveSearchJob(job);

      // 2. Execute discovery
      const discoveryRes = await executeBusinessDiscovery(job.query, {
        searchJobId: job.id,
      });

      assert.ok(discoveryRes.stats.totalDiscovered > 0, `Must discover candidates for ${sc.name}`);
      assert.ok(discoveryRes.accepted.length > 0, `Must have accepted raw candidates for ${sc.name}`);

      // 3. Verify Candidates
      const verificationRes = verifyCandidateBatch(discoveryRes.accepted, job.query);
      assert.ok(
        verificationRes.stats.verifiedCount > 0,
        `Must verify at least 1 legitimate business for ${sc.name}`
      );

      // Check verified businesses adhere strictly to the target city and industry
      for (const biz of verificationRes.verifiedBusinesses) {
        // Check city
        const cityMatches =
          sc.expectedCityPattern.test(biz.city) ||
          sc.expectedCityPattern.test(biz.address || "");
        assert.ok(
          cityMatches,
          `Business "${biz.canonicalName}" in ${sc.name} must match target city. Got city: "${biz.city}", address: "${biz.address}"`
        );

        // Check industry
        assert.ok(biz.industry, `Industry must exist for "${biz.canonicalName}"`);

        // Check UNKNOWN > WRONG on contacts
        if (biz.contacts && biz.contacts.length > 0) {
          for (const c of biz.contacts) {
            assert.doesNotMatch(c.value, /fake|dummy|test|example\.com/i, `No fake contact allowed for ${biz.canonicalName}`);
          }
        }
      }

      // 4. Decision-Maker Discovery & Role Ranking
      for (const biz of verificationRes.verifiedBusinesses) {
        const dmRes = await discoverDecisionMakers(biz, {
          serviceTrack: job.query.serviceTrack,
        });

        // If decision makers were identified, check authority classification
        for (const dm of dmRes.decisionMakers) {
          assert.ok(dm.fullName && dm.fullName.length > 0, "DM must have a valid fullName");
          assert.ok(dm.roleLabel && dm.roleLabel.length > 0, "DM must have a valid roleLabel");
          if (dm.authorityType) {
            assert.ok(
              [
                "commercial_purchasing",
                "clinical_authority",
                "technical_authority",
                "marketing_authority",
                "operational_authority",
                "general",
              ].includes(dm.authorityType),
              `Invalid authorityType: ${dm.authorityType}`
            );
          }
        }
        biz.decisionMakers = dmRes.decisionMakers;

        // 5. Qualification scoring
        const qual = calculateQualificationScores(biz, job.query);
        biz.qualification = qual;
      }

      // 6. Save Job & Sync Leads to CRM
      await saveJobBusinesses(job.id, verificationRes.verifiedBusinesses);
      job.status = "completed";
      job.progress = 100;
      job.stageStats.candidatesFound = discoveryRes.stats.totalDiscovered;
      job.stageStats.uniqueBusinesses = discoveryRes.stats.afterDeduplication;
      job.stageStats.identityVerified = verificationRes.stats.verifiedCount;
      job.stageStats.locationVerified = verificationRes.stats.verifiedCount;
      job.stageStats.industryVerified = verificationRes.stats.verifiedCount;
      job.stageStats.leadsQualified = verificationRes.verifiedBusinesses.filter(
        b => b.qualification?.isQualified
      ).length;
      await saveSearchJob(job);

      // Verify CRM Lead creation
      let crmCount = 0;
      for (const b of verificationRes.verifiedBusinesses) {
        const lead = await createOrUpdateLeadFromBusiness(b, job.id);
        if (lead) crmCount++;
      }
      assert.ok(crmCount > 0, `Must sync verified leads into CRM store for ${sc.name}`);

      resultsSummary.push({
        scenario: sc.name,
        searchJobId: job.id,
        candidatesFound: job.stageStats.candidatesFound,
        uniqueBusinesses: job.stageStats.uniqueBusinesses,
        verifiedCount: verificationRes.stats.verifiedCount,
        rejectedCount: verificationRes.stats.rejectedCount,
        qualifiedCount: job.stageStats.leadsQualified,
        sampleBusiness: verificationRes.verifiedBusinesses[0]?.canonicalName,
        sampleCity: verificationRes.verifiedBusinesses[0]?.city,
      });
    }

    console.log("\n================ MULTI-LOCATION DISCOVERY RESULTS ================");
    for (const r of resultsSummary) {
      console.log(`[PASS] ${r.scenario}`);
      console.log(`       Job ID: ${r.searchJobId}`);
      console.log(`       Raw Candidates: ${r.candidatesFound} | Unique: ${r.uniqueBusinesses} | Verified: ${r.verifiedCount} | Qualified: ${r.qualifiedCount}`);
      console.log(`       Sample: "${r.sampleBusiness}" (${r.sampleCity})\n`);
    }
  });
});
