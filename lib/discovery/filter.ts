import type { CandidateRecord } from "../providers/types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";

export type FilterStatus = "accepted" | "review" | "rejected";

export type CandidateFilterResult = {
  status: FilterStatus;
  reasons: string[];
  isAggregator: boolean;
  hasLocationConflict: boolean;
  isArticleOrBlog: boolean;
};

const BLOCKED_DIRECTORY_DOMAINS = new Set([
  "justdial.com",
  "sulekha.com",
  "practo.com",
  "docindia.org",
  "spotmedics.com",
  "yelp.com",
  "tripadvisor.com",
  "foursquare.com",
  "yellowpages.com",
  "indiamart.com",
  "tradeindia.com",
  "magicpin.in",
  "zaubacorp.com",
  "webindia123.com",
  "dentee.com",
  "hexahealth.com",
  "rocketreach.co",
  "zoominfo.com",
  "apollo.io",
  "crunchbase.com",
  "eyehospitalnearme.in",
  "near-me.in",
  "findnearby.in",
  "threebestrated.in",
  "lybrate.com",
  "credihealth.com",
  "medindia.net",
  "eka.care",
  "apollo247.com",
  "365doctor.in",
  "helloindia.co",
  "promallu.com",
  "worldplaces.me",
  "kivihealth.com",
  "infobel.com",
  "asklaila.com",
  "urbanpro.com",
  "top-rated.online",
  "yappe.in",
  "findglocal.com",
  "companydetails.in",
]);

const BLOCKED_SOCIAL_DOMAINS = new Set([
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com",
]);

const BLOCKED_ARTICLE_DOMAINS = new Set([
  "wikipedia.org",
  "wikimedia.org",
  "webmd.com",
  "healthline.com",
  "mayoclinic.org",
  "clevelandclinic.org",
  "verywellhealth.com",
  "medicalnewstoday.com",
  "nhs.uk",
  "medium.com",
  "forbes.com",
  "businessinsider.com",
  "reddit.com",
  "quora.com",
  "support.microsoft.com",
  "wordpress.com",
  "blogspot.com",
]);

const ARTICLE_TITLE_PATTERNS = [
  /\bhow to\b/i,
  /\bwhat is\b/i,
  /\btop \d+\b/i,
  /\bbest \d+\b/i,
  /\blist of\b/i,
  /\bdirectory\b/i,
  /\bnear me\b/i,
  /\bfind a\b/i,
  /\bsymptoms of\b/i,
  /\btreatment guide\b/i,
  /\bwiki\b/i,
  /\bdefinition\b/i,
];

const MAJOR_INDIAN_CITIES = [
  "mumbai",
  "delhi",
  "bangalore",
  "bengaluru",
  "hyderabad",
  "chennai",
  "kolkata",
  "pune",
  "ahmedabad",
  "surat",
  "jaipur",
  "lucknow",
  "kanpur",
  "nagpur",
  "indore",
  "thane",
  "bhopal",
  "visakhapatnam",
  "patna",
  "chandigarh",
];

export function filterCandidate(
  candidate: CandidateRecord,
  query: SearchJobQuery,
): CandidateFilterResult {
  const reasons: string[] = [];
  const domain = candidate.domain?.toLowerCase().replace(/^www\./, "");
  const title = candidate.companyName.toLowerCase();
  const desc = (candidate.description || "").toLowerCase();
  const requestedCity = query.city.toLowerCase().trim();

  let isAggregator = false;
  let hasLocationConflict = false;
  let isArticleOrBlog = false;

  // 1. Directory / Aggregator Check
  if (domain) {
    if (BLOCKED_DIRECTORY_DOMAINS.has(domain) || Array.from(BLOCKED_DIRECTORY_DOMAINS).some((d) => domain.endsWith(`.${d}`))) {
      isAggregator = true;
      reasons.push(`Domain [${domain}] is a known directory or lead aggregator`);
    } else if (BLOCKED_SOCIAL_DOMAINS.has(domain) || Array.from(BLOCKED_SOCIAL_DOMAINS).some((d) => domain.endsWith(`.${d}`))) {
      isAggregator = true;
      reasons.push(`Domain [${domain}] is a social media profile, not an official company website`);
    } else if (BLOCKED_ARTICLE_DOMAINS.has(domain) || Array.from(BLOCKED_ARTICLE_DOMAINS).some((d) => domain.endsWith(`.${d}`))) {
      isArticleOrBlog = true;
      reasons.push(`Domain [${domain}] is an informational/encyclopedic source`);
    }
  }

  // 2. Article / Blog Title Check
  for (const pattern of ARTICLE_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      isArticleOrBlog = true;
      reasons.push(`Title matches generic informational article pattern: "${candidate.companyName}"`);
      break;
    }
  }

  // 3. Location Conflict Check
  // If the candidate explicitly mentions a different major city and does NOT mention the requested city
  if (!title.includes(requestedCity) && !desc.includes(requestedCity)) {
    const conflictingCity = MAJOR_INDIAN_CITIES.find(
      (c) => c !== requestedCity && (title.includes(` in ${c}`) || title.includes(` | ${c}`) || desc.includes(`located in ${c}`)),
    );
    if (conflictingCity) {
      hasLocationConflict = true;
      reasons.push(`Candidate explicitly references conflicting location [${conflictingCity}] instead of [${requestedCity}]`);
    }
  }

  // 4. Determine status
  if (isAggregator || isArticleOrBlog || hasLocationConflict) {
    return {
      status: "rejected",
      reasons,
      isAggregator,
      hasLocationConflict,
      isArticleOrBlog,
    };
  }

  // If candidate has an identifiable official website or ground-truth OSM record
  if (candidate.website && candidate.domain) {
    return {
      status: "accepted",
      reasons: ["Valid business website domain candidate"],
      isAggregator: false,
      hasLocationConflict: false,
      isArticleOrBlog: false,
    };
  }

  // If no website but high-confidence geographic entity (e.g. Overpass or Nominatim node with phone/address)
  if ((candidate.source === "overpass" || candidate.source === "nominatim") && (candidate.phone || candidate.address || candidate.city)) {
    return {
      status: "accepted",
      reasons: ["Ground-truth geographic business record with verified local presence"],
      isAggregator: false,
      hasLocationConflict: false,
      isArticleOrBlog: false,
    };
  }

  return {
    status: "review",
    reasons: ["Candidate requires secondary identity verification"],
    isAggregator: false,
    hasLocationConflict: false,
    isArticleOrBlog: false,
  };
}

