export * from "./types.ts";
export * from "./normalize.ts";
export * from "./dedupe.ts";
export * from "./candidate-normalize.ts";
export * from "./filter.ts";
export * from "./dedupe-candidates.ts";
export * from "./queries.ts";
export * from "./pipeline.ts";

// Legacy exports for backward compatibility
import { dedupeCompanies } from "./dedupe.ts";
import { normalizeCompany } from "./normalize.ts";
import { MOCK_PROVIDER_ID, mockDiscover } from "./providers/mock.ts";
import type { DiscoveryQuery, DiscoveryResult } from "./types.ts";

export { MOCK_PROVIDER_ID } from "./providers/mock.ts";

export type LegacyDiscoveryProvider = {
  readonly id: string;
  discover(query: DiscoveryQuery): Promise<DiscoveryResult>;
};

export const legacyMockProvider: LegacyDiscoveryProvider = {
  id: MOCK_PROVIDER_ID,
  discover: mockDiscover,
};

const LEGACY_PROVIDERS: Record<string, LegacyDiscoveryProvider> = {
  [MOCK_PROVIDER_ID]: legacyMockProvider,
};

export function getDiscoveryProvider(id: string = MOCK_PROVIDER_ID): LegacyDiscoveryProvider {
  const provider = LEGACY_PROVIDERS[id];
  if (!provider) {
    throw new Error(`Unknown discovery provider: ${id}`);
  }
  return provider;
}

export async function runDiscovery(
  query: DiscoveryQuery,
  provider: LegacyDiscoveryProvider = legacyMockProvider,
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
