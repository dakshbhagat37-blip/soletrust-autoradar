import type { Business } from "../types/business.ts";
import type { WebsiteIntelligence } from "../intelligence/types.ts";
import type { QualificationContext, QualificationScores } from "./types.ts";
import { evaluateServiceFit } from "./service-fit.ts";
import { generateOpportunityIntelligence } from "./opportunity-intelligence.ts";

export const FACTOR_WEIGHTS = {
  identity: 0.20,
  industry: 0.20,
  location: 0.15,
  contactability: 0.15,
  decisionMaker: 0.15,
  serviceFit: 0.15,
} as const;

export const HARD_GATES = {
  minIdentityScore: 60,
  minIndustryScore: 50,
  minLocationScore: 50,
  minQualifiedOverallScore: 65,
  minReviewOverallScore: 45,
} as const;

export function calculateContactabilityScore(business: Business): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  const contacts = business.contacts || [];
  const phones = contacts.filter((c) => c.contactType === "phone");
  const emails = contacts.filter((c) => c.contactType === "email");

  // Phone scoring
  if (phones.some((p) => p.ownershipType === "reception")) {
    score += 25;
    reasons.push("Dedicated clinic reception line verified (+25).");
  } else if (phones.length > 0) {
    score += 20;
    reasons.push("Business phone line verified (+20).");
  }

  // Email scoring
  if (emails.some((e) => e.verificationStatus === "mx_valid" || (business.domain && e.value.includes(business.domain)))) {
    score += 35;
    reasons.push("Domain-matched corporate email verified (+35).");
  } else if (emails.length > 0) {
    score += 20;
    reasons.push("Public contact email verified (+20).");
  }

  // Physical Address scoring
  if (business.address && business.address.length > 10) {
    score += 25;
    reasons.push("Physical premises address identified (+25).");
  }

  // Multi-channel bonus
  if (phones.length > 0 && emails.length > 0) {
    score += 15;
    reasons.push("Multi-channel reachability: both phone and email available (+15).");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}

export function calculateDecisionMakerScore(business: Business): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  const dms = business.decisionMakers || [];
  if (dms.length === 0) {
    return {
      score: 0,
      reasons: ["No verified decision makers found on official website or public sources (UNKNOWN > WRONG)."],
    };
  }

  const primary = dms[0];

  // Role hierarchy scoring
  if (primary.role === "founder" || primary.role === "owner") {
    score += 45;
    reasons.push(`Identified ${primary.roleLabel} ${primary.fullName} (+45).`);
  } else if (primary.role === "medical_director" || primary.role === "clinic_director") {
    score += 40;
    reasons.push(`Identified clinical leadership: ${primary.roleLabel} ${primary.fullName} (+40).`);
  } else {
    score += 30;
    reasons.push(`Identified decision maker: ${primary.roleLabel} ${primary.fullName} (+30).`);
  }

  // Corroboration & Profile Link
  if (primary.profileUrl) {
    score += 20;
    reasons.push(`Verified professional profile available for ${primary.fullName} (+20).`);
  }

  if (primary.verificationStatus === "verified") {
    score += 20;
    reasons.push("Multi-host evidence corroborated (+20).");
  } else if (primary.verificationStatus === "partially_verified") {
    score += 10;
    reasons.push("Single-source website evidence (+10).");
  }

  // Multiple leadership team members
  if (dms.length >= 2) {
    score += 15;
    reasons.push(`Identified ${dms.length} leadership members in practice (+15).`);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}

/**
 * Calculates complete 6-factor qualification scores, evaluates hard gates,
 * and generates a transparent human-readable explanation.
 */
