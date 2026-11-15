import type { CandidateRecord } from "../providers/types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import type { Business } from "../types/business.ts";
import type { Contact } from "../types/contact.ts";
import { verifyBusinessIdentity, type IdentityVerificationResult } from "./identity.ts";
import { verifyIndustry, type IndustryVerificationResult } from "./industry.ts";
import { verifyLocation, type LocationVerificationResult } from "./location.ts";
import { logger } from "../logging/logger.ts";

export type BusinessVerificationEvaluation = {
  candidate: CandidateRecord;
  identity: IdentityVerificationResult;
  industry: IndustryVerificationResult;
  location: LocationVerificationResult;
  isVerified: boolean;
  rejectionReasons: string[];
  business?: Business;
};

export function evaluateBusinessVerification(
  candidate: CandidateRecord,
  query: SearchJobQuery,
): BusinessVerificationEvaluation {
  const identity = verifyBusinessIdentity(candidate);
  const industry = verifyIndustry(candidate, query);
  const location = verifyLocation(candidate, query);

  const rejectionReasons: string[] = [];

  if (!identity.passed) {
    rejectionReasons.push(`Identity Verification Failed: ${identity.reasons.join("; ")}`);
  }

  if (!industry.passed) {
    rejectionReasons.push(`Industry Verification Failed: ${industry.reasons.join("; ")}`);
  }

  if (!location.passed) {
    rejectionReasons.push(`Location Verification Failed: ${location.reasons.join("; ")}`);
  }

  const isVerified = identity.passed && industry.passed && location.passed;

  if (!isVerified) {
    return {
      candidate,
      identity,
      industry,
      location,
      isVerified: false,
      rejectionReasons,
    };
  }

  // Aggregate evidence from all three stages
  const allEvidence = [
    ...identity.evidence,
    ...industry.evidence,
    ...location.evidence,
  ];

  // Initial contacts (business phone/email if found)
  const contacts: Contact[] = [];
  if (candidate.phone) {
    contacts.push({
      contactType: "phone",
      value: candidate.phone,
      ownershipType: "business_main", // Correctly labeled as business main line, NOT decision-maker phone!
      verificationStatus: "extracted",
      sourceUrl: candidate.sourceUrl,
      evidence: allEvidence,
      verifiedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  const business: Business = {
    id: crypto.randomUUID(),
    canonicalName: identity.canonicalName,
    rawName: candidate.companyName,
    website: candidate.website,
    domain: candidate.domain,
    industry: candidate.industry || query.industry,
    address: candidate.address || null,
    city: location.city,
    country: location.country,
    employeeRange: candidate.employeeRange || null,
    description: candidate.description || null,
    identityStatus: identity.status,
    identityScore: identity.score,
    qualificationScore: 0, // Calculated in Phase 8
    serviceTrack: query.serviceTrack || "general",
    status: "researching", // Ready for Stage 5: Website Intelligence & Stage 6: Decision-Makers
    sources: allEvidence,
    contacts,
    decisionMakers: [],
    rawMetadata: candidate.rawMetadata,
    createdAt: now,
    updatedAt: now,
  };

  logger.info(`Business verified: "${business.canonicalName}"`, {
    context: "evaluateBusinessVerification",
    data: {
      canonicalName: business.canonicalName,
      domain: business.domain,
      identityScore: identity.score,
      industryScore: industry.score,
      locationScore: location.score,
    },
  });

  return {
    candidate,
    identity,
    industry,
    location,
    isVerified: true,
    rejectionReasons: [],
    business,
  };
}

export function verifyCandidateBatch(
  candidates: CandidateRecord[],
  query: SearchJobQuery,
): {
  verifiedBusinesses: Business[];
  rejectedCandidates: Array<{ candidate: CandidateRecord; reasons: string[] }>;
  stats: {
    totalEvaluated: number;
    verifiedCount: number;
    rejectedCount: number;
  };
} {
  const verifiedBusinesses: Business[] = [];
  const rejectedCandidates: Array<{ candidate: CandidateRecord; reasons: string[] }> = [];

  for (const candidate of candidates) {
    const evaluation = evaluateBusinessVerification(candidate, query);
    if (evaluation.isVerified && evaluation.business) {
      verifiedBusinesses.push(evaluation.business);
    } else {
      rejectedCandidates.push({
        candidate,
        reasons: evaluation.rejectionReasons,
      });
    }
  }

  return {
    verifiedBusinesses,
    rejectedCandidates,
    stats: {
      totalEvaluated: candidates.length,
      verifiedCount: verifiedBusinesses.length,
      rejectedCount: rejectedCandidates.length,
    },
  };
}

