import type { Business } from "../types/business.ts";
import type { Contact } from "../types/contact.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import { politeFetch, type PoliteFetchOptions } from "./crawler.ts";
import { analyzeWebsite, type AnalyzeWebsiteOptions } from "./website.ts";
import { extractContactsFromHtml } from "./contact-extractor.ts";
import type { WebsiteIntelligence } from "./types.ts";
import { logger } from "../logging/logger.ts";

export type EnrichBusinessOptions = {
  fetchSubpages?: boolean; // Default true
  maxSubpages?: number; // Default 2 (e.g. contact + team)
  crawlOptions?: PoliteFetchOptions;
  mockHtmlByUrl?: Record<string, string>; // For offline/unit testing
};

export type WebsiteEnrichmentResult = {
  business: Business;
  intelligence: WebsiteIntelligence;
  newContacts: Contact[];
  crawledHtml?: {
    homepageHtml?: string;
    subpagesHtml?: Record<string, string>;
  };
};

/**
 * Enriches a verified Business with intelligence and contact information extracted
 * from its official website and discovered subpages (Contact, About, Team).
 */
export async function enrichBusinessFromWebsite(
  business: Business,
  options: EnrichBusinessOptions = {}
): Promise<WebsiteEnrichmentResult> {
  const websiteUrl = business.website;

  if (!websiteUrl) {
    const dummyIntelligence: WebsiteIntelligence = {
      url: "",
      finalUrl: "",
      reachable: false,
      statusCode: null,
      title: null,
      description: null,
      headings: [],
      textSnippet: "",
      metaTags: {},
      links: [],
      socialLinks: [],
      discoveredPages: { contact: null, about: null, team: null, services: null },
      hasHttps: false,
      hasContactPage: false,
      hasTeamPage: false,
      hasCallToAction: false,
      signals: ["missing_website_url"],
      fetchedAt: new Date().toISOString(),
    };

    return {
      business,
      intelligence: dummyIntelligence,
      newContacts: [],
    };
  }

  const fetchSubpages = options.fetchSubpages ?? true;
  const mockHtml = options.mockHtmlByUrl?.[websiteUrl];

  // 1. Analyze homepage
  const analyzeOpts: AnalyzeWebsiteOptions = {
    htmlContent: mockHtml,
    crawlOptions: options.crawlOptions,
  };

  const intelligence = await analyzeWebsite(websiteUrl, analyzeOpts);

  const accumulatedContacts: Contact[] = [];
  const accumulatedEvidence: SourceEvidence[] = [];
  const subpagesHtmlMap: Record<string, string> = {};
  let crawledHomepageHtml = "";

  // Extract from homepage if reachable
  if (intelligence.reachable) {
    let homepageHtml = mockHtml;
    if (!homepageHtml) {
      // Re-use body from crawler or fetch if needed
      const res = await politeFetch(intelligence.finalUrl, options.crawlOptions);
      homepageHtml = res.body ?? "";
    }

    if (homepageHtml) {
      crawledHomepageHtml = homepageHtml;
      const homeExtracted = extractContactsFromHtml(
        homepageHtml,
        intelligence.finalUrl
      );
      accumulatedContacts.push(...homeExtracted.contacts);
      accumulatedEvidence.push(...homeExtracted.evidence);

      if (homeExtracted.addressSnippet && !business.address) {
        business.address = homeExtracted.addressSnippet;
      }
    }
  }

  // 2. Crawl Subpages if available and permitted
  if (fetchSubpages && intelligence.reachable) {
    const subpagesToFetch: string[] = [];
    if (intelligence.discoveredPages.team) {
      subpagesToFetch.push(intelligence.discoveredPages.team);
    }
    if (intelligence.discoveredPages.about && subpagesToFetch.length < 3) {
      subpagesToFetch.push(intelligence.discoveredPages.about);
    }
    if (intelligence.discoveredPages.contact && subpagesToFetch.length < 3) {
      subpagesToFetch.push(intelligence.discoveredPages.contact);
    }

    for (const subpageUrl of subpagesToFetch) {
      try {
        let subpageHtml = options.mockHtmlByUrl?.[subpageUrl];
        if (!subpageHtml) {
          const subRes = await politeFetch(subpageUrl, options.crawlOptions);
          if (subRes.reachable && subRes.body) {
            subpageHtml = subRes.body;
          }
        }

        if (subpageHtml) {
          subpagesHtmlMap[subpageUrl] = subpageHtml;
          const subExtracted = extractContactsFromHtml(subpageHtml, subpageUrl);
          accumulatedContacts.push(...subExtracted.contacts);
          accumulatedEvidence.push(...subExtracted.evidence);

          if (subExtracted.addressSnippet && !business.address) {
            business.address = subExtracted.addressSnippet;
          }
        }
      } catch (subErr) {
        logger.debug("Failed to crawl subpage", {
          data: {
            subpageUrl,
          },
          error: subErr instanceof Error ? subErr.message : String(subErr),
        });
      }
    }
  }

  // 3. Deduplicate contacts against existing contacts
  const existingValues = new Set(
    (business.contacts || []).map((c) => c.value.toLowerCase().trim())
  );
  const newContacts: Contact[] = [];

  for (const c of accumulatedContacts) {
    const normalized = c.value.toLowerCase().trim();
    if (!existingValues.has(normalized)) {
      existingValues.add(normalized);
      c.businessId = business.id;
      newContacts.push(c);
    }
  }

  // 4. Update Business Description / Services if missing
  if (!business.description && intelligence.description) {
    business.description = intelligence.description;
  }

  // Append new contacts and evidence
  const updatedContacts = [...(business.contacts || []), ...newContacts];
  const updatedSources = [...(business.sources || []), ...accumulatedEvidence];

  const updatedBusiness: Business = {
    ...business,
    description: business.description || intelligence.description || null,
    contacts: updatedContacts,
    sources: updatedSources,
    updatedAt: new Date().toISOString(),
  };

  return {
    business: updatedBusiness,
    intelligence,
    newContacts,
    crawledHtml: {
      homepageHtml: crawledHomepageHtml || undefined,
      subpagesHtml: Object.keys(subpagesHtmlMap).length > 0 ? subpagesHtmlMap : undefined,
    },
  };
}