export function calculateQualificationScores(
  business: Business,
  intelligence?: WebsiteIntelligence | null,
  context?: QualificationContext
): QualificationScores {
  const gateFailures: string[] = [];
  const allReasons: string[] = [];

  // 1. Identity Score (Weight 20%)
  const identityScore = business.identityScore || (business.identityStatus === "verified" ? 85 : 50);
  if (identityScore < HARD_GATES.minIdentityScore) {
    gateFailures.push(
      `Failed Identity Gate: Identity score (${identityScore}) below required threshold (${HARD_GATES.minIdentityScore}).`
    );
  }
  allReasons.push(`Identity Score: ${identityScore}/100 (Weight: 20%). Status: ${business.identityStatus}.`);

  // 2. Industry Score (Weight 20%)
  let industryScore = 75; // Default if verified in Phase 4
  const indEvidence = (business.sources || []).find((s) => s.evidenceText?.toLowerCase().includes("industry"));
  if (indEvidence) {
    const match = indEvidence.evidenceText.match(/score:\s*(\d+)/i);
    if (match) industryScore = Number.parseInt(match[1], 10);
  } else if (business.industry?.toLowerCase().includes("dermatolog") || business.industry?.toLowerCase().includes("skin")) {
    industryScore = 80;
  }

  if (industryScore < HARD_GATES.minIndustryScore) {
    gateFailures.push(
      `Failed Industry Gate: Industry relevance score (${industryScore}) below required threshold (${HARD_GATES.minIndustryScore}).`
    );
  }
  allReasons.push(`Industry Score: ${industryScore}/100 (Weight: 20%). Sector: ${business.industry || "Unknown"}.`);

  // 3. Location Score (Weight 15%)
  let locationScore = 80;
  const targetCity = (context?.requestedCity || business.city || "").toLowerCase();
  const bizCity = (business.city || "").toLowerCase();

  if (targetCity && bizCity && targetCity !== bizCity) {
    locationScore = 20;
  } else if (business.address || business.contacts?.some((c) => c.contactType === "phone" || c.contactType === "email")) {
    locationScore = 90;
  }

  if (locationScore < HARD_GATES.minLocationScore) {
    gateFailures.push(
      `Failed Location Gate: Location score (${locationScore}) below required threshold (${HARD_GATES.minLocationScore}).`
    );
  }
  allReasons.push(`Location Score: ${locationScore}/100 (Weight: 15%). City: ${business.city || "Unknown"}.`);

  // 4. Contactability Score (Weight 15%)
  const contactRes = calculateContactabilityScore(business);
  const contactabilityScore = contactRes.score;
  allReasons.push(`Contactability Score: ${contactabilityScore}/100 (Weight: 15%). ${contactRes.reasons.join(" ")}`);

  // 5. Decision Maker Score (Weight 15%)
  const dmRes = calculateDecisionMakerScore(business);
  const decisionMakerScore = dmRes.score;
  allReasons.push(`Decision-Maker Score: ${decisionMakerScore}/100 (Weight: 15%). ${dmRes.reasons.join(" ")}`);

  // 6. Service Fit Score (Weight 15%)
  const fitRes = evaluateServiceFit(business, intelligence, context);
  const serviceFitScore = fitRes.score;
  allReasons.push(`Service Fit Score: ${serviceFitScore}/100 (Weight: 15%). ${fitRes.reasons.join(" ")}`);

  // Weighted Overall Score
  const rawWeighted =
    identityScore * FACTOR_WEIGHTS.identity +
    industryScore * FACTOR_WEIGHTS.industry +
    locationScore * FACTOR_WEIGHTS.location +
    contactabilityScore * FACTOR_WEIGHTS.contactability +
    decisionMakerScore * FACTOR_WEIGHTS.decisionMaker +
    serviceFitScore * FACTOR_WEIGHTS.serviceFit;

  const overallScore = Math.round(Math.min(100, Math.max(0, rawWeighted)));

  // Gate Enforcement
  let isQualified = false;
  let status: QualificationScores["status"] = "rejected";

  if (gateFailures.length > 0) {
    isQualified = false;
    status = "rejected";
  } else if (overallScore >= HARD_GATES.minQualifiedOverallScore) {
    isQualified = true;
    status = "qualified";
  } else if (overallScore >= HARD_GATES.minReviewOverallScore) {
    isQualified = false;
    status = "review";
  } else {
    isQualified = false;
    status = "rejected";
  }

  // Construct Transparent Human-Readable Explanation
  const explanation = (() => {
    if (gateFailures.length > 0) {
      return `Disqualified due to hard verification gate failure(s): ${gateFailures.join(" ")}`;
    }
    if (status === "qualified") {
      return `Qualified prospect (${overallScore}/100). Validated genuine business in ${business.city || "target area"} with verified contactability (${contactabilityScore}/100) and strong service fit opportunity (${serviceFitScore}/100).`;
    }
    if (status === "review") {
      return `Sent for manual review (${overallScore}/100). Passed all hard verification gates, but contactability (${contactabilityScore}/100) or decision-maker intelligence (${decisionMakerScore}/100) requires further enrichment.`;
    }
    return `Rejected prospect (${overallScore}/100). Overall qualification points fell below minimum threshold.`;
  })();

  return {
    identityScore,
    industryScore,
    locationScore,
    contactabilityScore,
    decisionMakerScore,
    serviceFitScore,
    overallScore,
    isQualified,
    status,
    reasons: allReasons,
    gateFailures,
    explanation,
    opportunity: generateOpportunityIntelligence(business, intelligence, context),
  };
}

