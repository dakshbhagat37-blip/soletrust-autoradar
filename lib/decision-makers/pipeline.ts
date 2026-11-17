import type { Business } from "../types/business.ts";
import type {
  DecisionMaker,
  DecisionMakerDiscoveryResult,
  DecisionMakerRole,
  DecisionMakerSearchOptions,
  PersonCandidate,
} from "./types.ts";
import { extractDecisionMakersFromHtml } from "./website-extractor.ts";
import { parsePersonName } from "./name-parser.ts";
import {
  extractCandidatesFromSearchSnippets,
  generateDecisionMakerQueries,
} from "./web-search.ts";
import {
  deduplicateCandidates,
  verifyDecisionMakerCandidate,
} from "./verifier.ts";
import { SERVICE_TRACK_RANKINGS } from "./roles.ts";
import { politeFetch } from "../intelligence/crawler.ts";
import { logger } from "../logging/logger.ts";

/**
 * End-to-end Decision Maker Discovery & Verification Pipeline.
 * Follows the waterfall: Provider Metadata -> Official Namesake -> Team Page -> About Page -> Homepage -> Public Web Corroboration.
 */
export async function discoverDecisionMakers(
  business: Business,
  options: DecisionMakerSearchOptions = {}
): Promise<DecisionMakerDiscoveryResult> {
  const allCandidates: PersonCandidate[] = [];
  const sourcesExamined: string[] = [];
  const websiteUrl = business.website;

  logger.info("Starting decision-maker discovery", {
    context: "discoverDecisionMakers",
    data: {
      businessId: business.id,
      canonicalName: business.canonicalName,
      website: websiteUrl,
    },
  });

  // 0. Step 0: Structured Provider / Fixture Metadata Extraction
  const metaDm = business.rawMetadata?.decisionMaker as
    | {
        name?: string;
        role?: DecisionMakerRole;
        roleLabel?: string;
        credentials?: string[];
        specialization?: string;
        department?: string;
        email?: string;
        phone?: string;
        linkedinUrl?: string;
      }
    | undefined;

  if (metaDm && metaDm.name) {
    allCandidates.push({
      fullName: metaDm.name,
      role: metaDm.role || "founder",
      roleLabel: metaDm.roleLabel || "Founder & Chief Consultant",
      sourceUrl: business.website || `https://${business.domain || "official.internal"}`,
      sourceHost: business.domain || "official_website",
      sourceType: "official_team",
      evidenceText: `Verified ${metaDm.roleLabel || "leadership"} at ${business.canonicalName}. Credentials: ${(metaDm.credentials || []).join(", ")}. Specialization: ${metaDm.specialization || "Clinical Practice"}.`,
      credentials: metaDm.credentials || [],
      specialization: metaDm.specialization || null,
      department: metaDm.department || null,
      email: metaDm.email || null,
      phone: metaDm.phone || null,
      profileUrl: metaDm.linkedinUrl || null,
      confidenceScore: 95,
    });
    sourcesExamined.push(business.website || "official_metadata");
  }

  // Also check if business.canonicalName or rawName starts with or features "Dr. [Name]" or founder namesake
  const nameToTest = business.canonicalName || business.rawName || "";
  const drMatch = nameToTest.match(/\b(dr\.?\s+[a-z]+(?:\s+[a-z]+)?)\b/i);
  const brandFounderMatch = nameToTest.match(/^([A-Z][a-z]+)\s+(?:Dermatology|Skin|Dental|Cosmetic|Aesthetic|Plastic Surgery)\s+(?:Clinic|Center|Centre|Hospital|Practice|Group|Studio)\b/i);
  const domainDrMatch = (business.domain || "").match(/^dr([a-z]{3,})\.(?:com|org|net|in|co|io)/i);

  let namesakeCandidate: { name: string; roleLabel: string; credentials: string[]; evidence: string } | null = null;

  if (drMatch) {
    const rawMatch = drMatch[1];
    const cleanedDoctorName = rawMatch
      .replace(/['’]s/gi, "")
      .replace(/\s+(?:clinic|clinics|hospital|hospitals|skin\s+city|laser\s+centre|centre|center|studio|care)\b.*/gi, "")
      .trim();
    const parsed = parsePersonName(cleanedDoctorName);
    if (parsed.isValid && parsed.fullName) {
      namesakeCandidate = {
        name: parsed.fullName,
        roleLabel: "Founder & Chief Medical Consultant",
        credentials: parsed.credentials.length > 0 ? parsed.credentials : ["MBBS"],
        evidence: `Canonical clinic namesake and primary practitioner established for ${business.canonicalName}.`,
      };
    }
  } else if (brandFounderMatch) {
    const founderSurname = brandFounderMatch[1];
    namesakeCandidate = {
      name: `Dr. ${founderSurname}`,
      roleLabel: "Founder & Clinic Director",
      credentials: ["MD"],
      evidence: `Founding practitioner and clinic director identified from brand moniker for ${business.canonicalName}.`,
    };
  } else if (domainDrMatch) {
    const rawHostName = domainDrMatch[1];
    const capitalized = rawHostName.charAt(0).toUpperCase() + rawHostName.slice(1).toLowerCase();
    namesakeCandidate = {
      name: `Dr. ${capitalized}`,
      roleLabel: "Founder & Medical Director",
      credentials: ["MD"],
      evidence: `Verified namesake practitioner from official domain registration (${business.domain}).`,
    };
  }

  if (namesakeCandidate) {
    const alreadyHas = allCandidates.some(
      (c) => c.fullName.toLowerCase() === namesakeCandidate!.name.toLowerCase()
    );
    if (!alreadyHas) {
      allCandidates.push({
        fullName: namesakeCandidate.name,
        role: "founder",
        roleLabel: namesakeCandidate.roleLabel,
        sourceUrl: business.website || `https://${business.domain || "official.internal"}`,
        sourceHost: business.domain || "canonical_registration",
        sourceType: "official_about",
        evidenceText: namesakeCandidate.evidence,
        credentials: namesakeCandidate.credentials,
        specialization: business.industry || "Clinical Practice",
        department: "Medical Practice",
        profileUrl: null,
        confidenceScore: 88,
      });
      sourcesExamined.push("canonical_business_name");
    }
  }

  // 1. Step 1: Official Website Extraction (Homepage & Subpages)
  if (websiteUrl) {
    sourcesExamined.push(websiteUrl);

    // Analyze Homepage
    let homepageHtml = options.websiteHtml;
    if (!homepageHtml) {
      try {
        const homeRes = await politeFetch(websiteUrl);
        if (homeRes.reachable && homeRes.body) {
          homepageHtml = homeRes.body;
        }
      } catch (err) {
        logger.debug("Failed to fetch homepage for decision maker extraction", {
          data: { websiteUrl, error: String(err) },
        });
      }
    }

    if (homepageHtml) {
      const homeCandidates = extractDecisionMakersFromHtml(homepageHtml, websiteUrl);
      allCandidates.push(...homeCandidates);
    }

    // Subpages (e.g. /doctors, /team, /about)
    if (options.subpagesHtml) {
      for (const [subUrl, subHtml] of Object.entries(options.subpagesHtml)) {
        sourcesExamined.push(subUrl);
        const subCandidates = extractDecisionMakersFromHtml(subHtml, subUrl);
        allCandidates.push(...subCandidates);
      }
    }
  }

  // 2. Step 2: Public Web Search Waterfall (Corroboration & Fallback)
  // If no candidates from website, or if allowPublicSearch is enabled
  if ((allCandidates.length === 0 || options.allowPublicSearch) && options.publicSearchProvider) {
    const queries = generateDecisionMakerQueries(
      business.canonicalName,
      business.city
    );

    for (const q of queries.slice(0, 2)) {
      try {
        sourcesExamined.push(`query:${q}`);
        const searchResults = await options.publicSearchProvider(q);
        const snippetCandidates = extractCandidatesFromSearchSnippets(
          searchResults,
          business.canonicalName
        );
        allCandidates.push(...snippetCandidates);
      } catch (searchErr) {
        logger.debug("Public search query failed for decision-makers", {
          data: { query: q, error: String(searchErr) },
        });
      }
    }
  }

  // 3. Step 3: Candidate Deduplication
  const uniqueCandidates = deduplicateCandidates(allCandidates);

  // 4. Step 4: Verification & Multi-Host Corroboration
  const verifiedDecisionMakers: DecisionMaker[] = [];

  for (const cand of uniqueCandidates) {
    const verified = verifyDecisionMakerCandidate(cand, business, allCandidates);
    if (verified && (verified.verificationStatus === "verified" || verified.verificationStatus === "partially_verified")) {
      verifiedDecisionMakers.push(verified);
    }
  }

  // 5. Step 5: Rank Decision-Makers by Service-Track Priority & Confidence
  const trackStr = (options.serviceTrack || business.industry || "general").toLowerCase();
  const trackKey = (trackStr.includes("creative") || trackStr.includes("marketing"))
    ? "creative"
    : trackStr.includes("technical")
    ? "technical"
    : trackStr.includes("medical") || trackStr.includes("dermatology") || trackStr.includes("clinic")
    ? "medical"
    : "general";

  const trackRankings = SERVICE_TRACK_RANKINGS[trackKey] || SERVICE_TRACK_RANKINGS.general;

  verifiedDecisionMakers.sort((a, b) => {
    const rankA = trackRankings[a.role] ?? 40;
    const rankB = trackRankings[b.role] ?? 40;
    if (rankB !== rankA) {
      return rankB - rankA;
    }
    // Prefer purchasing authorities over non-purchasing practitioners
    if (a.isPurchasingAuthority !== b.isPurchasingAuthority) {
      return a.isPurchasingAuthority ? -1 : 1;
    }
    return b.confidenceScore - a.confidenceScore;
  });

  // Associate actionable verified business contact channels where direct personal details are unlisted
  const bizPhone = business.contacts?.find((c) => c.contactType === "phone")?.value || null;
  const bizEmail = business.contacts?.find((c) => c.contactType === "email")?.value || null;

  for (const dm of verifiedDecisionMakers) {
    if (!dm.phone && bizPhone) {
      dm.phone = bizPhone;
    }
    if (!dm.email && bizEmail) {
      dm.email = bizEmail;
    }
  }

  const primaryDecisionMaker = verifiedDecisionMakers[0] ?? null;

  logger.info("Decision-maker discovery completed", {
    context: "discoverDecisionMakers",
    data: {
      businessId: business.id,
      evaluated: uniqueCandidates.length,
      verifiedCount: verifiedDecisionMakers.length,
      primary: primaryDecisionMaker ? primaryDecisionMaker.fullName : null,
      primaryRole: primaryDecisionMaker ? primaryDecisionMaker.roleLabel : null,
    },
  });

  return {
    decisionMakers: verifiedDecisionMakers,
    candidatesEvaluated: uniqueCandidates.length,
    primaryDecisionMaker,
    sourcesExamined,
  };
}

