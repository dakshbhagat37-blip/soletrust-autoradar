import { dedupeCompanies } from "./dedupe";
import { normalizeCompany } from "./normalize";
import { MOCK_PROVIDER_ID, mockDiscover } from "./providers/mock";
import type { DiscoveryQuery, DiscoveryResult } from "./types";

export type { DiscoveredCompany, DiscoveryQuery, DiscoveryResult } from "./types";
export { normalizeCompany } from "./normalize";
export { dedupeCompanies } from "./dedupe";
export { MOCK_PROVIDER_ID } from "./providers/mock";

/**
 * Provider contract. New sources (Google Places, Apollo, Hunter, search)
 * should implement this interface and register in PROVIDERS — the pipeline
 * below stays unchanged.
 */
export type DiscoveryProvider = {
  readonly id: string;
  discover(query: DiscoveryQuery): Promise<DiscoveryResult>;
};

export const mockProvider: DiscoveryProvider = {
  id: MOCK_PROVIDER_ID,
  discover: mockDiscover,
};

const PROVIDERS: Record<string, DiscoveryProvider> = {
  [MOCK_PROVIDER_ID]: mockProvider,
};

export function getDiscoveryProvider(id: string = MOCK_PROVIDER_ID): DiscoveryProvider {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`Unknown discovery provider: ${id}`);
  }
  return provider;
}

export async function runDiscovery(
  query: DiscoveryQuery,
  provider: DiscoveryProvider = mockProvider,
): Promise<DiscoveryResult> {
  const raw = await provider.discover(query);
  const normalized = raw.companies
    .map(normalizeCompany)
    .filter((company) => company.companyName.length > 0);
  const unique = dedupeCompanies(normalized);
  const companies = unique.slice(0, query.limit);

  return {
    companies,
    provider: raw.provider,
    total: companies.length,
  };
}
