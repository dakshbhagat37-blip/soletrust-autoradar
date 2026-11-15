import type { Contact } from "./contact";
import type { SourceEvidence } from "./evidence";

export type DecisionMakerRole =
  | "founder"
  | "co_founder"
  | "owner"
  | "managing_director"
  | "managing_partner"
  | "medical_director"
  | "clinic_director"
  | "clinical_director"
  | "partner"
  | "ceo"
  | "cto"
  | "cmo"
  | "technical_director"
  | "it_head"
  | "technology_manager"
  | "operations_director"
  | "marketing_director"
  | "marketing_head"
  | "marketing_manager"
  | "brand_manager"
  | "brand_head"
  | "operations_head"
  | "department_head"
  | "clinician_doctor"
  | "other";

export type DecisionMakerVerificationStatus =
  | "discovered"
  | "evidence_found"
  | "partially_verified"
  | "verified"
  | "rejected"
  | "needs_review";

export type AuthorityType =
  | "commercial_purchasing"
  | "clinical_authority"
  | "technical_authority"
  | "marketing_authority"
  | "operational_authority"
  | "general";

export type DecisionMaker = {
  id?: string;
  businessId?: string;
  fullName: string;
  role: DecisionMakerRole;
  roleLabel: string;
  authorityType?: AuthorityType;
  isPurchasingAuthority?: boolean;
  credentials?: string[];
  specialization?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  profileUrl?: string | null;
  sourceUrl?: string | null;
  discoveryStatus: string;
  verificationStatus: DecisionMakerVerificationStatus;
  confidenceScore: number;
  reason?: string | null;
  evidence: SourceEvidence[];
  contacts: Contact[];
};

