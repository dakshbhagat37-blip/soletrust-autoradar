import type { CandidateRecord } from "../providers/types.ts";

export type DeduplicatedCandidate = CandidateRecord & {
  corroboratingProviders: string[];
  allSourceUrls: string[];
};

function candidateIdentityKey(c: CandidateRecord): string {
  if (c.domain) {
    return `domain:${c.domain.toLowerCase().replace(/^www\./, "")}`;
  }

  const name = c.companyName.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();
  const city = (c.city || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();

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

    const key = candidateIdentityKey(candidate);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...candidate,
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

