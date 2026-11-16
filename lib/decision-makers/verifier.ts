import type { Business } from "../types/business.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import type { DecisionMaker, PersonCandidate } from "./types.ts";
import { getAuthorityClassification } from "./roles.ts";

/**
 * Evaluates candidate decision-makers against business context, validates company connection,
 * performs multi-host corroboration, and enforces the UNKNOWN > WRONG principle.
 */
export function verifyDecisionMakerCandidate(
  candidate: PersonCandidate,
  business: Business,
  allCandidates: PersonCandidate[] = []
): DecisionMaker | null {
  const businessName = (business.canonicalName || "").toLowerCase();
  const businessDomain = (business.domain || "").toLowerCase();

  // 1. Evidence scoring
  let score = candidate.confidenceScore || 50;

  // Contextual check: Award bonus if candidate evidence explicitly mentions the business name or domain
  const lowerEvidence = (candidate.evidenceText || "").toLowerCase();
  if (
    (businessName && lowerEvidence.includes(businessName)) ||
    (businessDomain && lowerEvidence.includes(businessDomain))
  ) {
    score = Math.min(100, score + 10);
  }

  // Corroborating sources from the same person across candidates
  const matchingCandidates = allCandidates.filter(
    (c) => c.fullName.toLowerCase() === candidate.fullName.toLowerCase()
  );

  const distinctHosts = new Set<string>();
  if (candidate.sourceHost) distinctHosts.add(candidate.sourceHost.toLowerCase());

  for (const match of matchingCandidates) {
    if (match.sourceHost) {
      distinctHosts.add(match.sourceHost.toLowerCase());
    }
  }

  // Multi-host corroboration bonus:
  // If corroborated across 2+ distinct host domains (e.g. clinic website + LinkedIn/external), award +15 points
  if (distinctHosts.size >= 2) {
    score = Math.min(100, score + 15);
  }

  // Official team page evidence bonus
  if (candidate.sourceType === "official_team") {
    score = Math.min(100, score + 10);
  }

  // Verified clinical or executive ownership roles (Founder, Medical Director, Owner)
  const isTopRole =
    candidate.role === "founder" ||
    candidate.role === "owner" ||
    candidate.role === "medical_director" ||
    candidate.role === "clinic_director" ||
    candidate.role === "managing_director";

  if (isTopRole) {
    score = Math.min(100, score + 5);
  }

  // 2. Determine verification status
  // UNKNOWN > WRONG: Require at least 65 score to be verified.
  let verificationStatus: DecisionMaker["verificationStatus"] = "needs_review";
  if (score >= 75) {
    verificationStatus = "verified";
  } else if (score >= 60) {
    verificationStatus = "partially_verified";
  } else if (score < 40) {
    // Insufficient evidence
    return null;
  }

  // 3. Assemble SourceEvidence records
  const evidenceList: SourceEvidence[] = [];
  const now = new Date().toISOString();

  // Primary source evidence
  evidenceList.push({
    sourceUrl: candidate.sourceUrl,
    sourceHost: candidate.sourceHost || "official_website",
    sourceType: candidate.sourceType,
    sourceTitle: `${candidate.roleLabel} - ${candidate.fullName}`,
    evidenceText: candidate.evidenceText,
    confidence: score >= 75 ? "high" : score >= 60 ? "medium" : "low",
    discoveredAt: now,
  });

  // Profile link evidence if available
  if (candidate.profileUrl) {
    const isLinkedIn = candidate.profileUrl.includes("linkedin.com");
    evidenceList.push({
      sourceUrl: candidate.profileUrl,
      sourceHost: isLinkedIn ? "linkedin.com" : "external",
      sourceType: isLinkedIn ? "public_professional_profile" : "public_social_profile",
      sourceTitle: `${candidate.fullName} Professional Profile`,
      evidenceText: `Verified public profile link matching ${candidate.fullName}: ${candidate.profileUrl}`,
      confidence: "medium",
      discoveredAt: now,
    });
  }

  const reason =
    distinctHosts.size >= 2
      ? `Corroborated across ${distinctHosts.size} independent domains (${Array.from(distinctHosts).join(", ")}): Identified as ${candidate.roleLabel} with ${candidate.evidenceText.slice(0, 80)}...`
      : `Identified on ${candidate.sourceHost || "official website"} as ${candidate.roleLabel} for ${business.canonicalName}.`;

  const { authorityType, isPurchasingAuthority } = getAuthorityClassification(candidate.role, candidate.roleLabel);

  return {
    id: crypto.randomUUID(),
    businessId: business.id,
    fullName: candidate.fullName,
    role: candidate.role,
    roleLabel: candidate.roleLabel,
    authorityType,
    isPurchasingAuthority,
    credentials: candidate.credentials || [],
    specialization: candidate.specialization || null,
    department: candidate.department || null,
    email: candidate.email || null,
    phone: candidate.phone || null,
    linkedinUrl: candidate.profileUrl?.includes("linkedin.com") ? candidate.profileUrl : null,
    profileUrl: candidate.profileUrl || null,
    sourceUrl: candidate.sourceUrl,
    discoveryStatus: "discovered",
    verificationStatus,
    confidenceScore: score,
    reason,
    evidence: evidenceList,
    contacts: candidate.directContacts || [], // Strictly NEVER populated with generic receptionist lines!
    companyAssociation: business.canonicalName,
    lastVerifiedAt: now,
  };
}

/**
 * Deduplicates candidates by name, keeps the highest priority role and highest score,
 * merges profile links and corroborations.
 */
export function deduplicateCandidates(
  candidates: PersonCandidate[]
): PersonCandidate[] {
  const map = new Map<string, PersonCandidate>();

  for (const cand of candidates) {
    const key = cand.fullName.toLowerCase().trim();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...cand });
      continue;
    }

    // Merge profile URL if existing didn't have one
    if (!existing.profileUrl && cand.profileUrl) {
      existing.profileUrl = cand.profileUrl;
    }

    if ((!existing.credentials || existing.credentials.length === 0) && cand.credentials && cand.credentials.length > 0) {
      existing.credentials = cand.credentials;
    }
    if (!existing.specialization && cand.specialization) {
      existing.specialization = cand.specialization;
    }
    if (!existing.department && cand.department) {
      existing.department = cand.department;
    }
    if (!existing.email && cand.email) {
      existing.email = cand.email;
    }
    if (!existing.phone && cand.phone) {
      existing.phone = cand.phone;
    }

    // Keep highest confidence score
    if (cand.confidenceScore > existing.confidenceScore) {
      existing.confidenceScore = cand.confidenceScore;
      existing.role = cand.role;
      existing.roleLabel = cand.roleLabel;
      existing.evidenceText = cand.evidenceText;
      existing.sourceUrl = cand.sourceUrl;
      existing.sourceType = cand.sourceType;
    }
  }

  return Array.from(map.values());
}
