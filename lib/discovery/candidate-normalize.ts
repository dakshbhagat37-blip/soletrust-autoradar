import type { CandidateRecord } from "../providers/types.ts";
import { normalizePlace, normalizeWebsite, websiteDomain } from "./normalize.ts";

const MARKETING_SUFFIXES = [
  /\s*[|\-–—:]\s*(best|top|leading|popular|specialist|clinic|hospital|doctor|centre|center|in\s+.*).*$/i,
  /\s+official\s+(website|page|site).*$/i,
  /\s+home\s*page.*$/i,
];

export function cleanCandidateCompanyName(rawName: string): string {
  let cleaned = rawName.trim();

  for (const pattern of MARKETING_SUFFIXES) {
    cleaned = cleaned.replace(pattern, "").trim();
  }

  // Remove trailing punctuations
  cleaned = cleaned.replace(/[|\-–—:,]+$/, "").trim();

  return cleaned.length > 0 ? cleaned : rawName.trim();
}

export function normalizeCandidate(candidate: CandidateRecord): CandidateRecord {
  const companyName = cleanCandidateCompanyName(candidate.companyName);
  const website = normalizeWebsite(candidate.website);
  const domain = websiteDomain(website);

  return {
    ...candidate,
    companyName,
    website,
    domain,
    city: normalizePlace(candidate.city),
    country: normalizePlace(candidate.country),
    industry: candidate.industry?.trim() || null,
    address: candidate.address?.trim() || null,
    phone: candidate.phone?.trim() || null,
  };
}

