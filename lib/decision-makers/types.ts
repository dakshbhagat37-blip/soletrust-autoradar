import type {
  AuthorityType,
  DecisionMaker,
  DecisionMakerRole,
  DecisionMakerVerificationStatus,
} from "../types/decision-maker.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import type { Contact } from "../types/contact.ts";

export type RoleDefinition = {
  role: DecisionMakerRole;
  label: string;
  patterns: RegExp[];
  priority: number;
  category: "executive" | "clinical" | "management" | "other";
};

export type PersonCandidate = {
  fullName: string;
  role: DecisionMakerRole;
  roleLabel: string;
  sourceUrl: string;
  sourceHost: string;
  sourceType:
    | "official_team"
    | "official_about"
    | "official_website"
    | "public_professional_profile"
    | "search_result"
    | "other";
  evidenceText: string;
  profileUrl?: string | null;
  credentials?: string[];
  specialization?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  directContacts?: Contact[];
  confidenceScore: number;
};

export type DecisionMakerSearchOptions = {
  websiteHtml?: string;
  subpagesHtml?: Record<string, string>;
  allowPublicSearch?: boolean;
  publicSearchProvider?: (query: string) => Promise<Array<{ title: string; url: string; snippet: string }>>;
  maxCandidates?: number;
  serviceTrack?: string;
};

export type DecisionMakerDiscoveryResult = {
  decisionMakers: DecisionMaker[];
  candidatesEvaluated: number;
  primaryDecisionMaker: DecisionMaker | null;
  sourcesExamined: string[];
};

export type {
  AuthorityType,
  DecisionMaker,
  DecisionMakerRole,
  DecisionMakerVerificationStatus,
  SourceEvidence,
  Contact,
};
