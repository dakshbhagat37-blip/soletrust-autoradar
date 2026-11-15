import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Phase 3: Business Discovery Engine Verification Suite", () => {
  test("1. Query Generation creates targeted query variants", async () => {
    const { generateDiscoveryQueries } = await import("../lib/discovery/queries.ts");

    const dermaQuery = {
      industry: "Dermatology clinics",
      city: "Vadodara",
      country: "India",
      serviceTrack: "creative+technical",
      limit: 10,
    };

    const dermaVariants = generateDiscoveryQueries(dermaQuery);
    assert.equal(dermaVariants.primary, "Dermatology clinics in Vadodara, India");
    assert.equal(dermaVariants.officialSite, "Dermatology clinics Vadodara official website");
    assert.match(dermaVariants.entityType, /clinic/i, "Must infer 'clinic' noun for dermatology");
    assert.ok(dermaVariants.allQueries.length >= 3);

    const techQuery = {
      industry: "Software development",
      city: "Vadodara",
      country: "India",
      limit: 10,
    };
    const techVariants = generateDiscoveryQueries(techQuery);
    assert.match(techVariants.entityType, /company/i, "Must infer 'company' noun for software");
  });

  test("2. Candidate Normalization strips SEO marketing noise and cleans domains", async () => {
    const { cleanCandidateCompanyName, normalizeCandidate } = await import(
      "../lib/discovery/candidate-normalize.ts"
    );

    const dirtyName1 = "Cutis Skin Care | Best Dermatologist in Vadodara";
    assert.equal(cleanCandidateCompanyName(dirtyName1), "Cutis Skin Care");

    const dirtyName2 = "Acura Skin Clinic - Top 10 Skin Clinics in Gujarat";
    assert.equal(cleanCandidateCompanyName(dirtyName2), "Acura Skin Clinic");

    const rawCandidate = {
      companyName: "  Dr. Mahendra O. Shah Clinic : Official Website  ",
      website: "http://www.drmahendrashah.com/home/",
      domain: null,
      phone: "  +91 265 222 3344  ",
      city: "vadodara",
      country: "india",
      industry: "  dermatology  ",
      source: "mock",
      sourceUrl: "https://mock.example/lead",
      provider: "mock",
      confidence: "medium",
    };

    const normalized = normalizeCandidate(rawCandidate);
    assert.equal(normalized.companyName, "Dr. Mahendra O. Shah Clinic");
    assert.equal(normalized.website, "https://drmahendrashah.com/home");
    assert.equal(normalized.domain, "drmahendrashah.com");
    assert.equal(normalized.city, "Vadodara");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.phone, "+91 265 222 3344");
  });

  test("3. Pre-filter rejects directories, social media, and encyclopedias", async () => {
    const { filterCandidate } = await import("../lib/discovery/filter.ts");

    const query = {
      industry: "Dermatology",
      city: "Vadodara",
      country: "India",
      limit: 10,
    };

    // Directory
    const justdial = {
      companyName: "Top Dermatologists in Vadodara - Justdial",
      website: "https://www.justdial.com/Vadodara/Dermatologists",
      domain: "justdial.com",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://www.justdial.com",
      provider: "searxng",
      confidence: "medium",
    };
    const justdialRes = filterCandidate(justdial, query);
    assert.equal(justdialRes.status, "rejected");
    assert.equal(justdialRes.isAggregator, true);

    // Practo aggregator
    const practo = {
      companyName: "Best Skin Doctors in Vadodara - Practo",
      website: "https://www.practo.com/vadodara/dermatologist",
      domain: "practo.com",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://www.practo.com",
      provider: "searxng",
      confidence: "medium",
    };
    const practoRes = filterCandidate(practo, query);
    assert.equal(practoRes.status, "rejected");

    // Wikipedia article
    const wiki = {
      companyName: "Dermatology - Wikipedia",
      website: "https://en.wikipedia.org/wiki/Dermatology",
      domain: "wikipedia.org",
      phone: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://en.wikipedia.org",
      provider: "searxng",
      confidence: "low",
    };
    const wikiRes = filterCandidate(wiki, query);
    assert.equal(wikiRes.status, "rejected");
    assert.equal(wikiRes.isArticleOrBlog, true);

    // Location conflict (Mumbai clinic returned for Vadodara query)
    const mumbaiClinic = {
      companyName: "Kaya Skin Clinic | Mumbai",
      website: "https://www.kayaclinic.com/mumbai",
      domain: "kayaclinic.com",
      description: "Located in Mumbai, Maharashtra",
      phone: null,
      city: "Mumbai",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://www.kayaclinic.com",
      provider: "searxng",
      confidence: "medium",
    };
    const mumbaiRes = filterCandidate(mumbaiClinic, query);
    assert.equal(mumbaiRes.status, "rejected");
    assert.equal(mumbaiRes.hasLocationConflict, true);

    // Legitimate local business website
    const legitimate = {
      companyName: "Acura Skin Clinic",
      website: "https://www.acuraclinic.com",
      domain: "acuraclinic.com",
      phone: "+91 265 233 4455",
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      source: "searxng",
      sourceUrl: "https://www.acuraclinic.com",
      provider: "searxng",
      confidence: "medium",
    };
    const legitRes = filterCandidate(legitimate, query);
    assert.equal(legitRes.status, "accepted");
    assert.equal(legitRes.isAggregator, false);
  });

  test("4. Multi-Source Deduplication merges corroborating providers and preserves evidence", async () => {
    const { dedupeCandidates } = await import("../lib/discovery/dedupe-candidates.ts");

    // Candidate found by Overpass (has phone, no description)
    const fromOverpass = {
      companyName: "Acura Skin Clinic",
      website: "https://www.acuraclinic.com",
      domain: "acuraclinic.com",
      phone: "+91 265 233 4455",
      address: "Alkapuri, Vadodara",
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      description: null,
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/123",
      provider: "overpass",
      confidence: "medium",
    };

    // Same candidate found by SearXNG (has description, no phone)
    const fromSearxng = {
      companyName: "Acura Skin Clinic",
      website: "https://www.acuraclinic.com",
      domain: "acuraclinic.com",
      phone: null,
      address: null,
      city: "Vadodara",
      country: "India",
      industry: "Dermatology",
      description: "Advanced skin and laser clinic in Vadodara providing medical dermatology.",
      source: "searxng",
      sourceUrl: "https://www.acuraclinic.com",
      provider: "searxng",
      confidence: "medium",
    };

    const deduped = dedupeCandidates([fromOverpass, fromSearxng]);
    assert.equal(deduped.length, 1, "Must deduplicate into a single candidate");

    const merged = deduped[0];
    assert.equal(merged.companyName, "Acura Skin Clinic");
    assert.equal(merged.phone, "+91 265 233 4455", "Must preserve phone from Overpass");
    assert.ok(merged.description, "Must preserve description from SearXNG");
    assert.equal(merged.corroboratingProviders.length, 2, "Must record both corroborating providers");
    assert.ok(merged.corroboratingProviders.includes("overpass"));
    assert.ok(merged.corroboratingProviders.includes("searxng"));
    assert.equal(merged.allSourceUrls.length, 2, "Must preserve both distinct source URLs");
    assert.equal(merged.confidence, "high", "Multi-source corroborated lead must upgrade to high confidence");
  });

  test("5. executeBusinessDiscovery runs full discovery pipeline with drop-off metrics", async () => {
    const { executeBusinessDiscovery } = await import("../lib/discovery/pipeline.ts");
    const { createInitialSearchJob, saveSearchJob } = await import("../lib/jobs/store.ts");

    const query = {
      industry: "Dermatology clinics",
      city: "Vadodara",
      country: "India",
      serviceTrack: "creative+technical",
      limit: 5,
    };

    const job = createInitialSearchJob(query);
    await saveSearchJob(job);

    const result = await executeBusinessDiscovery(query, {
      searchJobId: job.id,
      requestedProviderId: "mock",
    });

    assert.ok(result.stats.totalDiscovered >= 5);
    assert.ok(result.stats.afterDeduplication > 0);
    assert.ok(result.accepted.length > 0);
    assert.equal(result.attemptedProviders[0], "mock");
    assert.equal(result.successfulProviders[0], "mock");

    for (const cand of result.accepted) {
      assert.ok(cand.companyName);
      assert.ok(cand.domain);
      assert.equal(cand.city, "Vadodara");
    }
  });
});

