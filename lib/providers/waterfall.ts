import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderRunAudit,
  WaterfallExecutionSummary,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import { overpassProvider } from "./overpass.ts";
import { nominatimProvider } from "./nominatim.ts";
import { searxngProvider } from "./searxng.ts";
import { mockProvider } from "./mock.ts";
import { logger } from "../logging/logger.ts";
import { isSupabaseServerConfigured, createSupabaseServerClient } from "../supabase/server.ts";

export class WaterfallOrchestrator {
  private get defaultProviders(): DiscoveryProvider[] {
    const list: DiscoveryProvider[] = [
      overpassProvider,
      nominatimProvider,
      searxngProvider,
    ];
    // In production, mock provider is strictly and unconditionally excluded,
    // even if ENABLE_MOCK_PROVIDER is set to true.
    if (process.env.NODE_ENV !== "production") {
      list.push(mockProvider);
    }
    return list;
  }

  private providersRegistry: Map<string, DiscoveryProvider> = new Map();

  constructor() {
    this.refreshProviders();
  }

  refreshProviders() {
    this.providersRegistry.clear();
    for (const p of this.defaultProviders) {
      this.registerProvider(p);
    }
  }

  registerProvider(provider: DiscoveryProvider) {
    this.providersRegistry.set(provider.id, provider);
  }

  getProvider(id: string): DiscoveryProvider | undefined {
    return this.providersRegistry.get(id);
  }

  listProviders(): DiscoveryProvider[] {
    return Array.from(this.providersRegistry.values()).sort(
      (a, b) => a.priority - b.priority,
    );
  }

  async runWaterfall(
    query: SearchJobQuery,
    options?: {
      searchJobId?: string;
      requestedProviderId?: string;
      customProviderOrder?: string[];
    },
  ): Promise<WaterfallExecutionSummary> {
    const startTime = Date.now();
    const targetLimit = query.limit || 10;

    // Determine provider chain
    let providersToRun: DiscoveryProvider[] = [];

    if (options?.requestedProviderId) {
      const requested = this.getProvider(options.requestedProviderId);
      if (requested) {
        providersToRun = [
          requested,
          ...this.listProviders().filter((p) => p.id !== requested.id),
        ];
      }
    } else if (options?.customProviderOrder) {
      providersToRun = options.customProviderOrder
        .map((id) => this.getProvider(id))
        .filter((p): p is DiscoveryProvider => Boolean(p));
    }

    if (providersToRun.length === 0) {
      providersToRun = this.listProviders();
    }

    // In production, unconditionally remove mock provider from execution chain
    if (process.env.NODE_ENV === "production") {
      providersToRun = providersToRun.filter((p) => p.id !== "mock");
    }

    const attemptedProviders: string[] = [];
    const successfulProviders: string[] = [];
    const failedProviders: string[] = [];
    const providerRuns: ProviderRunAudit[] = [];
    const collectedCandidates: CandidateRecord[] = [];
    const seenCandidateKeys = new Set<string>();

    logger.info("Starting waterfall discovery", {
      context: "WaterfallOrchestrator",
      searchJobId: options?.searchJobId,
      data: {
        query,
        targetLimit,
        providers: providersToRun.map((p) => p.id),
      },
    });

    for (const provider of providersToRun) {
      if (!provider.isEnabled) {
        continue;
      }

      attemptedProviders.push(provider.id);
      const runStart = Date.now();

      try {
        const result = await provider.discover(query);
        const durationMs = Date.now() - runStart;

        let status: ProviderRunAudit["status"] = "success";
        let rejectionReason: string | undefined;
        if (result.candidates.length === 0) {
          status = "empty";
          rejectionReason = "No matching candidates returned by provider for specified query parameters";
        }

        const audit: ProviderRunAudit = {
          providerId: provider.id,
          providerName: provider.name,
          query: result.queryUsed,
          operation: "discover",
          status,
          resultCount: result.candidates.length,
          durationMs,
          rejectionReason,
          retryCount: 0,
          timestamp: new Date().toISOString(),
        };
        providerRuns.push(audit);

        if (result.candidates.length > 0) {
          successfulProviders.push(provider.id);

          for (const cand of result.candidates) {
            const key = cand.domain
              ? `domain:${cand.domain}`
              : `name:${cand.companyName.toLowerCase().trim()}|city:${(cand.city || "").toLowerCase().trim()}`;

            if (!seenCandidateKeys.has(key)) {
              seenCandidateKeys.add(key);
              collectedCandidates.push(cand);
            }
          }
        }

        // Check if target limit has been satisfied
        if (collectedCandidates.length >= targetLimit) {
          logger.info(`Target limit reached with provider [${provider.id}]`, {
            context: "WaterfallOrchestrator",
            searchJobId: options?.searchJobId,
            data: { totalCollected: collectedCandidates.length, targetLimit },
          });
          break;
        }
      } catch (err) {
        const durationMs = Date.now() - runStart;
        const errorMessage = err instanceof Error ? err.message : String(err);
        failedProviders.push(provider.id);

        logger.warn(`Provider [${provider.id}] failed during waterfall run`, {
          context: "WaterfallOrchestrator",
          searchJobId: options?.searchJobId,
          error: err,
        });

        providerRuns.push({
          providerId: provider.id,
          providerName: provider.name,
          query: `${query.industry} in ${query.city}`,
          operation: "discover",
          status: "failed",
          resultCount: 0,
          durationMs,
          errorMessage,
          rejectionReason: errorMessage,
          retryCount: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Persist provider runs to database if available
    if (options?.searchJobId && isSupabaseServerConfigured()) {
      try {
        const supabase = createSupabaseServerClient();
        await supabase.from("provider_runs").insert(
          providerRuns.map((run) => ({
            search_job_id: options.searchJobId,
            provider_name: run.providerId,
            query: run.query,
            status: run.status,
            result_count: run.resultCount,
            duration_ms: run.durationMs,
            error_message: run.errorMessage,
          })),
        );
      } catch (err) {
        logger.warn("Failed to record provider runs to database", {
          context: "WaterfallOrchestrator",
          error: err,
        });
      }
    }

    const finalCandidates = collectedCandidates.slice(0, targetLimit);
    const durationMs = Date.now() - startTime;
    return {
      query,
      requestedLimit: targetLimit,
      attemptedProviders,
      successfulProviders,
      failedProviders,
      providerRuns,
      candidates: finalCandidates,
      totalCandidates: finalCandidates.length,
      primaryProvider: successfulProviders[0] ?? attemptedProviders[0] ?? "none",
      durationMs,
    };
  }
}

export const waterfall = new WaterfallOrchestrator();

