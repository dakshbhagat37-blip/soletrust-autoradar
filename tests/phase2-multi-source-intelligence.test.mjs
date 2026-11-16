import test from "node:test";
import assert from "node:assert/strict";

test("Phase 2: Multi-Source Business & Decision-Maker Intelligence", async (t) => {
  await t.test("1. Multi-Source Discovery: Nominatim Provider & Waterfall Registry", async () => {
    const { nominatimProvider } = await import("../lib/providers/nominatim.ts");
    const { WaterfallOrchestrator } = await import("../lib/providers/waterfall.ts");

    assert.equal(nominatimProvider.id, "nominatim");
    assert.equal(nominatimProvider.priority, 15);
    assert.equal(nominatimProvider.isEnabled, true);

    const orchestrator = new WaterfallOrchestrator();
    const providers = orchestrator.listProviders();
    const providerIds = providers.map((p) => p.id);

    assert.ok(providerIds.includes("overpass"), "Waterfall must include overpass");
    assert.ok(providerIds.includes("nominatim"), "Waterfall must include nominatim as live complementary source");
    assert.ok(providerIds.includes("searxng"), "Waterfall must include searxng");
  });

  await t.test("2. Data Quality: Distinguishes Legitimate Separate Branches (ADORN Satellite vs Surendra Mangaldas)", async () => {
    const { dedupeCandidates } = await import("../lib/discovery/dedupe-candidates.ts");

    const branch1 = {
      companyName: "ADORN Cosmetic Clinic",
      website: "https://adorn.clinic",
      domain: "adorn.clinic",
      phone: null,
      address: "Satellite Road, Ahmedabad",
      city: "Ahmedabad",
      country: "India",
      industry: "Dermatology",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/11900351768",
      provider: "overpass",
      confidence: "medium",
    };

    const branch2 = {
      companyName: "ADORN AESTHETIC CLINIC",
      website: "https://adorn.clinic",
      domain: "adorn.clinic",
      phone: null,
      address: "Surendra Mangaldas Road, Ambawadi, Ahmedabad",
      city: "Ahmedabad",
      country: "India",
      industry: "Dermatology",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/11900380051",
      provider: "overpass",
      confidence: "medium",
    };

    const deduped = dedupeCandidates([branch1, branch2]);
    assert.equal(deduped.length, 2, "Must preserve both distinct branch clinics rather than discarding one");

    const b1 = deduped.find((d) => d.address?.includes("Satellite"));
    const b2 = deduped.find((d) => d.address?.includes("Surendra Mangaldas"));

    assert.ok(b1, "Satellite branch must be preserved");
    assert.ok(b2, "Surendra Mangaldas branch must be preserved");
    assert.equal(b1.isBranch, true, "Must flag b1 as a branch");
    assert.equal(b2.isBranch, true, "Must flag b2 as a branch");
  });

  await t.test("3. Data Quality: Merges Duplicate Listings of the Same Physical Facility (SHS Memorial at 32, Rehari)", async () => {
    const { dedupeCandidates } = await import("../lib/discovery/dedupe-candidates.ts");

    const facilityNode1 = {
      companyName: "SHS Memorial Nursingh Home",
      website: null,
      domain: null,
      phone: null,
      address: "32, Rehari, Jammu",
      city: "Jammu",
      country: "India",
      industry: "Hospitals",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/6911115906",
      provider: "overpass",
      confidence: "medium",
    };

    const facilityNode2 = {
      companyName: "S H S Memorial Hospital",
      website: null,
      domain: null,
      phone: null,
      address: "Rehari Chowk, 32, Colony Road, Near Gurowara, Rehari",
      city: "Jammu",
      country: "India",
      industry: "Hospitals",
      source: "overpass",
      sourceUrl: "https://www.openstreetmap.org/node/6911280798",
      provider: "overpass",
      confidence: "medium",
    };

    const deduped = dedupeCandidates([facilityNode1, facilityNode2]);
    assert.equal(deduped.length, 1, "Must merge duplicate OSM listings for the same physical hospital");

    const merged = deduped[0];
    assert.ok(merged.allSourceUrls.includes("https://www.openstreetmap.org/node/6911115906"));
    assert.ok(merged.allSourceUrls.includes("https://www.openstreetmap.org/node/6911280798"));
    assert.equal(merged.allSourceUrls.length, 2, "Must preserve both OSM source URLs in evidence");
  });

  await t.test("4. Official Website Verification: Rejects Directories & Validates Authentic Brand Domains", async () => {
    const { verifyOfficialWebsite, isDirectoryOrThirdParty } = await import("../lib/intelligence/website-verifier.ts");

    // Directory exclusion test
    assert.equal(isDirectoryOrThirdParty("justdial.com"), true);
    assert.equal(isDirectoryOrThirdParty("https://www.practo.com/vadodara/clinic"), true);
    assert.equal(isDirectoryOrThirdParty("https://sulekha.com"), true);
    assert.equal(isDirectoryOrThirdParty("https://indiamart.com"), true);
    assert.equal(isDirectoryOrThirdParty("https://lybrate.com"), true);
    assert.equal(isDirectoryOrThirdParty("https://thaperdentalclinic.com"), false);

    const business = {
      id: "biz-test-1",
      canonicalName: "Thaper Dental Clinic",
      website: null,
      domain: null,
      industry: "Dental",
      city: "Jaipur",
      country: "India",
      identityStatus: "verified",
      identityScore: 90,
      qualificationScore: 80,
      status: "qualified",
      sources: [],
      contacts: [],
      decisionMakers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attempting to verify Justdial URL as official website
    const resDir = await verifyOfficialWebsite(business, "https://www.justdial.com/Jaipur/Thaper-Dental-Clinic");
    assert.equal(resDir.isVerified, false, "Must reject directory aggregator as official website");
    assert.equal(resDir.officialWebsite, null);

    // Attempting to verify genuine domain
    const resGenuine = await verifyOfficialWebsite(business, "https://www.thaperdentalclinic.com/");
    assert.equal(resGenuine.isVerified, true, "Must verify authentic matching domain");
    assert.equal(resGenuine.domain, "thaperdentalclinic.com");
    assert.equal(resGenuine.confidence, "high");
    assert.ok(resGenuine.evidence, "Must generate official website SourceEvidence");
  });

  await t.test("5. Contact Intelligence: Distinguishes Reception vs Business vs Direct Phone Lines", async () => {
    const { extractContactsFromHtml } = await import("../lib/intelligence/contact-extractor.ts");

    const sampleHtml = `
      <html>
        <body>
          <div class="header">
            <span>Clinic Helpline: <a href="tel:+912652331122">+91 265 233 1122</a></span>
          </div>
          <div class="appointment-desk">
            <p>For Reception & Appointments: <a href="tel:+919825012345">+91 98250 12345</a></p>
            <p>Reception Email: <a href="mailto:reception@acuraclinic.com">reception@acuraclinic.com</a></p>
          </div>
          <div class="footer">
            <p>General Inquiries: <a href="mailto:info@acuraclinic.com">info@acuraclinic.com</a></p>
          </div>
        </body>
      </html>
    `;

    const extracted = extractContactsFromHtml(sampleHtml, "https://acuraclinic.com");
    const phones = Array.from(extracted.phones.values());
    const emails = Array.from(extracted.emails.values());

    const receptionPhone = phones.find((p) => p.ownershipType === "reception");
    assert.ok(receptionPhone, "Must identify phone in appointment/reception context as reception line");

    const receptionEmail = emails.find((e) => e.email === "reception@acuraclinic.com");
    assert.ok(receptionEmail);
    assert.equal(receptionEmail.ownershipType, "reception");

    const mainEmail = emails.find((e) => e.email === "info@acuraclinic.com");
    assert.ok(mainEmail);
    assert.equal(mainEmail.ownershipType, "business_main");
  });

  await t.test("6. Decision-Maker Intelligence: Strictly Distinguishes Commercial Purchasing from Clinical Authority", async () => {
    const { getAuthorityClassification } = await import("../lib/decision-makers/roles.ts");

    // Pure Clinical Doctors (Doctors/Dermatologists/Dentists without executive ownership)
    const doctorAuth = getAuthorityClassification("clinician_doctor", "Consultant Dermatologist");
    assert.equal(doctorAuth.authorityType, "clinical_authority");
    assert.equal(doctorAuth.isPurchasingAuthority, false, "Clinical authority must NOT have automatic commercial purchasing authority");

    const dentistAuth = getAuthorityClassification("clinician_doctor", "Orthodontist / Dental Surgeon");
    assert.equal(dentistAuth.authorityType, "clinical_authority");
    assert.equal(dentistAuth.isPurchasingAuthority, false);

    // Commercial Purchasing Authorities (Owners, Managing Directors, Purchasing Heads)
    const ownerAuth = getAuthorityClassification("owner", "Clinic Owner & Proprietor");
    assert.equal(ownerAuth.authorityType, "commercial_purchasing");
    assert.equal(ownerAuth.isPurchasingAuthority, true);

    const mdAuth = getAuthorityClassification("managing_director", "Managing Director");
    assert.equal(mdAuth.authorityType, "commercial_purchasing");
    assert.equal(mdAuth.isPurchasingAuthority, true);

    const purchaseHeadAuth = getAuthorityClassification("purchasing_head", "Head of Purchasing & Procurement");
    assert.equal(purchaseHeadAuth.authorityType, "commercial_purchasing");
    assert.equal(purchaseHeadAuth.isPurchasingAuthority, true);
  });

  await t.test("7. Opportunity Intelligence: Articulates Rationale, Tailored Services, and Unknown Fields", async () => {
    const { generateOpportunityIntelligence } = await import("../lib/qualification/opportunity-intelligence.ts");

    const testBusiness = {
      id: "biz-opp-1",
      canonicalName: "Dr. Ramani's Dental Practice",
      website: "http://dentalpracticejaipur.com", // Unencrypted HTTP
      domain: "dentalpracticejaipur.com",
      industry: "Dental",
      city: "Jaipur",
      country: "India",
      address: "Rajendra Marg, Jaipur",
      identityStatus: "verified",
      identityScore: 95,
      qualificationScore: 85,
      status: "qualified",
      sources: [],
      contacts: [{
        contactType: "phone",
        value: "097838 11114",
        ownershipType: "business_main",
        verificationStatus: "syntax_valid",
      }],
      decisionMakers: [{
        id: "dm-1",
        fullName: "Dr. Ramani",
        role: "founder",
        roleLabel: "Founder & Chief Dental Consultant",
        authorityType: "commercial_purchasing",
        isPurchasingAuthority: true,
        companyAssociation: "Dr. Ramani's Dental Practice",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 90,
        evidence: [],
        contacts: [],
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockIntel = {
      url: "http://dentalpracticejaipur.com",
      finalUrl: "http://dentalpracticejaipur.com",
      reachable: true,
      statusCode: 200,
      title: "Dr. Ramani's Dental Clinic",
      description: null,
      headings: ["Welcome"],
      textSnippet: "Welcome to our dental clinic in Jaipur",
      metaTags: {},
      links: [],
      socialLinks: [],
      discoveredPages: { contact: null, about: null, team: null, services: null },
      hasHttps: false, // Security gap
      hasContactPage: false,
      hasTeamPage: false,
      hasCallToAction: false, // Conversion gap
      signals: ["no_https", "missing_meta_description"],
      fetchedAt: new Date().toISOString(),
    };

    const opp = generateOpportunityIntelligence(testBusiness, mockIntel);

    assert.ok(opp.suitabilityRationale.length > 20, "Must provide detailed suitability rationale");
    assert.ok(opp.recommendedServices.some((s) => s.includes("HTTPS Security")), "Must recommend HTTPS security hardening");
    assert.ok(opp.recommendedServices.some((s) => s.includes("Appointment")), "Must recommend online appointment booking");
    assert.equal(opp.targetDecisionMaker?.fullName, "Dr. Ramani");
    assert.equal(opp.targetDecisionMaker?.authorityType, "commercial_purchasing");
    assert.ok(opp.targetDecisionMaker?.approachRationale.includes("purchasing and organizational authority"));
    assert.ok(opp.unknownFields.includes("Verified Corporate / Practice Email"), "Must transparently report unknown email");
  });

  await t.test("8. SearXNG Provider: Reports Unreachable Gracefully When Local Daemon Offline", async () => {
    const { searxngProvider } = await import("../lib/providers/searxng.ts");

    const health = await searxngProvider.checkHealth();
    assert.equal(health.providerId, "searxng");
    // Since Docker daemon is offline on this test runner, health status must be unreachable without throwing
    assert.equal(health.status, "unreachable");
    assert.ok(typeof health.latencyMs === "number");
  });
});

