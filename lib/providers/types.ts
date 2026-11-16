import type { SearchJobQuery } from "../types/search-job.ts";

export type ProviderHealthStatus = "healthy" | "degraded" | "unreachable" | "disabled";

export type ProviderHealthResult = {
  providerId: string;
  providerName: string;
  status: ProviderHealthStatus;
  latencyMs: number;
  message?: string;
  checkedAt: string;
};

export type CandidateRecord = {
  companyName: string;
  website: string | null;
  domain: string | null;
  phone: string | null;
  email?: string | null;
  address?: string | null;
  city: string | null;
  region?: string | null;
  country: string | null;
  industry: string | null;
  description?: string | null;
  employeeRange?: string | null;
  source: string;
  sourceUrl: string | null;
  provider: string;
  confidence: "high" | "medium" | "low";
  isBranch?: boolean;
  branchLocality?: string | null;
  parentBrand?: string | null;
  rawMetadata?: Record<string, unknown>;
  isMock?: boolean;
};

export type RawDiscoveryResult = {
  provider: string;
  candidates: CandidateRecord[];
  totalReturned: number;
  durationMs: number;
  queryUsed: string;
  nextCursor?: string | null;
};

export type ProviderRunAudit = {
  providerId: string;
  providerName: string;
  query: string;
  operation?: string;
  status: "success" | "empty" | "failed" | "timeout" | "rejected";
  resultCount: number;
  durationMs: number;
  errorMessage?: string | null;
  retryCount?: number;
  rejectionReason?: string | null;
  timestamp: string;
};

export type WaterfallExecutionSummary = {
  query: SearchJobQuery;
  requestedLimit: number;
  attemptedProviders: string[];
  successfulProviders: string[];
  failedProviders: string[];
  providerRuns: ProviderRunAudit[];
  candidates: CandidateRecord[];
  totalCandidates: number;
  primaryProvider: string;
  durationMs: number;
};

export interface DiscoveryProvider {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  readonly isEnabled: boolean;

  checkHealth(): Promise<ProviderHealthResult>;
  discover(query: SearchJobQuery): Promise<RawDiscoveryResult>;
}

