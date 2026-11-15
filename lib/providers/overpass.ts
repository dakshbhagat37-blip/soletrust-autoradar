import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderHealthResult,
  RawDiscoveryResult,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import { logger } from "../logging/logger.ts";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 8_000;

type NominatimResult = {
  lat?: string;
  lon?: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function extractDomain(urlStr: string | null): string | null {
  if (!urlStr) return null;
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function normalizeUrl(urlStr: string | null): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

async function geocodeCity(
  city: string,
  country: string,
): Promise<{ lat: number; lon: number } | null> {
  const query = `${city}, ${country}`;
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SoleTrust-AutoRadar/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;

    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return { lat, lon };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildOverpassQuery(lat: number, lon: number, radiusDeg = 0.08): string {
  const south = (lat - radiusDeg).toFixed(5);
  const west = (lon - radiusDeg).toFixed(5);
  const north = (lat + radiusDeg).toFixed(5);
  const east = (lon + radiusDeg).toFixed(5);
  const bbox = `${south},${west},${north},${east}`;

  return `
    [out:json][timeout:10];
    (
      node["amenity"~"clinic|hospital|doctors"](${bbox});
      way["amenity"~"clinic|hospital|doctors"](${bbox});
      node["healthcare"](${bbox});
      way["healthcare"](${bbox});
    );
    out center tags;
  `;
}

export class OverpassDiscoveryProvider implements DiscoveryProvider {
  readonly id = "overpass";
  readonly name = "OpenStreetMap / Overpass Geographic Provider";
  readonly priority = 10; // First provider in waterfall
  readonly isEnabled = true;

  async checkHealth(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const endpoint = OVERPASS_ENDPOINTS[0]!;
      const res = await fetch(`${endpoint}?data=[out:json];node(0,0,0,0);out;`, {
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
        status: "degraded",
        latencyMs,
        message: `Overpass mirror responded with HTTP ${res?.status ?? "none"}`,
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
    const primaryQuery = `${query.industry} in ${query.city}, ${query.country}`;

    const coords = await geocodeCity(query.city, query.country);
    if (!coords) {
      logger.info(`Could not geocode city ${query.city}, proceeding with empty overpass results`, {
        context: "OverpassDiscoveryProvider",
      });
      return {
        provider: this.id,
        candidates: [],
        totalReturned: 0,
        durationMs: Date.now() - start,
        queryUsed: primaryQuery,
      };
    }

    const ql = buildOverpassQuery(coords.lat, coords.lon);
    let elements: OverpassElement[] = [];

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "SoleTrust-AutoRadar/1.0",
          },
          body: `data=${encodeURIComponent(ql)}`,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = (await res.json()) as OverpassResponse;
          elements = data.elements ?? [];
          break; // Succeeded with this endpoint
        }
      } catch (err) {
        logger.warn(`Overpass mirror [${endpoint}] query failed, trying next`, {
          context: "OverpassDiscoveryProvider",
          error: err,
        });
      }
    }

    const candidates: CandidateRecord[] = [];
    const seenNames = new Set<string>();

    for (const el of elements) {
      const tags = el.tags ?? {};
      const name = tags.name?.trim();
      if (!name || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      const rawWebsite = tags.website || tags["contact:website"] || tags.url || null;
      const website = normalizeUrl(rawWebsite);
      const domain = extractDomain(website);
      const phone = tags.phone || tags["contact:phone"] || null;

      const addressParts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
      ].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(", ") : null;

      candidates.push({
        companyName: name,
        website,
        domain,
        phone,
        address,
        city: tags["addr:city"] || query.city,
        country: query.country,
        industry: tags["healthcare:speciality"] || tags.amenity || query.industry,
        description: tags.description || null,
        source: this.id,
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        provider: this.id,
        confidence: "high", // Ground-truth geographic entity
        rawMetadata: {
          osmType: el.type,
          osmId: el.id,
          tags,
        },
      });

      if (candidates.length >= (query.limit || 10) * 2) {
        break;
      }
    }

    return {
      provider: this.id,
      candidates,
      totalReturned: candidates.length,
      durationMs: Date.now() - start,
      queryUsed: primaryQuery,
    };
  }
}

export const overpassProvider = new OverpassDiscoveryProvider();

