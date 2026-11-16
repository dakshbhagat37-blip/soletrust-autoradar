import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderHealthResult,
  RawDiscoveryResult,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import { logger } from "../logging/logger.ts";
import { generateDiscoveryQueries } from "../discovery/queries.ts";
export { generateDiscoveryQueries };

const REQUEST_TIMEOUT_MS = 8_000;

const BLOCKED_HOSTS = new Set([
  "justdial.com",
  "www.justdial.com",
  "sulekha.com",
  "www.sulekha.com",
  "practo.com",
  "www.practo.com",
  "yelp.com",
  "www.yelp.com",
  "tripadvisor.com",
  "www.tripadvisor.com",
  "foursquare.com",
  "www.foursquare.com",
  "yellowpages.com",
  "www.yellowpages.com",
  "indiamart.com",
  "www.indiamart.com",
  "tradeindia.com",
  "www.tradeindia.com",
  "magicpin.in",
  "www.magicpin.in",
  "zaubacorp.com",
  "www.zaubacorp.com",
  "webindia123.com",
  "www.webindia123.com",
  "dentee.com",
  "www.dentee.com",
  "hexahealth.com",
  "www.hexahealth.com",
  "medindia.net",
  "www.medindia.net",
  "lybrate.com",
  "www.lybrate.com",
  "credihealth.com",
  "www.credihealth.com",
  "threebestrated.in",
  "www.threebestrated.in",
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "wikipedia.org",
  "www.wikipedia.org",
  "youtube.com",
  "www.youtube.com",
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
]);

const BLOCKED_TITLE_KEYWORDS = [
  "wikipedia",
  "top 10",
  "top 20",
  "best 10",
  "best 20",
  "list of",
  "directory",
  "near me",
  "find a",
  "how to",
  "symptoms",
  "treatment guide",
  "reviews",
  "forum",
];

function isBlockedHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().replace(/^www\./, "");
  return BLOCKED_HOSTS.has(clean) || BLOCKED_HOSTS.has(`www.${clean}`);
}

function isBlockedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractDomain(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function cleanCompanyName(title: string): string {
  // Common separator patterns: "Cutis Skin Clinic | Best Dermatologist in Vadodara" -> "Cutis Skin Clinic"
  const parts = title.split(/[|\-–—:]/);
  return (parts[0] ?? title).trim();
}

interface SearXNGItem {
  url: string;
  title: string;
  content?: string;
  engine?: string;
}

export class SearXNGDiscoveryProvider implements DiscoveryProvider {
  readonly id = "searxng";
  readonly name = "SearXNG Meta-Search Engine";
  readonly priority = 20; // Run after geographic sources
  readonly isEnabled = true;

  private getBaseUrl(): string {
    return process.env.SEARXNG_URL?.replace(/\/$/, "") || "http://localhost:8080";
  }

  async checkHealth(): Promise<ProviderHealthResult> {
    const start = Date.now();
    const baseUrl = this.getBaseUrl();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${baseUrl}/healthz`, {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (res && res.status < 500) {
        return {
          providerId: this.id,
          providerName: this.name,
          status: "healthy",
          latencyMs,
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        providerId: this.id,
        providerName: this.name,
        status: "unreachable",
        latencyMs,
        message: `SearXNG endpoint responded with status ${res?.status ?? "no response"}`,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: "unreachable",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async discover(query: SearchJobQuery): Promise<RawDiscoveryResult> {
    const start = Date.now();
    const baseUrl = this.getBaseUrl();
    const primaryQuery = `${query.industry} in ${query.city} ${query.country}`;

    const queryVariants = generateDiscoveryQueries(query);
    const searchQueries = queryVariants.allQueries.slice(0, 3);

    const rawCandidates: CandidateRecord[] = [];
    const seenDomains = new Set<string>();

    for (const q of searchQueries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const params = new URLSearchParams({
          q,
          format: "json",
          language: "en",
        });

        const res = await fetch(`${baseUrl}/search?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "SoleTrust-AutoRadar/1.0",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          logger.warn(`SearXNG query returned HTTP ${res.status}`, {
            context: "SearXNGDiscoveryProvider",
            data: { query: q, status: res.status },
          });
          continue;
        }

        const data = (await res.json()) as { results?: SearXNGItem[] };
        const results = data.results ?? [];

        for (const item of results) {
          if (!item.url || !item.title) continue;

          const domain = extractDomain(item.url);
          if (!domain || isBlockedHost(domain) || isBlockedTitle(item.title)) {
            continue;
          }

          if (seenDomains.has(domain)) {
            continue;
          }
          seenDomains.add(domain);

          const companyName = cleanCompanyName(item.title);
          if (companyName.length < 3) continue;

          rawCandidates.push({
            companyName,
            website: item.url,
            domain,
            phone: null,
            city: query.city,
            country: query.country,
            industry: query.industry,
            description: item.content ?? null,
            source: this.id,
            sourceUrl: item.url,
            provider: this.id,
            confidence: "medium",
            rawMetadata: {
              searchQuery: q,
              engine: item.engine,
              rawTitle: item.title,
            },
          });
        }
      } catch (err) {
        logger.warn(`SearXNG query failed for "${q}"`, {
          context: "SearXNGDiscoveryProvider",
          error: err,
        });
      }
    }

    const durationMs = Date.now() - start;
    return {
      provider: this.id,
      candidates: rawCandidates.slice(0, query.limit * 2),
      totalReturned: rawCandidates.length,
      durationMs,
      queryUsed: primaryQuery,
    };
  }
}

export const searxngProvider = new SearXNGDiscoveryProvider();

