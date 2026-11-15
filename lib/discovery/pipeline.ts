import type { SearchJobQuery } from "../types/search-job.ts";
import { waterfall } from "../providers/waterfall.ts";
import { normalizeCandidate } from "./candidate-normalize.ts";
import { filterCandidate, type CandidateFilterResult } from "./filter.ts";
import { dedupeCandidates, type DeduplicatedCandidate } from "./dedupe-candidates.ts";
import { getSearchJob, saveSearchJob } from "../jobs/store.ts";
import { logger } from "../logging/logger.ts";

export type RejectedCandidate = {
  candidate: DeduplicatedCandidate;
  reasons: string[];
};

export type DiscoveryStageResult = {
  accepted: DeduplicatedCandidate[];
  review: DeduplicatedCandidate[];
  rejected: RejectedCandidate[];
  stats: {
    totalDiscovered: number;
    afterDeduplication: number;
    acceptedCount: number;
    reviewCount: number;
    rejectedCount: number;
  };
  durationMs: number;
  attemptedProviders: string[];
  successfulProviders: string[];
};

export async function executeBusinessDiscovery(
  query: SearchJobQuery,
  options?: {
    searchJobId?: string;
    requestedProviderId?: string;
  },
): Promise<DiscoveryStageResult> {
  const startTime = Date.now();

  logger.info("Executing Business Discovery stage", {
    context: "executeBusinessDiscovery",
    searchJobId: options?.searchJobId,
    data: query,
  });

  // 1. Update SearchJob status if ID provided
  if (options?.searchJobId) {
    const job = await getSearchJob(options.searchJobId);
    if (job) {
      job.status = "discovering";
      job.currentStage = "discovery";
      job.progress = 15;
      await saveSearchJob(job);
    }
  }

  // 2. Run waterfall provider execution
  const waterfallResult = await waterfall.runWaterfall(query, {
    searchJobId: options?.searchJobId,
    requestedProviderId: options?.requestedProviderId,
  });

  // 3. Normalize all candidate records
  const normalized = waterfallResult.candidates.map(normalizeCandidate);

  // 4. Multi-source deduplication and evidence merging
  const deduped = dedupeCandidates(normalized);

  // 5. Pre-filtering & Aggregator segregation
  const accepted: DeduplicatedCandidate[] = [];
  const review: DeduplicatedCandidate[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const cand of deduped) {
    const filterRes: CandidateFilterResult = filterCandidate(cand, query);

    if (filterRes.status === "accepted") {
      accepted.push(cand);
    } else if (filterRes.status === "review") {
      review.push(cand);
    } else {
      rejected.push({
        candidate: cand,
        reasons: filterRes.reasons,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const stats = {
    totalDiscovered: waterfallResult.totalCandidates,
    afterDeduplication: deduped.length,
    acceptedCount: accepted.length,
    reviewCount: review.length,
    rejectedCount: rejected.length,
  };

  // 6. Update SearchJob stageStats in store
  if (options?.searchJobId) {
    const job = await getSearchJob(options.searchJobId);
    if (job) {
      job.stageStats.candidatesFound = stats.totalDiscovered;
      job.stageStats.uniqueBusinesses = stats.afterDeduplication;
      job.stageStats.rejectedLeads = stats.rejectedCount;
      job.progress = 25;
      await saveSearchJob(job);
    }
  }

  logger.info("Business Discovery stage completed", {
    context: "executeBusinessDiscovery",
    searchJobId: options?.searchJobId,
    data: {
      stats,
      durationMs,
      successfulProviders: waterfallResult.successfulProviders,
    },
  });

  return {
    accepted,
    review,
    rejected,
    stats,
    durationMs,
    attemptedProviders: waterfallResult.attemptedProviders,
    successfulProviders: waterfallResult.successfulProviders,
  };
}

