export type DiscoveryQuery = {
  keyword: string;
  city: string;
  country: string;
  industry: string;
  serviceTrack: string;
  limit: number;
};

export type DiscoveredCompany = {
  companyName: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  employeeRange: string | null;
  source: string;
  sourceUrl: string | null;
};

export type DiscoveryResult = {
  companies: DiscoveredCompany[];
  provider: string;
  total: number;
};
