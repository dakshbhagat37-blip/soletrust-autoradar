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
const REQUEST_TIMEOUT_MS = 45_000;

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

export const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  vadodara: { lat: 22.3072, lon: 73.1812 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  surat: { lat: 21.1702, lon: 72.8311 },
  rajkot: { lat: 22.3039, lon: 70.8022 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  jammu: { lat: 32.7266, lon: 74.8570 },
  delhi: { lat: 28.6139, lon: 77.2090 },
  "new delhi": { lat: 28.6139, lon: 77.2090 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  pune: { lat: 18.5204, lon: 73.8567 },
  hyderabad: { lat: 17.3850, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  indore: { lat: 22.7196, lon: 75.8577 },
  bhopal: { lat: 23.2599, lon: 77.4126 },
  patna: { lat: 25.5941, lon: 85.1376 },
};

async function geocodeCity(
  city: string,
  country: string,
): Promise<{ lat: number; lon: number } | null> {
  const cleanCity = city.toLowerCase().trim();
  if (KNOWN_CITY_COORDINATES[cleanCity]) {
    return KNOWN_CITY_COORDINATES[cleanCity];
  }

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

export function getOsmTagFiltersForIndustry(industry: string): string[] {
  const lower = industry.toLowerCase();
  if (lower.includes("car") || lower.includes("auto") || lower.includes("vehicle") || lower.includes("dealer")) {
    return [
      `node["shop"~"car|car_repair|motorcycle"]`,
      `way["shop"~"car|car_repair|motorcycle"]`,
      `node["amenity"~"car_rental|car_wash"]`,
    ];
  }
  if (lower.includes("dental") || lower.includes("dentist") || lower.includes("teeth")) {
    return [
      `node["amenity"="dentist"]`,
      `way["amenity"="dentist"]`,
      `node["healthcare:speciality"~"dentist|orthodontics|dental"]`,
      `way["healthcare:speciality"~"dentist|orthodontics|dental"]`,
      `node["amenity"~"clinic|doctors"]`,
      `way["amenity"~"clinic|doctors"]`,
    ];
  }
  if (lower.includes("hospital")) {
    return [
      `node["amenity"="hospital"]`,
      `way["amenity"="hospital"]`,
      `node["healthcare"="hospital"]`,
      `way["healthcare"="hospital"]`,
    ];
  }
  if (lower.includes("dermatol") || lower.includes("skin") || lower.includes("cosmet")) {
    return [
      `node["healthcare:speciality"~"dermatology|skin"]`,
      `way["healthcare:speciality"~"dermatology|skin"]`,
      `node["amenity"~"clinic|doctors"]`,
      `way["amenity"~"clinic|doctors"]`,
      `node["healthcare"="clinic"]`,
      `way["healthcare"="clinic"]`,
    ];
  }
  if (lower.includes("law") || lower.includes("legal") || lower.includes("advocate")) {
    return [
      `node["office"~"lawyer|legal|notary"]`,
      `way["office"~"lawyer|legal|notary"]`,
      `node["office"="company"]`,
    ];
  }
  if (lower.includes("tech") || lower.includes("software") || lower.includes("it") || lower.includes("agency")) {
    return [
      `node["office"~"it|company|software|telecommunication"]`,
      `way["office"~"it|company|software|telecommunication"]`,
    ];
  }
  return [
    `node["amenity"~"clinic|hospital|doctors|dentist|bank|restaurant"]`,
    `way["amenity"~"clinic|hospital|doctors|dentist|bank|restaurant"]`,
    `node["shop"]`,
    `way["shop"]`,
    `node["office"]`,
    `way["office"]`,
  ];
}

function buildOverpassQuery(lat: number, lon: number, industry: string, radiusDeg = 0.10): string {
  const south = (lat - radiusDeg).toFixed(5);
  const west = (lon - radiusDeg).toFixed(5);
  const north = (lat + radiusDeg).toFixed(5);
  const east = (lon + radiusDeg).toFixed(5);
  const bbox = `${south},${west},${north},${east}`;

  const filters = getOsmTagFiltersForIndustry(industry);
  const queries = filters.map((f) => `    ${f}(${bbox});`).join("\n");

  return `
    [out:json][timeout:35];
    (
${queries}
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

    const ql = buildOverpassQuery(coords.lat, coords.lon, query.industry);
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
        tags["addr:full"],
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:place"],
        tags["addr:district"],
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

