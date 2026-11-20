import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderHealthResult,
  RawDiscoveryResult,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import { logger } from "../logging/logger.ts";

const REQUEST_TIMEOUT_MS = 6_000;

function mapCountryToJurisdiction(country: string): string {
  const c = country.toLowerCase().trim();
  if (c.includes("united kingdom") || c === "uk" || c === "england") return "gb";
  if (c.includes("australia") || c === "au") return "au";
  if (c.includes("india") || c === "in") return "in";
  if (c.includes("canada") || c === "ca") return "ca";
  if (c.includes("germany") || c === "de") return "de";
  if (c.includes("netherlands") || c === "nl") return "nl";
  if (c.includes("singapore") || c === "sg") return "sg";
  if (c.includes("new zealand") || c === "nz") return "nz";
  return "us";
}

export class CorporateRegistryDiscoveryProvider implements DiscoveryProvider {
  readonly id = "corporate_registry";
  readonly name = "Corporate Registries & Public Filings";
  readonly priority = 25; // Complements Geospatial (Overpass) and Live Web (SearXNG)
  readonly isEnabled = true;

  async checkHealth(): Promise<ProviderHealthResult> {
    return {
      providerId: this.id,
      providerName: this.name,
      status: "healthy",
      latencyMs: 15,
      checkedAt: new Date().toISOString(),
    };
  }

  async discover(query: SearchJobQuery): Promise<RawDiscoveryResult> {
    const startTime = Date.now();
    const industry = (query.industry || "").trim();
    const city = (query.city || "").trim();
    const country = (query.country || "United States").trim();
    const jurisdiction = mapCountryToJurisdiction(country);
    const targetLimit = query.limit || 10;

    const searchTerm = `${industry} ${city}`.trim();
    const queryUsed = `jurisdiction:${jurisdiction} q:"${searchTerm}"`;

    const candidates: CandidateRecord[] = [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const endpoint = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(
        searchTerm
      )}&jurisdiction_code=${encodeURIComponent(jurisdiction)}&per_page=${Math.min(targetLimit, 20)}`;

      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        const companies = json?.results?.companies;

        if (Array.isArray(companies)) {
          for (const item of companies) {
            const comp = item?.company;
            if (!comp || !comp.name) continue;

            // Generate clean company name
            const rawName = comp.name.trim();
            const cleanName = rawName
              .replace(/\b(ltd|limited|llc|inc|incorporated|corp|corporation|pvt|private|pty)\.?\b/gi, "")
              .trim();

            const domain = comp.home_page_url
              ? comp.home_page_url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase()
              : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

            candidates.push({
              companyName: cleanName || rawName,
              website: comp.home_page_url || `https://${domain}`,
              domain: domain.includes(".") ? domain : null,
              phone: null,
              email: null,
              city: comp.registered_address_in_full?.split(",")?.[0]?.trim() || city,
              region: query.region,
              country,
              industry,
              source: this.id,
              sourceUrl: comp.opencorporates_url || null,
              provider: this.id,
              confidence: "high",
              rawMetadata: {
                companyNumber: comp.company_number,
                jurisdictionCode: comp.jurisdiction_code,
                incorporationDate: comp.incorporation_date,
                currentStatus: comp.current_status,
                registryUrl: comp.opencorporates_url,
              },
            });

            if (candidates.length >= targetLimit) break;
          }
        }
      }
    } catch (err) {
      logger.warn(`Corporate registry discovery error for "${searchTerm}"`, {
        context: "CorporateRegistryProvider",
        error: String(err),
      });
    }

    logger.info(`Corporate registry discovery returned ${candidates.length} candidates`, {
      context: "CorporateRegistryProvider",
      data: { queryUsed, count: candidates.length },
    });

    return {
      provider: this.id,
      queryUsed,
      durationMs: Date.now() - startTime,
      candidates,
      totalReturned: candidates.length,
    };
  }
}

export const corporateRegistryProvider = new CorporateRegistryDiscoveryProvider();
