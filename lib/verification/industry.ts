import type { CandidateRecord } from "../providers/types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import type { SourceEvidence } from "../types/evidence.ts";

export type IndustryVerificationResult = {
  score: number; // 0 - 100
  matchedIndustry: string;
  evidence: SourceEvidence[];
  reasons: string[];
  passed: boolean;
};

// Domain knowledge semantic clusters
const INDUSTRY_CLUSTERS: Record<string, { strongTerms: string[]; supportingTerms: string[]; negativeTerms: string[] }> = {
  dermatology: {
    strongTerms: [
      "dermatology",
      "dermatologist",
      "skin clinic",
      "skin care",
      "skincare clinic",
      "cosmetology",
      "cosmetic dermatology",
      "laser skin",
      "hair transplant",
      "trichology",
      "aesthetic dermatology",
    ],
    supportingTerms: [
      "skin",
      "hair",
      "laser",
      "anti-aging",
      "pigmentation",
      "acne",
      "botox",
      "fillers",
      "facial",
      "medical clinic",
      "doctor",
    ],
    negativeTerms: [
      "software",
      "restaurant",
      "hotel",
      "furniture",
      "automotive",
      "real estate",
      "law firm",
      "accounting",
    ],
  },
  creative: {
    strongTerms: [
      "branding",
      "graphic design",
      "digital marketing",
      "creative agency",
      "advertising agency",
      "ui/ux",
      "video production",
      "content creation",
    ],
    supportingTerms: [
      "marketing",
      "media",
      "studio",
      "campaigns",
      "social media",
      "brand strategy",
      "web design",
    ],
    negativeTerms: ["hospital", "clinic", "restaurant", "construction", "plumbing"],
  },
  technology: {
    strongTerms: [
      "software development",
      "cloud computing",
      "saas",
      "it services",
      "cybersecurity",
      "devops",
      "data analytics",
      "artificial intelligence",
    ],
    supportingTerms: ["tech", "software", "api", "mobile app", "platform", "systems"],
    negativeTerms: ["clinic", "hair salon", "restaurant", "dermatology", "hotel"],
  },
  dental: {
    strongTerms: [
      "dental clinic",
      "dental",
      "dentist",
      "dentistry",
      "dental hospital",
      "orthodontics",
      "orthodontic",
      "dental care",
      "teeth whitening",
      "dental implant",
      "dental implants",
      "implant clinic",
      "root canal",
    ],
    supportingTerms: ["dental", "dentist", "oral", "teeth", "clinic", "doctor", "smile", "implant"],
    negativeTerms: ["automotive", "software", "restaurant", "hotel", "law firm"],
  },
  hospital: {
    strongTerms: [
      "hospital",
      "super specialty hospital",
      "multispecialty hospital",
      "medical center",
      "medical college",
      "healthcare institute",
      "nursing home",
      "clinical care",
    ],
    supportingTerms: ["hospital", "healthcare", "medical", "doctor", "patients", "clinic", "health", "care", "surgery"],
    negativeTerms: ["software", "dealership", "restaurant", "furniture", "hotel"],
  },
  automotive: {
    strongTerms: [
      "car dealership",
      "automotive dealership",
      "dealership",
      "automobile showroom",
      "motor dealership",
      "car showroom",
      "vehicles",
      "auto sales",
      "automotive",
      "motors",
    ],
    supportingTerms: ["motors", "automotive", "cars", "vehicles", "dealership", "auto", "showroom", "sales", "service center"],
    negativeTerms: ["hospital", "clinic", "skin", "dental", "doctor", "pharmacy"],
  },
  legal: {
    strongTerms: [
      "law firm",
      "advocates",
      "legal associates",
      "attorneys",
      "legal consultancy",
      "solicitors",
      "law chambers",
    ],
    supportingTerms: ["legal", "law", "advocate", "counsel", "court", "litigation", "corporate law"],
    negativeTerms: ["hospital", "clinic", "automotive", "restaurant"],
  },
  supermarket: {
    strongTerms: [
      "supermarket",
      "grocery store",
      "hypermarket",
      "grocery",
      "food market",
      "food store",
      "mart",
      "retail store",
      "provisions",
      "fmcg",
      "organic market",
      "wholesale foods",
    ],
    supportingTerms: ["supermarket", "grocery", "market", "food", "store", "retail", "mart", "provisions", "beverages", "fresh", "produce"],
    negativeTerms: ["hospital", "clinic", "law firm", "software", "automotive dealership"],
  },
};

