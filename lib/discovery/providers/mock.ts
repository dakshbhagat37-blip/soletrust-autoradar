import type { DiscoveredCompany, DiscoveryQuery, DiscoveryResult } from "../types";

export const MOCK_PROVIDER_ID = "mock";

type MockFixture = {
  name: string;
  slug: string;
  employeeRange: string;
  websiteHost?: string;
};

const FIXTURES: MockFixture[] = [
  { name: "Northpeak Creative Studio", slug: "northpeak-creative", employeeRange: "11-50" },
  { name: "Harborline Growth Lab", slug: "harborline-growth", employeeRange: "1-10" },
  { name: "Cedar & Volt Media", slug: "cedar-volt-media", employeeRange: "11-50" },
  { name: "Lumenstack Campaigns", slug: "lumenstack", employeeRange: "51-200" },
  { name: "Brightwharf Digital", slug: "brightwharf", employeeRange: "11-50" },
  { name: "Marlinhouse Strategy", slug: "marlinhouse", employeeRange: "1-10" },
  { name: "Oakline Performance", slug: "oakline-performance", employeeRange: "51-200" },
  { name: "Quaypoint Content Co", slug: "quaypoint-content", employeeRange: "11-50" },
  { name: "Redcanoe Brands", slug: "redcanoe-brands", employeeRange: "201-500" },
  { name: "Silvercurrent Labs", slug: "silvercurrent", employeeRange: "11-50" },
  { name: "Tideframe Interactive", slug: "tideframe", employeeRange: "1-10" },
  { name: "Willowbank Studios", slug: "willowbank-studios", employeeRange: "11-50" },
];

function fixtureToCompany(
  fixture: MockFixture,
  query: DiscoveryQuery,
  options?: { website?: string | null; city?: string; sourceUrlSuffix?: string },
): DiscoveredCompany {
  const host = fixture.websiteHost ?? `${fixture.slug}.example`;
  const website = options?.website === undefined ? `https://www.${host}` : options.website;

  return {
    companyName: ` ${fixture.name} `,
    website,
    industry: query.industry,
    country: query.country,
    city: options?.city ?? query.city,
    employeeRange: fixture.employeeRange,
    source: MOCK_PROVIDER_ID,
    sourceUrl: `https://mock.soletrust-autoradar.dev/companies/${fixture.slug}${options?.sourceUrlSuffix ?? ""}`,
  };
}

function buildMockCompanies(query: DiscoveryQuery): DiscoveredCompany[] {
  const needed = Math.max(query.limit, 1);
  const unique = FIXTURES.slice(0, Math.min(needed, FIXTURES.length)).map((fixture) =>
    fixtureToCompany(fixture, query),
  );

  // Intentional duplicates so normalize + dedupe can be exercised in development.
  const duplicates: DiscoveredCompany[] = [];
  const first = unique[0];
  const second = unique[1];

  if (first) {
    duplicates.push(
      fixtureToCompany(FIXTURES[0], query, {
        website: first.website?.replace("https://www.", "http://"),
        sourceUrlSuffix: "?dup=www",
      }),
    );
  }

  if (second) {
    duplicates.push(
      fixtureToCompany(FIXTURES[1], query, {
        website: null,
        sourceUrlSuffix: "?dup=name-city",
      }),
    );
  }

  return [...unique, ...duplicates];
}

export async function mockDiscover(query: DiscoveryQuery): Promise<DiscoveryResult> {
  const companies = buildMockCompanies(query);

  return {
    companies,
    provider: MOCK_PROVIDER_ID,
    total: companies.length,
  };
}
