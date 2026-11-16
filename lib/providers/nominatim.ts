import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderHealthResult,
  RawDiscoveryResult,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import { logger } from "../logging/logger.ts";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 15_000;

interface NominatimPlaceItem {
  place_id: number;
  osm_id: number;
  osm_type: "node" | "way" | "relation";
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  extratags?: {
    website?: string;
    "contact:website"?: string;
    phone?: string;
    "contact:phone"?: string;
    email?: string;
    "contact:email"?: string;
    opening_hours?: string;
    healthcare?: string;
    "healthcare:speciality"?: string;
    amenity?: string;
  };
}

function extractDomain(urlStr?: string | null): string | null {
  if (!urlStr) return null;
  try {
    const url = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export class NominatimDiscoveryProvider implements DiscoveryProvider {
  readonly id = "nominatim";
  readonly name = "Nominatim OpenStreetMap Places";
  readonly priority = 15; // Complementary geographic text provider
  readonly isEnabled = true;

  async checkHealth(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const url = `${NOMINATIM_SEARCH_URL}?q=hospital&format=jsonv2&limit=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SoleTrustAutoRadar/1.0 (contact@soletrust.internal)",
          Accept: "application/json",
        },
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - start;
      if (res.ok) {
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
        status: "degraded",
        latencyMs,
        message: `HTTP ${res.status}`,
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
    const primaryQuery = `${query.industry} ${query.city} ${query.country}`;
    const rawCandidates: CandidateRecord[] = [];

    // Construct query variations
    const queries = [
      `${query.industry} ${query.city}`,
      `${query.city} ${query.industry}`,
    ];

    for (const q of queries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const params = new URLSearchParams({
          q,
          format: "jsonv2",
          addressdetails: "1",
          extratags: "1",
          limit: String(Math.max(query.limit * 2, 10)),
        });

        const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "SoleTrustAutoRadar/1.0 (contact@soletrust.internal)",
            Accept: "application/json",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          logger.warn(`Nominatim query returned HTTP ${res.status}`, {
            context: "NominatimDiscoveryProvider",
            data: { query: q, status: res.status },
          });
          continue;
        }

        const items = (await res.json()) as NominatimPlaceItem[];
        for (const item of items) {
          const rawName = item.name || item.display_name.split(",")[0]?.trim();
          if (!rawName || rawName.length < 3) continue;

          // Skip generic place categories without proper brand/facility name
          if (/^(hospital|clinic|doctors|dentist|health)$/i.test(rawName)) {
            continue;
          }

          const websiteRaw = item.extratags?.website || item.extratags?.["contact:website"] || null;
          const website = websiteRaw
            ? (websiteRaw.startsWith("http") ? websiteRaw : `https://${websiteRaw}`)
            : null;
          const domain = extractDomain(website);
          const phone = item.extratags?.phone || item.extratags?.["contact:phone"] || null;
          const email = item.extratags?.email || item.extratags?.["contact:email"] || null;

          const addressParts = [
            item.address?.house_number,
            item.address?.road,
            item.address?.suburb,
            item.address?.state_district,
          ].filter(Boolean);
          const address = addressParts.length > 0 ? addressParts.join(", ") : null;

          const osmType = item.osm_type || "node";
          const sourceUrl = `https://www.openstreetmap.org/${osmType}/${item.osm_id}`;

          rawCandidates.push({
            companyName: rawName,
            website,
            domain,
            phone,
            email,
            address,
            city: query.city,
            country: query.country,
            industry: query.industry,
            description: item.display_name || null,
            source: this.id,
            sourceUrl,
            provider: this.id,
            confidence: "medium",
            rawMetadata: {
              osm_id: item.osm_id,
              osm_type: item.osm_type,
              type: item.type,
              class: item.class,
              lat: item.lat,
              lon: item.lon,
            },
          });
        }

        if (rawCandidates.length >= query.limit) {
          break;
        }
      } catch (err) {
        logger.warn(`Nominatim query failed for "${q}"`, {
          context: "NominatimDiscoveryProvider",
          error: err instanceof Error ? err.message : String(err),
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

export const nominatimProvider = new NominatimDiscoveryProvider();

