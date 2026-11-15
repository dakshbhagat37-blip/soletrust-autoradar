import type { SourceEvidence } from "./evidence";

export type ContactType = "email" | "phone";

export type ContactOwnershipType =
  | "business_main"
  | "reception"
  | "department"
  | "decision_maker_direct"
  | "professional_direct"
  | "unknown";

export type ContactVerificationStatus =
  | "extracted"
  | "syntax_valid"
  | "domain_valid"
  | "mx_valid"
  | "provider_verified"
  | "confirmed"
  | "invalid"
  | "unknown";

export type Contact = {
  id?: string;
  businessId?: string;
  decisionMakerId?: string | null;
  contactType: ContactType;
  value: string;
  countryCode?: string | null;
  ownershipType: ContactOwnershipType;
  verificationStatus: ContactVerificationStatus;
  verificationMethod?: string | null;
  sourceUrl?: string | null;
  evidence?: SourceEvidence[];
  verifiedAt?: string | null;
};

