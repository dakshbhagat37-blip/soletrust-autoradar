import * as cheerio from "cheerio";
import { politeFetch, type PoliteFetchOptions } from "./crawler.ts";
import type {
  DiscoveredPages,
  SocialPlatform,
  SocialProfileLink,
  WebsiteIntelligence,
  WebsiteLink,
  WebsiteLinkCategory,
} from "./types.ts";

const SOCIAL_PATTERNS: Array<{ platform: SocialPlatform; domains: string[] }> = [
  { platform: "linkedin", domains: ["linkedin.com"] },
  { platform: "instagram", domains: ["instagram.com"] },
  { platform: "facebook", domains: ["facebook.com"] },
  { platform: "twitter", domains: ["twitter.com", "x.com"] },
  { platform: "youtube", domains: ["youtube.com", "youtu.be"] },
];

const CTA_KEYWORDS = [
  "book",
  "book appointment",
  "book now",
  "schedule",
  "schedule consultation",
  "contact us",
  "call now",
  "consult doctor",
  "enquire now",
  "inquire",
  "get in touch",
  "request appointment",
];

function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function detectSocialPlatform(url: string): SocialProfileLink | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const pattern of SOCIAL_PATTERNS) {
      if (pattern.domains.some((d) => host === d || host.endsWith(`.${d}`))) {
        return {
          platform: pattern.platform,
          url,
        };
      }
    }
  } catch {
    // Ignore invalid URLs
  }
  return null;
}

function categorizeLink(
  href: string,
  label: string,
  isInternal: boolean
): WebsiteLinkCategory {
  if (!isInternal) {
    if (detectSocialPlatform(href)) {
      return "social";
    }
    return "general";
  }

  const combined = `${href.toLowerCase()} ${label.toLowerCase()}`;

  if (
    combined.includes("contact") ||
    combined.includes("reach-us") ||
    combined.includes("get-in-touch") ||
    combined.includes("find-us")
  ) {
    return "contact";
  }

  if (
    combined.includes("doctor") ||
    combined.includes("team") ||
    combined.includes("leadership") ||
    combined.includes("specialist") ||
    combined.includes("staff") ||
    combined.includes("faculty") ||
    combined.includes("dermatologist")
  ) {
    return "team";
  }

  if (
    combined.includes("about") ||
    combined.includes("who-we-are") ||
    combined.includes("our-story") ||
    combined.includes("overview")
  ) {
    return "about";
  }

  if (
    combined.includes("service") ||
    combined.includes("treatment") ||
    combined.includes("specialt") ||
    combined.includes("procedure")
  ) {
    return "services";
  }

  return "general";
}

export type AnalyzeWebsiteOptions = {
  htmlContent?: string;
  crawlOptions?: PoliteFetchOptions;
  maxLinks?: number;
};

/**
 * Parses and extracts structured intelligence from an official business website.
 */
