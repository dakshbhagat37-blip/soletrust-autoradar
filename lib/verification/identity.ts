import type { CandidateRecord } from "../providers/types.ts";
import type { IdentityStatus } from "../types/business.ts";
import type { SourceEvidence } from "../types/evidence.ts";

export type IdentityVerificationResult = {
  status: IdentityStatus;
  score: number; // 0 - 100
  canonicalName: string;
  domain: string | null;
  evidence: SourceEvidence[];
  reasons: string[];
  passed: boolean;
};

const GENERIC_BUSINESS_TOKENS = new Set([
  "the",
  "and",
  "of",
  "in",
  "at",
  "for",
  "a",
  "an",
  "clinic",
  "clinics",
  "hospital",
  "hospitals",
  "centre",
  "center",
  "studio",
  "agency",
  "company",
  "co",
  "ltd",
  "limited",
  "pvt",
  "private",
  "inc",
  "incorporated",
  "llc",
  "llp",
  "care",
  "services",
  "solutions",
  "group",
  "enterprise",
  "official",
  "website",
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function distinctiveTokens(text: string): string[] {
  return normalizeTokens(text).filter((t) => !GENERIC_BUSINESS_TOKENS.has(t) && t.length >= 3);
}

export function verifyBusinessIdentity(
  candidate: CandidateRecord,
): IdentityVerificationResult {
  const reasons: string[] = [];
  const evidence: SourceEvidence[] = [];
  const rawName = candidate.companyName.trim();
  const canonicalName = candidate.companyName.trim();
  const domain = candidate.domain?.toLowerCase().replace(/^www\./, "") ?? null;

  let score = 0;

  // 1. Name Quality Evaluation
  const nameTokens = normalizeTokens(rawName);
  const distinctiveNameTokens = distinctiveTokens(rawName);

  if (distinctiveNameTokens.length === 0 && nameTokens.length < 2) {
    reasons.push(`Company name "${rawName}" is overly generic or too short`);
    return {
      status: "rejected",
      score: 10,
      canonicalName,
      domain,
      evidence,
      reasons,
      passed: false,
    };
  }

  score += 30; // Base score for a distinct company name
  reasons.push(`Distinct business name identified: "${canonicalName}" (+30)`);

  // 2. Domain Association Evidence
  if (domain && candidate.website) {
    const domainPart = domain.split(".")[0] ?? "";
    const domainTokens = domainPart.replace(/[-_]/g, " ").split(/\s+/).filter(Boolean);

    // Check token overlap between domain and business name
    const matchingTokens = distinctiveNameTokens.filter((token) =>
      domainPart.includes(token) || domainTokens.includes(token),
    );

    if (matchingTokens.length > 0) {
      const matchRatio = matchingTokens.length / Math.max(distinctiveNameTokens.length, 1);
      const domainBonus = Math.round(matchRatio * 40);
      score += domainBonus;
      reasons.push(
        `Domain [${domain}] aligns with business name tokens (${matchingTokens.join(", ")}) (+${domainBonus})`,
      );

      evidence.push({
        sourceUrl: candidate.website,
        sourceHost: domain,
        sourceType: "official_website",
        sourceTitle: rawName,
        evidenceText: `Official domain "${domain}" matches business brand identity "${canonicalName}"`,
        confidence: "high",
        discoveredAt: new Date().toISOString(),
      });
    } else {
      // Branded domain that does not directly match name tokens (e.g. Acura Clinic on skinlaser.in)
      score += 15;
      reasons.push(`Candidate operates website [${domain}], but tokens differ from trading name (+15)`);
      evidence.push({
        sourceUrl: candidate.website,
        sourceHost: domain,
        sourceType: "official_website",
        sourceTitle: rawName,
        evidenceText: `Candidate is associated with website domain "${domain}"`,
        confidence: "medium",
        discoveredAt: new Date().toISOString(),
      });
    }
  }

  // 3. Geographic / Physical Entity Association
  if (candidate.address || candidate.phone) {
    score += 20;
    reasons.push("Physical contact or address presence observed (+20)");
    if (candidate.sourceUrl) {
      evidence.push({
        sourceUrl: candidate.sourceUrl,
        sourceHost: candidate.domain || candidate.source,
        sourceType: "official_contact",
        evidenceText: `Verified local contact info: ${candidate.phone ?? candidate.address}`,
        confidence: "high",
        discoveredAt: new Date().toISOString(),
      });
    }
  }

  // 4. Multi-Provider Corroboration Bonus
  if (candidate.confidence === "high") {
    score += 10;
    reasons.push("Identity corroborated by multiple independent data sources (+10)");
  }

  score = Math.min(100, Math.max(0, score));

  let status: IdentityStatus = "unverified";
  if (score >= 70) {
    status = "verified";
  } else if (score >= 45) {
    status = "partially_verified";
  } else {
    status = "unverified";
  }

  const passed = score >= 50;

  return {
    status,
    score,
    canonicalName,
    domain,
    evidence,
    reasons,
    passed,
  };
}
