import * as cheerio from "cheerio";
import type { Business } from "../types/business.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import { politeFetch, type PoliteFetchOptions } from "./crawler.ts";

export const DIRECTORY_AND_AGGREGATOR_DOMAINS = new Set([
  "justdial.com",
  "www.justdial.com",
  "sulekha.com",
  "www.sulekha.com",
  "practo.com",
  "www.practo.com",
  "indiamart.com",
  "www.indiamart.com",
  "tradeindia.com",
  "www.tradeindia.com",
  "lybrate.com",
  "www.lybrate.com",
  "credihealth.com",
  "www.credihealth.com",
  "hexahealth.com",
  "www.hexahealth.com",
  "medindia.net",
  "www.medindia.net",
  "dentee.com",
  "www.dentee.com",
  "threebestrated.in",
  "www.threebestrated.in",
  "magicpin.in",
  "www.magicpin.in",
  "zaubacorp.com",
  "www.zaubacorp.com",
  "webindia123.com",
  "www.webindia123.com",
  "yellowpages.com",
  "www.yellowpages.com",
  "yelp.com",
  "www.yelp.com",
  "tripadvisor.com",
  "www.tripadvisor.com",
  "foursquare.com",
  "www.foursquare.com",
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "youtube.com",
  "www.youtube.com",
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "wikipedia.org",
  "www.wikipedia.org",
  "wikidata.org",
  "www.wikidata.org",
]);

const GENERIC_NAME_TOKENS = new Set([
  "clinic",
  "clinics",
  "hospital",
  "hospitals",
  "centre",
  "center",
  "care",
  "dr",
  "the",
  "and",
  "of",
  "in",
  "pvt",
  "ltd",
  "skin",
  "dental",
  "eye",
  "healthcare",
]);

export function isDirectoryOrThirdParty(urlOrDomain: string): boolean {
  try {
    let hostname = urlOrDomain.toLowerCase().trim();
    if (hostname.includes("/")) {
      const url = new URL(hostname.startsWith("http") ? hostname : `https://${hostname}`);
      hostname = url.hostname.toLowerCase();
    }
    const cleanHost = hostname.replace(/^www\./, "");
    return (
      DIRECTORY_AND_AGGREGATOR_DOMAINS.has(cleanHost) ||
      DIRECTORY_AND_AGGREGATOR_DOMAINS.has(`www.${cleanHost}`) ||
      cleanHost.endsWith(".gov.in") ||
      cleanHost.endsWith(".nic.in")
    );
  } catch {
    return false;
  }
}

export type WebsiteVerificationResult = {
  isVerified: boolean;
  officialWebsite: string | null;
  domain: string | null;
  confidence: "high" | "medium" | "low";
  evidence: SourceEvidence | null;
  reasons: string[];
  rejectionReason?: string;
  verifiedAt: string;
};

/**
 * Verifies that a candidate website is genuine, represents the official business entity,
 * and is not an aggregator, social platform, or unrelated generic domain (UNKNOWN > WRONG).
 */
export async function verifyOfficialWebsite(
  business: Business,
  candidateUrl?: string | null,
  options?: {
    htmlContent?: string;
    crawlOptions?: PoliteFetchOptions;
  }
): Promise<WebsiteVerificationResult> {
  const verifiedAt = new Date().toISOString();
  const reasons: string[] = [];

  if (!candidateUrl || candidateUrl.trim().length === 0) {
    return {
      isVerified: false,
      officialWebsite: null,
      domain: null,
      confidence: "low",
      evidence: null,
      reasons: ["No website URL provided."],
      rejectionReason: "No website URL provided (UNKNOWN > WRONG).",
      verifiedAt,
    };
  }

  const normalizedUrl = candidateUrl.trim().startsWith("http")
    ? candidateUrl.trim()
    : `https://${candidateUrl.trim()}`;

  let domain = "";
  try {
    domain = new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return {
      isVerified: false,
      officialWebsite: null,
      domain: null,
      confidence: "low",
      evidence: null,
      reasons: ["Malformed website URL."],
      rejectionReason: `Malformed website URL: ${candidateUrl}`,
      verifiedAt,
    };
  }

  // 1. Directory and Third-Party Listing Exclusion Gate
  if (isDirectoryOrThirdParty(domain)) {
    return {
      isVerified: false,
      officialWebsite: null,
      domain: null,
      confidence: "low",
      evidence: null,
      reasons: [`Domain [${domain}] is a third-party directory, aggregator, or social platform.`],
      rejectionReason: `Third-party directory or platform excluded: ${domain}`,
      verifiedAt,
    };
  }

  // 2. Brand-Domain Token Alignment
  const canonicalTokens = business.canonicalName
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME_TOKENS.has(t));

  const domainParts = domain.split(".")[0]?.replace(/[-_]/g, " ").split(/\s+/) || [];
  const domainText = domain.toLowerCase();

  const matchingTokens = canonicalTokens.filter(
    (token) => domainText.includes(token) || domainParts.includes(token)
  );

  let isVerified = false;
  let confidence: "high" | "medium" | "low" = "low";

  if (matchingTokens.length > 0) {
    isVerified = true;
    const allDistinctiveMatched = canonicalTokens.length > 0 && matchingTokens.length === canonicalTokens.length;
    confidence = (matchingTokens.length >= 2 || allDistinctiveMatched) ? "high" : "medium";
    reasons.push(
      `Domain [${domain}] matches distinctive business brand token(s): "${matchingTokens.join(", ")}".`
    );
  }

  // 3. Inspect HTML content if available or fetchable
  let html = options?.htmlContent;
  if (!html && options?.crawlOptions) {
    try {
      const res = await politeFetch(normalizedUrl, options.crawlOptions);
      if (res.reachable && res.body) {
        html = res.body;
      }
    } catch {
      // Offline fallback
    }
  }

  if (html) {
    const $ = cheerio.load(html);
    const title = $("title").text().trim();
    const h1 = $("h1").first().text().trim();
    const siteName = $('meta[property="og:site_name"]').attr("content")?.trim() || "";

    const combinedHeader = `${title} ${h1} ${siteName}`.toLowerCase();
    const bizLower = business.canonicalName.toLowerCase();

    if (combinedHeader.includes(bizLower) || canonicalTokens.some((t) => combinedHeader.includes(t))) {
      isVerified = true;
      confidence = "high";
      reasons.push(`Website title/header explicitly confirms entity: "${title || h1}".`);
    }

    if (business.city && combinedHeader.includes(business.city.toLowerCase())) {
      reasons.push(`Page confirms target location: ${business.city}.`);
    }
  }

  if (!isVerified) {
    return {
      isVerified: false,
      officialWebsite: null,
      domain: null,
      confidence: "low",
      evidence: null,
      reasons: [`Domain [${domain}] could not be verified as the official website for "${business.canonicalName}".`],
      rejectionReason: `Unverified domain alignment for ${domain} against trading name ${business.canonicalName}`,
      verifiedAt,
    };
  }

  const evidence: SourceEvidence = {
    sourceUrl: normalizedUrl,
    sourceHost: domain,
    sourceType: "official_website",
    sourceTitle: `${business.canonicalName} Official Website`,
    evidenceText: `Verified official website domain "${domain}". Reasons: ${reasons.join(" ")}`,
    confidence,
    discoveredAt: verifiedAt,
  };

  return {
    isVerified: true,
    officialWebsite: normalizedUrl,
    domain,
    confidence,
    evidence,
    reasons,
    verifiedAt,
  };
}