export async function analyzeWebsite(
  rawWebsiteUrl: string,
  options: AnalyzeWebsiteOptions = {}
): Promise<WebsiteIntelligence> {
  const normalizedUrl = normalizeWebsiteUrl(rawWebsiteUrl);
  let html = options.htmlContent ?? null;
  let finalUrl = normalizedUrl;
  let statusCode: number | null = 200;
  let reachable = true;
  const initialSignals: string[] = [];

  // Crawl if HTML content was not provided
  if (!html) {
    const crawlResult = await politeFetch(normalizedUrl, options.crawlOptions);
    reachable = crawlResult.reachable;
    statusCode = crawlResult.statusCode;
    finalUrl = crawlResult.finalUrl;
    html = crawlResult.body;

    if (!reachable || !html) {
      if (crawlResult.error?.startsWith("ssrf_blocked")) {
        initialSignals.push("ssrf_blocked");
      } else if (crawlResult.error === "timeout") {
        initialSignals.push("website_timeout");
      } else if (crawlResult.error?.startsWith("http_error")) {
        initialSignals.push("website_http_error");
      } else {
        initialSignals.push("website_unreachable");
      }

      return {
        url: normalizedUrl,
        finalUrl,
        reachable: false,
        statusCode,
        title: null,
        description: null,
        headings: [],
        textSnippet: "",
        metaTags: {},
        links: [],
        socialLinks: [],
        discoveredPages: {
          contact: null,
          about: null,
          team: null,
          services: null,
        },
        hasHttps: normalizedUrl.startsWith("https://"),
        hasContactPage: false,
        hasTeamPage: false,
        hasCallToAction: false,
        signals: initialSignals,
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  const $ = cheerio.load(html);

  // Remove noise elements (scripts, styles, noscript, svg, iframes)
  $("script, style, noscript, svg, iframe, link[rel='stylesheet']").remove();

  // 1. Page Title
  const title =
    $("title")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim() || null;

  // 2. Meta tags
  const metaTags: Record<string, string> = {};
  $('meta[name], meta[property]').each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property");
    const content = $(el).attr("content");
    if (name && content) {
      metaTags[name.toLowerCase()] = content.replace(/\s+/g, " ").trim();
    }
  });

  const description =
    metaTags["description"] ||
    metaTags["og:description"] ||
    metaTags["twitter:description"] ||
    null;

  // 3. Headings
  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((h) => h.length > 2 && h.length < 250)
    .slice(0, 40);

  // 4. Links and Subpages Discovery
  let baseHostname = "";
  try {
    baseHostname = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    baseHostname = "";
  }

  const rawLinks: WebsiteLink[] = [];
  const discoveredPages: DiscoveredPages = {
    contact: null,
    about: null,
    team: null,
    services: null,
  };

  const socialLinksMap = new Map<string, SocialProfileLink>();
  const seenHrefs = new Set<string>();

  $("a[href]").each((_, el) => {
    const rawHref = $(el).attr("href")?.trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
      return;
    }

    try {
      const resolved = new URL(rawHref, finalUrl);
      // Clean fragment
      resolved.hash = "";
      const cleanUrl = resolved.toString();

      if (seenHrefs.has(cleanUrl)) return;
      seenHrefs.add(cleanUrl);

      const isInternal =
        baseHostname.length > 0 &&
        (resolved.hostname.toLowerCase() === baseHostname ||
          resolved.hostname.toLowerCase().endsWith(`.${baseHostname}`));

      const label = $(el).text().replace(/\s+/g, " ").trim().slice(0, 100);
      const category = categorizeLink(resolved.pathname, label, isInternal);

      const linkObj: WebsiteLink = {
        label,
        url: cleanUrl,
        isInternal,
        category,
      };

      rawLinks.push(linkObj);

      // Map social links
      const social = detectSocialPlatform(cleanUrl);
      if (social && !socialLinksMap.has(social.url)) {
        socialLinksMap.set(social.url, social);
      }

      // Prioritize primary discovered pages
      if (isInternal) {
        if (category === "contact" && !discoveredPages.contact) {
          discoveredPages.contact = cleanUrl;
        } else if (category === "about" && !discoveredPages.about) {
          discoveredPages.about = cleanUrl;
        } else if (category === "team" && !discoveredPages.team) {
          discoveredPages.team = cleanUrl;
        } else if (category === "services" && !discoveredPages.services) {
          discoveredPages.services = cleanUrl;
        }
      }
    } catch {
      // Ignore unresolvable URLs
    }
  });

  const maxLinks = options.maxLinks ?? 100;
  const links = rawLinks.slice(0, maxLinks);
  const socialLinks = Array.from(socialLinksMap.values());

  // 5. Body Text Snippet
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
  const textSnippet = bodyText.slice(0, 1500);

  // 6. Call to Action Detection
  const lowerBody = bodyText.toLowerCase();
  const hasCallToAction =
    CTA_KEYWORDS.some((kw) => lowerBody.includes(kw)) ||
    links.some((l) =>
      CTA_KEYWORDS.some((kw) => l.label.toLowerCase().includes(kw))
    );

  // 7. Signals
  const signals: string[] = [...initialSignals];

  if (!normalizedUrl.startsWith("https://")) {
    signals.push("no_https");
  } else {
    signals.push("has_https");
  }

  if (!title) {
    signals.push("missing_title");
  }

  if (!description) {
    signals.push("missing_meta_description");
  }

  if (headings.length === 0) {
    signals.push("no_headings");
  }

  if (discoveredPages.contact) {
    signals.push("has_contact_page");
  } else {
    signals.push("no_obvious_contact_page");
  }

  if (discoveredPages.team) {
    signals.push("has_team_page");
  }

  if (discoveredPages.about) {
    signals.push("has_about_page");
  }

  if (hasCallToAction) {
    signals.push("has_call_to_action");
  }

  if (socialLinks.length > 0) {
    signals.push("social_profiles_detected");
  }

  // Detect CMS signals
  const generator = (metaTags["generator"] || "").toLowerCase();
  if (generator.includes("wordpress") || html.includes("wp-content")) {
    signals.push("cms_wordpress");
  } else if (generator.includes("shopify") || html.includes("cdn.shopify.com")) {
    signals.push("cms_shopify");
  } else if (generator.includes("wix")) {
    signals.push("cms_wix");
  } else if (generator.includes("squarespace")) {
    signals.push("cms_squarespace");
  }

  return {
    url: normalizedUrl,
    finalUrl,
    reachable: true,
    statusCode,
    title,
    description,
    headings,
    textSnippet,
    metaTags,
    links,
    socialLinks,
    discoveredPages,
    hasHttps: normalizedUrl.startsWith("https://"),
    hasContactPage: Boolean(discoveredPages.contact),
    hasTeamPage: Boolean(discoveredPages.team),
    hasCallToAction,
    signals,
    fetchedAt: new Date().toISOString(),
  };
}
