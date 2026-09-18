import { websiteDomain } from "@/lib/discovery/normalize";
import type { DiscoveredCompany } from "@/lib/discovery/types";
import type { QualificationContext } from "./types";

const SERVICE_TRACK_INDUSTRY_HINTS: Record<string, readonly string[]> = {
  creative: [
    "marketing",
    "advertising",
    "branding",
    "design",
    "media",
    "creative",
    "content",
    "digital",
  ],
};

function lower(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function industryTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 0);
}

export function industryIsRelevant(
  companyIndustry: string | null,
  requestedIndustry: string,
): boolean {
  const company = lower(companyIndustry);
  const requested = lower(requestedIndustry);
  if (!company || !requested) return false;
  return company === requested || company.includes(requested) || requested.includes(company);
}

export function serviceTrackFitsIndustry(
  companyIndustry: string | null,
  serviceTrack: string,
): boolean {
  const industry = lower(companyIndustry);
  const track = lower(serviceTrack);
  if (!industry || !track) return false;

  const hints = SERVICE_TRACK_INDUSTRY_HINTS[track];
  if (hints) {
    const tokens = industryTokens(industry);
    return hints.some((hint) => tokens.includes(hint) || industry.includes(hint));
  }

  return industry.includes(track);
}

export function isEstablishedSmb(employeeRange: string | null): boolean {
  const range = employeeRange?.trim();
  if (!range) return false;

  const plusMatch = range.match(/^(\d+)\+$/);
  if (plusMatch) {
    const min = Number(plusMatch[1]);
    return min >= 11 && min <= 500;
  }

  const spanMatch = range.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!spanMatch) return false;

  const min = Number(spanMatch[1]);
  const max = Number(spanMatch[2]);
  return min >= 11 && max <= 500;
}

export function hasIdentifiableWebsite(website: string | null): boolean {
  return websiteDomain(website) !== null;
}

export function scoreIcpFit(
  company: DiscoveredCompany,
  context: QualificationContext,
): { points: number; reasons: string[] } {
  let points = 0;
  const reasons: string[] = [];

  if (serviceTrackFitsIndustry(company.industry, context.requestedServiceTrack)) {
    points += 20;
    reasons.push(
      `ICP: industry aligns with requested service track "${context.requestedServiceTrack}" (+20)`,
    );
  }

  if (industryIsRelevant(company.industry, context.requestedIndustry)) {
    points += 10;
    reasons.push("ICP: industry matches the requested industry (+10)");
  }

  return { points, reasons };
}

export function scoreBusinessFit(company: DiscoveredCompany): {
  points: number;
  reasons: string[];
} {
  let points = 0;
  const reasons: string[] = [];

  if (isEstablishedSmb(company.employeeRange)) {
    points += 10;
    reasons.push("Business: employee range indicates an established SMB (+10)");
  }

  if (hasIdentifiableWebsite(company.website)) {
    points += 10;
    reasons.push("Business: identifiable website (+10)");
  }

  return { points, reasons };
}

export function scoreDiscoveryQuality(company: DiscoveredCompany): {
  points: number;
  reasons: string[];
} {
  let points = 0;
  const reasons: string[] = [];
  const source = lower(company.source);

  if (source && source !== "mock") {
    points += 10;
    reasons.push("Discovery: non-mock source (+10)");
  } else {
    reasons.push("Discovery: mock/development source (no source bonus)");
  }

  if (company.sourceUrl) {
    points += 5;
    reasons.push("Discovery: source URL present (+5)");
  }

  if (company.city && company.country) {
    points += 5;
    reasons.push("Discovery: specific city and country (+5)");
  }

  return { points, reasons };
}

export function scoreNeedSignal(company: DiscoveredCompany): {
  points: number;
  reasons: string[];
} {
  // Observable-only until website intelligence exists. No invented intent.
  let points = 0;
  const reasons: string[] = [];

  if (hasIdentifiableWebsite(company.website)) {
    points += 8;
    reasons.push("Need: public website observed (+8)");
  }

  if (company.city && company.country) {
    points += 7;
    reasons.push("Need: specific location observed (+7)");
  }

  if (company.employeeRange) {
    points += 5;
    reasons.push("Need: employee range observed (+5)");
  }

  return { points, reasons };
}

export function scoreReachability(company: DiscoveredCompany): {
  points: number;
  reasons: string[];
} {
  let points = 0;
  const reasons: string[] = [];

  if (hasIdentifiableWebsite(company.website)) {
    points += 5;
    reasons.push("Reachability: website exists (+5)");
  }

  if (company.sourceUrl) {
    points += 5;
    reasons.push("Reachability: source URL exists (+5)");
  }

  return { points, reasons };
}
