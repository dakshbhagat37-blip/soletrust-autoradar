import type { Contact } from "./contact";
import type { DecisionMaker } from "./decision-maker";
import type { SourceEvidence } from "./evidence";
import type { QualificationScores } from "./qualification";

export type IdentityStatus =
  | "verified"
  | "partially_verified"
  | "unverified"
  | "rejected";

export type BusinessStatus =
  | "discovered"
  | "researching"
  | "qualified"
  | "review"
  | "rejected"
  | "contacted"
  | "meeting";

export type Business = {
  id: string;
  searchJobId?: string | null;
  canonicalName: string;
  rawName?: string | null;
  website: string | null;
  domain: string | null;
  industry: string | null;
  address?: string | null;
  city: string | null;
  region?: string | null;
  country: string | null;
  employeeRange?: string | null;
  description?: string | null;
  services?: string[];

  identityStatus: IdentityStatus;
  identityScore: number;
  qualificationScore: number;
  serviceTrack?: string | null;
  status: BusinessStatus;

  // Enriched relational data
  sources: SourceEvidence[];
  contacts: Contact[];
  decisionMakers: DecisionMaker[];
  qualification?: QualificationScores | null;
  rawMetadata?: Record<string, unknown>;

  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

