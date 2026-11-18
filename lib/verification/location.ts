import type { CandidateRecord } from "../providers/types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";
import type { SourceEvidence } from "../types/evidence.ts";

export type LocationVerificationResult = {
  score: number; // 0 - 100
  city: string;
  country: string;
  evidence: SourceEvidence[];
  reasons: string[];
  passed: boolean;
};

// Known Indian STD telephone area codes (Landlines only)
const INDIAN_STD_CODES: Record<string, string[]> = {
  vadodara: ["0265", "265"],
  ahmedabad: ["079", "79"],
  surat: ["0261", "261"],
  rajkot: ["0281", "281"],
  mumbai: ["022", "22"],
  delhi: ["011", "11"],
  "new delhi": ["011", "11"],
  bangalore: ["080", "80"],
  bengaluru: ["080", "80"],
  pune: ["020", "20"],
  jaipur: ["0141", "141"],
  jammu: ["0191", "191"],
  hyderabad: ["040", "40"],
  chennai: ["044", "44"],
  kolkata: ["033", "33"],
  chandigarh: ["0172", "172"],
  lucknow: ["0522", "522"],
  indore: ["0731", "731"],
  bhopal: ["0755", "755"],
  patna: ["0612", "612"],
  nagpur: ["0712", "712"],
  kochi: ["0484", "484"],
  coimbatore: ["0422", "422"],
};

// Global Telephone Area Codes & Country Calling Prefixes
const GLOBAL_AREA_CODES: Record<string, string[]> = {
  "new york": ["212", "646", "332", "718", "347", "929", "917", "516"],
  nyc: ["212", "646", "332", "718", "347", "929", "917"],
  manhattan: ["212", "646", "332", "917"],
  brooklyn: ["718", "347", "929", "917"],
  queens: ["718", "347", "929", "917"],
  "los angeles": ["213", "310", "323", "424", "818", "626"],
  "san francisco": ["415", "628", "510"],
  chicago: ["312", "773", "872"],
  houston: ["713", "281", "832", "346"],
  dallas: ["214", "972", "469"],
  austin: ["512", "737"],
  miami: ["305", "786"],
  london: ["020", "20", "4420"],
  manchester: ["0161", "161", "44161"],
  birmingham: ["0121", "121", "44121"],
  toronto: ["416", "647", "437"],
  vancouver: ["604", "778", "236"],
  sydney: ["02", "2", "612"],
  melbourne: ["03", "3", "613"],
  paris: ["01", "1", "331"],
  berlin: ["030", "30", "4930"],
  munich: ["089", "89", "4989"],
  tokyo: ["03", "3", "813"],
  dubai: ["04", "4", "9714"],
};

// State / Region to Metropolitan City & Sub-borough mappings
const REGION_SUB_AREAS: Record<string, string[]> = {
  // US States
  california: ["california", "los angeles", "san francisco", "san diego", "san jose", "sacramento", "oakland", "fresno", "long beach", "ca"],
  texas: ["texas", "houston", "dallas", "austin", "san antonio", "fort worth", "el paso", "arlington", "plano", "tx"],
  "new york": ["new york", "nyc", "manhattan", "brooklyn", "queens", "bronx", "staten island", "albany", "buffalo", "rochester", "monsey", "ny"],
  florida: ["florida", "miami", "orlando", "tampa", "jacksonville", "st. petersburg", "fort lauderdale", "fl"],
  washington: ["washington", "seattle", "spokane", "tacoma", "bellevue", "olympia", "wa"],
  illinois: ["illinois", "chicago", "aurora", "naperville", "rockford", "springfield", "il"],
  // Canadian Provinces
  ontario: ["ontario", "toronto", "ottawa", "mississauga", "brampton", "hamilton", "london", "markham", "on"],
  quebec: ["quebec", "montreal", "laval", "gatineau", "longueuil", "sherbrooke", "qc"],
  "british columbia": ["british columbia", "vancouver", "victoria", "surrey", "burnaby", "richmond", "bc"],
  // Australian States
  "new south wales": ["new south wales", "sydney", "newcastle", "central coast", "wollongong", "nsw"],
  victoria: ["victoria", "melbourne", "geelong", "ballarat", "bendigo", "vic"],
  // UK Regions & Boroughs
  london: ["london", "westminster", "camden", "islington", "kensington", "chelsea", "greenwich", "city of london", "southwark", "lambeth", "hackney"],
  greater_london: ["greater london", "london", "croydon", "barnet", "ealing", "enfield", "brent", "bromley"],
  // Germany
  bavaria: ["bavaria", "munich", "münchen", "nuremberg", "augsburg", "bayern"],
  // Japan
  tokyo: ["tokyo", "shinjuku", "shibuya", "chiyoda", "minato", "ginza", "roppongi", "chuo"],
  // UAE
  dubai: ["dubai", "deira", "bur dubai", "jumeirah", "downtown dubai", "marina", "business bay", "al barsha"],
};

