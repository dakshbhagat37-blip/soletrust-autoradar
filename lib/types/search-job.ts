import type { Business } from "./business.ts";

export type SearchJobStatus =
  | "pending"
  | "discovering"
  | "verifying"
  | "enriching"
  | "completed"
  | "failed"
  | "cancelled";

export type SearchStage =
  | "queued"
  | "discovery"
  | "identity_verification"
  | "industry_verification"
  | "location_verification"
  | "website_intelligence"
  | "contact_discovery"
  | "decision_maker_discovery"
  | "contact_verification"
  | "qualification"
  | "ranking"
  | "completed"
  | "cancelled";

export type StageDropoffStats = {
  candidatesFound: number;
  uniqueBusinesses: number;
  identityVerified: number;
  industryVerified: number;
  locationVerified: number;
  officialWebsitesFound: number;
  businessContactsFound: number;
  decisionMakersFound: number;
  decisionMakersVerified: number;
  qualifiedLeads: number;
  rejectedLeads: number;
};

export type SearchStageStats = StageDropoffStats;

export type SearchJobQuery = {
  industry: string;
  city: string;
  region?: string;
  country: string;
  serviceTrack?: string;
  limit: number;
  keyword?: string;
  provider?: string;
};

export type SearchJob = {
  id: string;
  query: SearchJobQuery;
  status: SearchJobStatus;
  progress: number; // 0 - 100
  currentStage: SearchStage;
  stageStats: StageDropoffStats;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  leads?: Business[];
};

