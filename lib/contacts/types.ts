import type {
  Contact,
  ContactOwnershipType,
  ContactType,
  ContactVerificationStatus,
} from "../types/contact.ts";
import type { SourceEvidence } from "../types/evidence.ts";

export type EmailVerificationResult = {
  email: string;
  normalized: string;
  syntaxValid: boolean;
  domain: string;
  isFreeEmail: boolean;
  isDisposable: boolean;
  domainMatchesBusiness: boolean;
  mxValid: boolean | null;
  mxRecords: string[];
  ownershipType: ContactOwnershipType;
  verificationStatus: ContactVerificationStatus;
  score: number;
  reasons: string[];
};

export type PhoneVerificationResult = {
  rawPhone: string;
  normalized: string | null;
  display: string | null;
  digits: string;
  countryCode: string | null;
  phoneType: "mobile" | "landline" | "toll_free" | "unknown";
  stdAreaCode: string | null;
  syntaxValid: boolean;
  ownershipType: ContactOwnershipType;
  verificationStatus: ContactVerificationStatus;
  score: number;
  reasons: string[];
};

export type ContactVerificationSummary = {
  contacts: Contact[];
  verifiedCount: number;
  partiallyVerifiedCount: number;
  invalidCount: number;
  hasDirectDecisionMakerContact: boolean;
  hasVerifiedBusinessContact: boolean;
  overallScore: number;
  // Four separate counts per Master Requirements:
  verifiedBusinessPhones: number;
  verifiedBusinessEmails: number;
  verifiedDecisionMakerPhones: number;
  verifiedDecisionMakerEmails: number;
};

export type {
  Contact,
  ContactType,
  ContactOwnershipType,
  ContactVerificationStatus,
  SourceEvidence,
};

