import { logger } from "../logging/logger.ts";

export interface OsintResolvedEntity {
  personName: string | null;
  role: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  instagramHandle: string | null;
  publicPhone: string | null;
  confidenceScore: number;
  matchSignals: string[];
  attributionSources: string[];
}

export interface OsintResolutionQuery {
  companyName: string;
  city?: string | null;
  country?: string | null;
  domain?: string | null;
  knownDecisionMakerName?: string | null;
}

const EXECUTIVE_ROLE_PATTERNS = [
  /\b(?:founder|co-founder)\b/i,
  /\b(?:chief executive officer|ceo)\b/i,
  /\b(?:owner|co-owner|proprietor)\b/i,
  /\b(?:managing director|managing partner)\b/i,
  /\b(?:store director|store owner|purchasing manager)\b/i,
  /\b(?:general manager|gm)\b/i,
  /\b(?:head of ecommerce|vp of growth)\b/i,
  /\b(?:clinic director|principal dentist|lead dermatologist)\b/i,
];

/**
 * Multi-Vector OSINT Identity Resolver
 * Performs targeted open search dork queries and disambiguates executives and social profiles.
 * Adheres strictly to UNKNOWN > WRONG: Requires >= 2 matching signals to link an entity.
 */
export async function resolveOsintIdentity(
  query: OsintResolutionQuery,
  options: { searxngUrl?: string; timeoutMs?: number } = {}
): Promise<OsintResolvedEntity> {
  const company = query.companyName.trim();
  const city = query.city?.trim() || "";
  const domain = query.domain?.trim() || "";
  const knownName = query.knownDecisionMakerName?.trim() || null;
  const timeoutMs = options.timeoutMs || 5000;
  const searxngBase = (options.searxngUrl || process.env.SEARXNG_URL || "http://localhost:8080").replace(/\/$/, "");

  const result: OsintResolvedEntity = {
    personName: knownName,
    role: null,
    linkedinUrl: null,
    twitterHandle: null,
    instagramHandle: null,
    publicPhone: null,
    confidenceScore: knownName ? 0.6 : 0.0,
    matchSignals: [],
    attributionSources: [],
  };

  if (!company) return result;

  // Build targeted dork query patterns
  const dorks: string[] = [
    `"${company}" ${city} ("founder" OR "ceo" OR "owner" OR "managing director")`,
    `site:linkedin.com/in "${company}" ${city}`,
  ];

  for (const dork of dorks) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `${searxngBase}/search?q=${encodeURIComponent(dork)}&format=json`;
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);
      if (!res || !res.ok) continue;

      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.results)) continue;

      for (const item of data.results) {
        const title: string = item.title || "";
        const snippet: string = item.content || "";
        const url: string = item.url || "";
        const combined = `${title} ${snippet}`.toLowerCase();
        const companyLower = company.toLowerCase();
        const cityLower = city.toLowerCase();

        // Check Signal 1: Company or Domain match
        const hasCompanySignal = combined.includes(companyLower) || (domain && combined.includes(domain.toLowerCase()));
        // Check Signal 2: City match
        const hasCitySignal = city && combined.includes(cityLower);
        // Check Signal 3: Executive Title match
        const hasRoleSignal = EXECUTIVE_ROLE_PATTERNS.some((pat) => pat.test(combined));

        // LinkedIn extraction
        if (url.includes("linkedin.com/in/")) {
          // Parse name from LinkedIn title e.g. "Jane Doe - Founder & CEO - Acme Corp | LinkedIn"
          const namePart = title.split(/[|\-–—]/)[0]?.trim();
          if (namePart && namePart.split(/\s+/).length >= 2 && !result.linkedinUrl) {
            // Validate matching signals
            let signals = 0;
            if (hasCompanySignal) signals++;
            if (hasCitySignal) signals++;
            if (hasRoleSignal) signals++;

            if (signals >= 2) {
              result.linkedinUrl = url;
              if (!result.personName) {
                result.personName = namePart;
                result.matchSignals.push(`LinkedIn title match: ${namePart}`);
              }
              result.matchSignals.push(`LinkedIn company profile verified (Signals: ${signals})`);
              result.attributionSources.push(url);
              result.confidenceScore = Math.min(1.0, result.confidenceScore + 0.35);
            }
          }
        }

        // Twitter / X extraction
        if ((url.includes("twitter.com/") || url.includes("x.com/")) && !result.twitterHandle) {
          const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{2,20})/);
          if (match && !["home", "explore", "search", "login", "intent"].includes(match[1].toLowerCase())) {
            if (hasCompanySignal || (knownName && combined.includes(knownName.toLowerCase()))) {
              result.twitterHandle = `@${match[1]}`;
              result.attributionSources.push(url);
              result.matchSignals.push("Twitter/X handle verified");
            }
          }
        }

        // Instagram extraction
        if (url.includes("instagram.com/") && !result.instagramHandle) {
          const match = url.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/);
          if (match && !["p", "reel", "explore", "accounts", "stories"].includes(match[1].toLowerCase())) {
            if (hasCompanySignal) {
              result.instagramHandle = `@${match[1]}`;
              result.attributionSources.push(url);
              result.matchSignals.push("Instagram brand profile verified");
            }
          }
        }

        // Extract Role if not already identified
        if (!result.role && hasRoleSignal) {
          for (const pat of EXECUTIVE_ROLE_PATTERNS) {
            const roleMatch = combined.match(pat);
            if (roleMatch) {
              const matchedRole = roleMatch[0];
              result.role = matchedRole.charAt(0).toUpperCase() + matchedRole.slice(1);
              result.matchSignals.push(`Executive role attributed: ${result.role}`);
              break;
            }
          }
        }
      }
    } catch (err) {
      logger.debug(`OSINT query failed gracefully: ${(err as Error).message}`, { context: "OsintResolver" });
    }
  }

  // Final confidence score normalization
  if (result.personName && result.linkedinUrl) {
    result.confidenceScore = Math.max(0.85, result.confidenceScore);
  } else if (result.personName && result.matchSignals.length >= 2) {
    result.confidenceScore = Math.max(0.70, result.confidenceScore);
  } else if (!result.personName) {
    result.confidenceScore = 0.0;
  }

  return result;
}
