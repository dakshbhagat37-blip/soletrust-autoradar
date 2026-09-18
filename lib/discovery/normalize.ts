import type { DiscoveredCompany } from "./types";

export function trimToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function collapseWhitespace(value: string | null | undefined): string | null {
  const trimmed = trimToNull(value);
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, " ");
}

export function normalizeWebsite(value: string | null | undefined): string | null {
  const raw = collapseWhitespace(value);
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (!hostname) return null;

    const pathname = parsed.pathname.replace(/\/+$/, "");
    const path = pathname === "/" ? "" : pathname;

    return `https://${hostname}${path}`;
  } catch {
    return raw;
  }
}

export function websiteDomain(value: string | null | undefined): string | null {
  const website = normalizeWebsite(value);
  if (!website) return null;

  try {
    return new URL(website).hostname;
  } catch {
    return null;
  }
}

export function normalizePlace(value: string | null | undefined): string | null {
  const collapsed = collapseWhitespace(value);
  if (!collapsed) return null;

  const isUniformCase =
    collapsed === collapsed.toLowerCase() || collapsed === collapsed.toUpperCase();

  if (!isUniformCase) return collapsed;

  return collapsed
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeSource(value: string | null | undefined): string {
  const collapsed = collapseWhitespace(value)?.toLowerCase() ?? "";
  if (!collapsed || collapsed === "development") return "mock";
  return collapsed.replace(/\s+/g, "-");
}

export function normalizeCompanyName(value: string | null | undefined): string {
  return collapseWhitespace(value) ?? "";
}

export function normalizeCompany(company: DiscoveredCompany): DiscoveredCompany {
  return {
    companyName: normalizeCompanyName(company.companyName),
    website: normalizeWebsite(company.website),
    industry: collapseWhitespace(company.industry),
    country: normalizePlace(company.country),
    city: normalizePlace(company.city),
    employeeRange: collapseWhitespace(company.employeeRange),
    source: normalizeSource(company.source),
    sourceUrl: normalizeWebsite(company.sourceUrl),
  };
}
