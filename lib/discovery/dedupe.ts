import { normalizeCompanyName, normalizePlace, websiteDomain } from "./normalize";
import type { DiscoveredCompany } from "./types";

type Identity = {
  domain: string | null;
  name: string | null;
  city: string | null;
};

function identity(company: DiscoveredCompany): Identity {
  const name = normalizeCompanyName(company.companyName).toLowerCase();

  return {
    domain: websiteDomain(company.website),
    name: name.length > 0 ? name : null,
    city: normalizePlace(company.city)?.toLowerCase() ?? null,
  };
}

export function dedupeCompanies(companies: DiscoveredCompany[]): DiscoveredCompany[] {
  const seenDomains = new Set<string>();
  const seenNameCity = new Set<string>();
  const seenNameCityWithoutDomain = new Set<string>();
  const seenNameOnly = new Set<string>();
  const unique: DiscoveredCompany[] = [];

  for (const company of companies) {
    const { domain, name, city } = identity(company);
    if (!name) continue;

    const nameCityKey = city ? `${name}|${city}` : null;

    const isDomainDuplicate = domain !== null && seenDomains.has(domain);
    const isNameCityDuplicate =
      nameCityKey !== null &&
      (domain === null
        ? seenNameCity.has(nameCityKey)
        : seenNameCityWithoutDomain.has(nameCityKey));
    const isNameOnlyDuplicate =
      domain === null && city === null && seenNameOnly.has(name);

    if (isDomainDuplicate || isNameCityDuplicate || isNameOnlyDuplicate) {
      continue;
    }

    if (domain) seenDomains.add(domain);
    if (nameCityKey) {
      seenNameCity.add(nameCityKey);
      if (!domain) seenNameCityWithoutDomain.add(nameCityKey);
    }
    if (!domain && !city) seenNameOnly.add(name);

    unique.push(company);
  }

  return unique;
}
