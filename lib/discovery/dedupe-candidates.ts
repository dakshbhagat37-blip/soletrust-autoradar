import type { CandidateRecord } from "../providers/types.ts";

export type DeduplicatedCandidate = CandidateRecord & {
  corroboratingProviders: string[];
  allSourceUrls: string[];
};

function normalizeCoreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(nursingh?\s*home|hospitals?|clinics?|centres?|centers?|pvt\.?|ltd\.?|private\s*limited)\b/gi, "")
    .replace(/\b([a-z])\s+([a-z])\s+([a-z])\b/gi, "$1$2$3") // "s h s" -> "shs"
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

function extractDistinctLocality(address?: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  // Recognizable distinct road/area anchors
  const areas = [
    "satellite",
    "surendra mangaldas",
    "ambawadi",
    "bodakdev",
    "navrangpura",
    "gota",
    "kankaria",
    "shahibaug",
    "alkapuri",
    "manjalpur",
    "gotri",
    "karelibaug",
    "mansarovar",
    "malviya nagar",
    "vidhyadhar nagar",
    "c scheme",
    "tonk road",
    "amer road",
    "ajmer road",
    "rehari",
    "gandhi nagar",
    "trikota nagar",
    "talab tillo",
    "bakshi nagar",
  ];
  for (const area of areas) {
    if (lower.includes(area)) {
      return area.replace(/\s+/g, "_");
    }
  }
  return null;
}

function extractFacilityAnchor(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b\d+[\w-]*\b/); // house/plot number, e.g. "32"
  const locality = extractDistinctLocality(address);
  if (match && locality) {
    return `${match[0]}_${locality}`;
  }
  return locality;
}

function candidateIdentityKey(c: CandidateRecord): string {
  const facilityAnchor = extractFacilityAnchor(c.address);
  const city = (c.city || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();

  if (c.domain) {
    return `domain:${c.domain.toLowerCase().replace(/^www\./, "")}`;
  }

  const coreName = normalizeCoreName(c.companyName);

  // If two records share core name and physical address anchor (e.g. "SHS Memorial" at "32_rehari"),
  // they represent the exact same physical facility mapped multiple times
  if (coreName.length >= 3 && facilityAnchor) {
    return `facility:${coreName}|${facilityAnchor}|${city}`;
  }

  const name = c.companyName.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();

  if (city) {
    return `name_city:${name}|${city}`;
  }

  return `name_only:${name}`;
}

export function dedupeCandidates(
  candidates: CandidateRecord[],
): DeduplicatedCandidate[] {
  const grouped = new Map<string, DeduplicatedCandidate>();

  for (const candidate of candidates) {
    if (!candidate.companyName || candidate.companyName.trim().length === 0) {
      continue;
    }

    let key = candidateIdentityKey(candidate);
    let existing = grouped.get(key);

    // If candidate has a domain and matched an existing domain entry, check if they are distinct physical branches
    if (candidate.domain && existing) {
      const existingLocality = extractDistinctLocality(existing.address);
      const candLocality = extractDistinctLocality(candidate.address);

      if (existingLocality && candLocality && existingLocality !== candLocality) {
        // Distinct physical branches in different areas of the city!
        existing.isBranch = true;
        existing.branchLocality = existingLocality.replace(/_/g, " ");

        key = `domain_branch:${candidate.domain.toLowerCase().replace(/^www\./, "")}|${candLocality}`;
        existing = grouped.get(key); // Check if this branch already has an entry
      }
    }

    if (!existing) {
      const isBranch = key.startsWith("domain_branch:") || Boolean(candidate.isBranch);
      const branchLocality = isBranch
        ? (extractDistinctLocality(candidate.address)?.replace(/_/g, " ") || candidate.branchLocality || null)
        : null;

      grouped.set(key, {
        ...candidate,
        isBranch,
        branchLocality,
        parentBrand: candidate.parentBrand || candidate.companyName,
        corroboratingProviders: [candidate.provider],
        allSourceUrls: candidate.sourceUrl ? [candidate.sourceUrl] : [],
      });
      continue;
    }

    // Merge evidence across providers
    if (!existing.corroboratingProviders.includes(candidate.provider)) {
      existing.corroboratingProviders.push(candidate.provider);
    }

    if (candidate.sourceUrl && !existing.allSourceUrls.includes(candidate.sourceUrl)) {
      existing.allSourceUrls.push(candidate.sourceUrl);
    }

    // Enrich missing fields from secondary provider
    if (!existing.website && candidate.website) {
      existing.website = candidate.website;
      existing.domain = candidate.domain;
    }
    if (!existing.phone && candidate.phone) {
      existing.phone = candidate.phone;
    }
    if (!existing.address && candidate.address) {
      existing.address = candidate.address;
    }
    if (!existing.description && candidate.description) {
      existing.description = candidate.description;
    }

    // Upgrade confidence if corroborated by multiple independent providers
    if (existing.corroboratingProviders.length >= 2) {
      existing.confidence = "high";
    }
  }

  return Array.from(grouped.values());
}