function inferClusterKey(industryQuery: string): string | null {
  const lower = industryQuery.toLowerCase();
  if (lower.includes("supermarket") || lower.includes("grocery") || lower.includes("mart") || lower.includes("food store") || lower.includes("retail")) {
    return "supermarket";
  }
  if (lower.includes("dermatol") || lower.includes("skin") || lower.includes("cosmetol")) {
    return "dermatology";
  }
  if (lower.includes("dentist") || lower.includes("dental") || lower.includes("teeth") || lower.includes("orthodont")) {
    return "dental";
  }
  if (lower.includes("hospital") || lower.includes("healthcare") || lower.includes("medical center") || lower.includes("nursing home")) {
    return "hospital";
  }
  if (lower.includes("auto") || lower.includes("car") || lower.includes("dealer") || lower.includes("vehicle") || lower.includes("motor")) {
    return "automotive";
  }
  if (lower.includes("law") || lower.includes("legal") || lower.includes("advocate") || lower.includes("attorney")) {
    return "legal";
  }
  if (lower.includes("creative") || lower.includes("marketing") || lower.includes("design") || lower.includes("advertising")) {
    return "creative";
  }
  if (lower.includes("tech") || lower.includes("software") || lower.includes("it")) {
    return "technology";
  }
  return null;
}

export function verifyIndustry(
  candidate: CandidateRecord,
  query: SearchJobQuery,
): IndustryVerificationResult {
  const reasons: string[] = [];
  const evidence: SourceEvidence[] = [];
  const requestedIndustry = query.industry.toLowerCase().trim();
  const clusterKey = inferClusterKey(requestedIndustry);

  const candidateText = [
    candidate.companyName,
    candidate.industry,
    candidate.description,
    candidate.domain,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (clusterKey && INDUSTRY_CLUSTERS[clusterKey]) {
    const cluster = INDUSTRY_CLUSTERS[clusterKey]!;

    // 1. Negative Term Penalty
    const foundNegative = cluster.negativeTerms.filter((term) => candidateText.includes(term));
    if (foundNegative.length > 0) {
      score -= foundNegative.length * 30;
      reasons.push(`Contains conflicting industry terminology: [${foundNegative.join(", ")}] (-${foundNegative.length * 30})`);
    }

    // 2. Explicit Industry Field Match
    if (candidate.industry && (candidate.industry.toLowerCase().includes(requestedIndustry) || requestedIndustry.includes(candidate.industry.toLowerCase()) || cluster.strongTerms.some(t => candidate.industry!.toLowerCase().includes(t)))) {
      score += 25;
      reasons.push(`Explicit candidate industry field aligns: "${candidate.industry}" (+25)`);
    }

    // 3. Strong Term Matches in Name or Description
    const foundStrong = cluster.strongTerms.filter((term) => candidateText.includes(term));
    if (foundStrong.length > 0) {
      const strongBonus = Math.min(50, foundStrong.length * 25);
      score += strongBonus;
      reasons.push(`Identified core industry services/signals: [${foundStrong.join(", ")}] (+${strongBonus})`);

      if (candidate.sourceUrl) {
        evidence.push({
          sourceUrl: candidate.sourceUrl,
          sourceHost: candidate.domain || candidate.source,
          sourceType: "official_website",
          evidenceText: `Verified operational industry terms observed: ${foundStrong.join(", ")}`,
          confidence: "high",
          discoveredAt: new Date().toISOString(),
        });
      }
    }

    // 4. Supporting Term Matches
    const foundSupporting = cluster.supportingTerms.filter((term) => candidateText.includes(term));
    if (foundSupporting.length > 0) {
      const supportingBonus = Math.min(25, foundSupporting.length * 10);
      score += supportingBonus;
      reasons.push(`Supporting industry terms observed: [${foundSupporting.join(", ")}] (+${supportingBonus})`);
    }

    // 5. Provider Tag Match (e.g. Overpass healthcare:speciality, amenity, shop, office)
    if (candidate.rawMetadata?.tags && typeof candidate.rawMetadata.tags === "object") {
      const tags = candidate.rawMetadata.tags as Record<string, string>;
      const tagValues = [
        tags["healthcare:speciality"],
        tags.amenity,
        tags.shop,
        tags.office,
        tags.healthcare,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesTag =
        cluster.strongTerms.some((t) => tagValues.includes(t)) ||
        cluster.supportingTerms.some((t) => tagValues.includes(t)) ||
        (clusterKey && tagValues.includes(clusterKey));

      if (matchesTag) {
        score += 25;
        reasons.push(`OpenStreetMap ground-truth tag verified: [${tagValues}] (+25)`);
      }
    }
  } else {
    // Generic fallback keyword matching
    const tokens = requestedIndustry.split(/\s+/).filter((t) => t.length > 3);
    const matches = tokens.filter((t) => candidateText.includes(t));
    if (matches.length > 0) {
      const genericBonus = Math.min(60, matches.length * 20);
      score += genericBonus;
      reasons.push(`Keyword match for requested industry: [${matches.join(", ")}] (+${genericBonus})`);
    }
  }

  score = Math.min(100, Math.max(0, score));
  const passed = score >= 50;

  if (!passed) {
    reasons.push(`Failed industry gate: score ${score}/100 is below the 50-point threshold`);
  }

  return {
    score,
    matchedIndustry: candidate.industry || query.industry,
    evidence,
    reasons,
    passed,
  };
}