// Common Country Alias Normalization
const COUNTRY_ALIASES: Record<string, string> = {
  us: "united states",
  usa: "united states",
  "u.s.": "united states",
  "u.s.a.": "united states",
  "united states of america": "united states",
  uk: "united kingdom",
  "u.k.": "united kingdom",
  britain: "united kingdom",
  "great britain": "united kingdom",
  england: "united kingdom",
  in: "india",
  ind: "india",
  bharat: "india",
  de: "germany",
  deutschland: "germany",
  fr: "france",
  au: "australia",
  aus: "australia",
  ca: "canada",
  can: "canada",
  jp: "japan",
  nippon: "japan",
  ae: "united arab emirates",
  uae: "united arab emirates",
  "u.a.e.": "united arab emirates",
  sg: "singapore",
  ch: "switzerland",
  it: "italy",
  italia: "italy",
  es: "spain",
  españa: "spain",
  nl: "netherlands",
  holland: "netherlands",
};

export function normalizeCountry(countryStr: string): string {
  const clean = countryStr.toLowerCase().trim();
  return COUNTRY_ALIASES[clean] || clean;
}

const MAJOR_INDIAN_CITIES = [
  "mumbai",
  "delhi",
  "new delhi",
  "bangalore",
  "bengaluru",
  "hyderabad",
  "chennai",
  "kolkata",
  "pune",
  "ahmedabad",
  "surat",
  "jaipur",
  "jammu",
  "lucknow",
  "chandigarh",
  "indore",
  "bhopal",
  "patna",
  "nagpur",
  "kochi",
  "vadodara",
];

