import type { SearchJobQuery } from "../types/search-job.ts";

export type DiscoveryQueryVariants = {
  primary: string;
  officialSite: string;
  entityType: string;
  serviceFocused?: string;
  keywordFocused?: string;
  allQueries: string[];
};

function cleanTerm(value: string | undefined | null): string {
  return (value ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}\s&+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateDiscoveryQueries(query: SearchJobQuery): DiscoveryQueryVariants {
  const industry = cleanTerm(query.industry);
  const city = cleanTerm(query.city);
  const country = cleanTerm(query.country);
  const serviceTrack = cleanTerm(query.serviceTrack);
  const keyword = cleanTerm(query.keyword);

  const primary = `${industry} in ${city}, ${country}`;
  const officialSite = `${industry} ${city} official website`;

  // Determine entity noun (e.g., clinic, hospital, studio, agency, company)
  let entityNoun = "business";
  const lowerInd = industry.toLowerCase();
  if (
    lowerInd.includes("dermatol") ||
    lowerInd.includes("skin") ||
    lowerInd.includes("dental") ||
    lowerInd.includes("clinic") ||
    lowerInd.includes("health") ||
    lowerInd.includes("medical")
  ) {
    entityNoun = "clinic";
  } else if (
    lowerInd.includes("creative") ||
    lowerInd.includes("design") ||
    lowerInd.includes("marketing") ||
    lowerInd.includes("media")
  ) {
    entityNoun = "studio agency";
  } else if (
    lowerInd.includes("tech") ||
    lowerInd.includes("software") ||
    lowerInd.includes("it")
  ) {
    entityNoun = "company";
  }

  const entityType = `${industry} ${entityNoun} ${city}`;

  const allQueries: string[] = [primary, officialSite, entityType];

  let serviceFocused: string | undefined;
  if (serviceTrack && serviceTrack !== "general") {
    serviceFocused = `${industry} ${serviceTrack} ${city}`;
    allQueries.push(serviceFocused);
  }

  let keywordFocused: string | undefined;
  if (keyword) {
    keywordFocused = `${keyword} ${industry} ${city}`;
    allQueries.push(keywordFocused);
  }

  return {
    primary,
    officialSite,
    entityType,
    serviceFocused,
    keywordFocused,
    allQueries: Array.from(new Set(allQueries)),
  };
}

