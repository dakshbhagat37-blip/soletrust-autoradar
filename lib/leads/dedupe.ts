import {
  normalizeCompanyName,
  normalizePlace,
  websiteDomain,
} from "@/lib/discovery/normalize";
import type { DiscoveredCompany } from "@/lib/discovery/types";

export type LeadDedupeRecord = {
  id: string;
  company_name: string;
  website: string | null;
  city: string | null;
  industry: string | null;
  country: string | null;
  employee_range: string | null;
  service_track: string | null;
  score: number | null;
  status: string | null;
  source: string | null;
};

export function isSameLead(
  company: DiscoveredCompany,
  existing: LeadDedupeRecord,
): boolean {
  const companyDomain = websiteDomain(company.website);
  const existingDomain = websiteDomain(existing.website);

  if (companyDomain && existingDomain && companyDomain === existingDomain) {
    return true;
  }

  const companyName = normalizeCompanyName(company.companyName).toLowerCase();
  const existingName = normalizeCompanyName(existing.company_name).toLowerCase();
  const companyCity = normalizePlace(company.city)?.toLowerCase() ?? null;
  const existingCity = normalizePlace(existing.city)?.toLowerCase() ?? null;

  return Boolean(
    companyName &&
      existingName &&
      companyCity &&
      existingCity &&
      companyName === existingName &&
      companyCity === existingCity,
  );
}

export function findExistingLead(
  company: DiscoveredCompany,
  existingLeads: LeadDedupeRecord[],
): LeadDedupeRecord | null {
  return existingLeads.find((lead) => isSameLead(company, lead)) ?? null;
}
