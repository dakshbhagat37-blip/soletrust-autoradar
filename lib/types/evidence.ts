export type EvidenceType =
  | "official_website"
  | "official_about"
  | "official_team"
  | "official_contact"
  | "public_professional_profile"
  | "public_social_profile"
  | "public_business_source"
  | "public_news"
  | "public_directory"
  | "licensed_enrichment"
  | "search_result"
  | "other";

export type SourceEvidence = {
  id?: string;
  sourceUrl: string;
  sourceHost: string;
  sourceType: EvidenceType;
  provider?: string;
  sourceTitle?: string;
  evidenceText: string;
  relevantExcerpt?: string;
  confidence?: "high" | "medium" | "low" | "unknown";
  discoveredAt: string;
  verifiedAt?: string;
  verificationOutcome?: "passed" | "partially_verified" | "rejected" | "unknown";
};