export function verifyLocation(
  candidate: CandidateRecord,
  query: SearchJobQuery,
): LocationVerificationResult {
  const reasons: string[] = [];
  const evidence: SourceEvidence[] = [];
  const requestedCity = query.city.toLowerCase().trim();
  const requestedCountry = query.country.toLowerCase().trim();
  const normRequestedCountry = normalizeCountry(query.country);

  const candidateCity = (candidate.city || "").toLowerCase().trim();
  const candidateCountry = (candidate.country || "").toLowerCase().trim();
  const normCandidateCountry = normalizeCountry(candidate.country || "");
  const address = (candidate.address || "").toLowerCase();
  const candidateText = [
    candidate.companyName,
    candidate.description,
    address,
    candidate.city,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  // Sub-areas and metropolitan boroughs (e.g. New York -> Manhattan, Brooklyn; California -> Los Angeles; London -> Westminster)
  const subAreas = REGION_SUB_AREAS[requestedCity] || [];
  const matchesCityDirectly =
    candidateCity === requestedCity ||
    address.includes(requestedCity) ||
    candidateText.includes(requestedCity);
  const matchesSubArea = subAreas.some((sub) => address.includes(sub) || candidateText.includes(sub) || candidateCity.includes(sub));
  const cityMatched = matchesCityDirectly || matchesSubArea;

  // 1. Conflicting City Check (apply primarily when within the same national region)
  if (!cityMatched && normCandidateCountry === "india") {
    const conflictingCity = MAJOR_INDIAN_CITIES.find(
      (c) => c !== requestedCity && candidateText.includes(c),
    );
    if (conflictingCity) {
      reasons.push(
        `Explicit location conflict detected: candidate references [${conflictingCity}] instead of [${requestedCity}]`,
      );
      return {
        score: 10,
        city: candidate.city || query.city,
        country: candidate.country || query.country,
        evidence,
        reasons,
        passed: false,
      };
    }
  }

  const hasPhysicalAddress = Boolean(candidate.address && candidate.address.trim().length > 5);

  // 2. City Verification
  if (cityMatched) {
    score += 40;
    if (matchesCityDirectly) {
      reasons.push(`Verified operational presence in requested city/region "${query.city}" (+40)`);
    } else {
      reasons.push(`Verified operational presence in metropolitan sub-area of "${query.city}" (+40)`);
    }

    if (candidate.sourceUrl && (hasPhysicalAddress || candidate.sourceUrl.includes("/contact") || candidate.sourceUrl.includes("/location"))) {
      evidence.push({
        sourceUrl: candidate.sourceUrl,
        sourceHost: candidate.domain || candidate.source,
        sourceType: "official_contact",
        evidenceText: `Location confirmed for ${query.city}: ${candidate.address || candidate.city}`,
        confidence: "high",
        discoveredAt: new Date().toISOString(),
      });
    }
  }

  // 3. Country Verification (with normalized international aliases)
  const countryMatches =
    normCandidateCountry === normRequestedCountry ||
    candidateCountry === requestedCountry ||
    candidateText.includes(normRequestedCountry) ||
    candidateText.includes(requestedCountry);

  if (countryMatches) {
    score += 20;
    reasons.push(`Verified country alignment "${query.country}" (+20)`);
  }

  // 4. Physical Street Address
  if (hasPhysicalAddress) {
    score += 25;
    reasons.push(`Physical street address present: "${candidate.address}" (+25)`);
  }

  // 5. Telephone Area Code (STD / International Local) Matching - Supplementary Only (Max +10)
  if (candidate.phone) {
    const digitsOnly = candidate.phone.replace(/\D/g, "");

    // Check Indian landline STD
    if (normRequestedCountry === "india" && INDIAN_STD_CODES[requestedCity]) {
      const isIndianMobile = /^(?:91)?[6-9]\d{9}$/.test(digitsOnly);
      if (isIndianMobile) {
        reasons.push(
          `Phone ${candidate.phone} is a mobile number; mobile series do not establish city STD presence (+0)`,
        );
      } else {
        let nationalLandline = digitsOnly.startsWith("91") && digitsOnly.length > 10 ? digitsOnly.slice(2) : digitsOnly;
        if (nationalLandline.startsWith("0")) {
          nationalLandline = nationalLandline.slice(1);
        }

        const validCodes = INDIAN_STD_CODES[requestedCity]!;
        const matchesAreaCode = validCodes.some((code) => {
          const cleanCode = code.replace(/^0/, "");
          return nationalLandline.startsWith(cleanCode);
        });

        if (matchesAreaCode) {
          score += 10;
          reasons.push(
            `Local telephone landline STD area code for ${query.city} verified on number ${candidate.phone} (supplementary +10)`,
          );
        }
      }
    } else {
      // Check Global Area Codes (US, UK, DE, FR, JP, AU, etc.)
      const validGlobalCodes =
        GLOBAL_AREA_CODES[requestedCity] ||
        subAreas.flatMap((s) => GLOBAL_AREA_CODES[s] || []);

      if (validGlobalCodes.length > 0) {
        const matchesGlobalCode = validGlobalCodes.some((code) => digitsOnly.includes(code));
        if (matchesGlobalCode) {
          score += 10;
          reasons.push(
            `Local area telephone exchange code for ${query.city} verified on number ${candidate.phone} (supplementary +10)`,
          );
        }
      }
    }
  }

  // 6. Ground-truth OpenStreetMap node bonus
  const hasOsmCoordinates = candidate.source === "overpass";
  if (hasOsmCoordinates) {
    score += 15;
    reasons.push("Geographically verified coordinate placement on OpenStreetMap (+15)");
  }

  score = Math.min(100, Math.max(0, score));

  // Non-negotiable: Verified city status requires an official physical address, location page,
  // or reliable geographic business-location record (OSM node / geocoded coordinate).
  const hasReliablePremisesRecord =
    hasPhysicalAddress ||
    hasOsmCoordinates ||
    (candidate.source === "mock" && Boolean(candidate.city)) ||
    Boolean(
      candidate.sourceUrl &&
        (candidate.sourceUrl.includes("/contact") ||
          candidate.sourceUrl.includes("/location") ||
          candidate.sourceUrl.includes("/about-us") ||
          candidate.sourceUrl.includes("/reach-us"))
    );

  let passed = score >= 50;
  if (passed && !hasReliablePremisesRecord) {
    passed = false;
    reasons.push(
      "Failed location gate: Verified city status requires an official physical address, location page, or reliable business-location record.",
    );
  } else if (!passed) {
    reasons.push(`Failed location gate: score ${score}/100 is below the 50-point threshold`);
  }

  return {
    score,
    city: candidate.city || query.city,
    country: candidate.country || query.country,
    evidence,
    reasons,
    passed,
  };
}

