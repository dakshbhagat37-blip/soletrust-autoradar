import type { SearchFormData } from "../../components/SearchForm.tsx";

export type ParsedPromptResult = {
  data: SearchFormData;
  summary: string;
  detectedPersona?: string;
  confidence: "high" | "medium" | "low";
};

// Known global country monikers
const COUNTRY_MAP: { pattern: RegExp; country: string; defaultCity: string }[] = [
  { pattern: /\b(china|prc|mainland china|zhongguo)\b/i, country: "China", defaultCity: "Shanghai" },
  { pattern: /\b(australia|aus|aussie|down under)\b/i, country: "Australia", defaultCity: "Sydney" },
  { pattern: /\b(united states|usa|us|u\.s\.|america)\b/i, country: "United States", defaultCity: "New York" },
  { pattern: /\b(united kingdom|uk|u\.k\.|britain|england|scotland)\b/i, country: "United Kingdom", defaultCity: "London" },
  { pattern: /\b(germany|deutschland)\b/i, country: "Germany", defaultCity: "Munich" },
  { pattern: /\b(canada)\b/i, country: "Canada", defaultCity: "Toronto" },
  { pattern: /\b(japan|nippon)\b/i, country: "Japan", defaultCity: "Tokyo" },
  { pattern: /\b(united arab emirates|uae|u\.a\.e\.)\b/i, country: "United Arab Emirates", defaultCity: "Dubai" },
  { pattern: /\b(india|bharat)\b/i, country: "India", defaultCity: "Vadodara" },
  { pattern: /\b(france)\b/i, country: "France", defaultCity: "Paris" },
  { pattern: /\b(singapore)\b/i, country: "Singapore", defaultCity: "Singapore" },
  { pattern: /\b(hong kong|hk)\b/i, country: "Hong Kong", defaultCity: "Hong Kong" },
  { pattern: /\b(taiwan|taipei)\b/i, country: "Taiwan", defaultCity: "Taipei" },
  { pattern: /\b(south korea|korea)\b/i, country: "South Korea", defaultCity: "Seoul" },
  { pattern: /\b(italy|italia)\b/i, country: "Italy", defaultCity: "Milan" },
  { pattern: /\b(spain|españa)\b/i, country: "Spain", defaultCity: "Madrid" },
  { pattern: /\b(netherlands|holland)\b/i, country: "Netherlands", defaultCity: "Amsterdam" },
  { pattern: /\b(switzerland|swiss)\b/i, country: "Switzerland", defaultCity: "Zurich" },
  { pattern: /\b(brazil|brasil)\b/i, country: "Brazil", defaultCity: "Sao Paulo" },
  { pattern: /\b(mexico)\b/i, country: "Mexico", defaultCity: "Mexico City" },
  { pattern: /\b(south africa)\b/i, country: "South Africa", defaultCity: "Johannesburg" },
  { pattern: /\b(new zealand|nz)\b/i, country: "New Zealand", defaultCity: "Auckland" },
  { pattern: /\b(saudi arabia|saudi)\b/i, country: "Saudi Arabia", defaultCity: "Riyadh" },
  { pattern: /\b(ireland)\b/i, country: "Ireland", defaultCity: "Dublin" },
  { pattern: /\b(sweden)\b/i, country: "Sweden", defaultCity: "Stockholm" },
];

// Known cities and states
const CITY_MAP: { pattern: RegExp; city: string; country: string }[] = [
  // China
  { pattern: /\b(shanghai)\b/i, city: "Shanghai", country: "China" },
  { pattern: /\b(beijing|peking)\b/i, city: "Beijing", country: "China" },
  { pattern: /\b(shenzhen)\b/i, city: "Shenzhen", country: "China" },
  { pattern: /\b(guangzhou|canton)\b/i, city: "Guangzhou", country: "China" },
  { pattern: /\b(hangzhou)\b/i, city: "Hangzhou", country: "China" },
  { pattern: /\b(chengdu)\b/i, city: "Chengdu", country: "China" },
  { pattern: /\b(wuhan)\b/i, city: "Wuhan", country: "China" },
  { pattern: /\b(hong kong)\b/i, city: "Hong Kong", country: "Hong Kong" },
  { pattern: /\b(taipei)\b/i, city: "Taipei", country: "Taiwan" },
  { pattern: /\b(seoul)\b/i, city: "Seoul", country: "South Korea" },
  // Australia
  { pattern: /\b(sydney)\b/i, city: "Sydney", country: "Australia" },
  { pattern: /\b(melbourne)\b/i, city: "Melbourne", country: "Australia" },
  { pattern: /\b(brisbane)\b/i, city: "Brisbane", country: "Australia" },
  { pattern: /\b(gold coast)\b/i, city: "Gold Coast", country: "Australia" },
  { pattern: /\b(perth)\b/i, city: "Perth", country: "Australia" },
  { pattern: /\b(byron bay)\b/i, city: "Byron Bay", country: "Australia" },
  // USA
  { pattern: /\b(new york|nyc|manhattan|brooklyn)\b/i, city: "New York", country: "United States" },
  { pattern: /\b(california|los angeles|san francisco|san diego)\b/i, city: "California", country: "United States" },
  { pattern: /\b(texas|houston|dallas|austin)\b/i, city: "Texas", country: "United States" },
  { pattern: /\b(florida|miami|orlando)\b/i, city: "Florida", country: "United States" },
  { pattern: /\b(chicago|illinois)\b/i, city: "Chicago", country: "United States" },
  { pattern: /\b(seattle|washington)\b/i, city: "Seattle", country: "United States" },
  // UK
  { pattern: /\b(london|westminster|camden)\b/i, city: "London", country: "United Kingdom" },
  { pattern: /\b(manchester)\b/i, city: "Manchester", country: "United Kingdom" },
  { pattern: /\b(birmingham)\b/i, city: "Birmingham", country: "United Kingdom" },
  // Germany
  { pattern: /\b(munich|münchen|bavaria)\b/i, city: "Munich", country: "Germany" },
  { pattern: /\b(berlin)\b/i, city: "Berlin", country: "Germany" },
  { pattern: /\b(frankfurt)\b/i, city: "Frankfurt", country: "Germany" },
  // Canada
  { pattern: /\b(toronto|ontario)\b/i, city: "Toronto", country: "Canada" },
  { pattern: /\b(vancouver)\b/i, city: "Vancouver", country: "Canada" },
  { pattern: /\b(montreal|quebec)\b/i, city: "Montreal", country: "Canada" },
  // Japan
  { pattern: /\b(tokyo)\b/i, city: "Tokyo", country: "Japan" },
  { pattern: /\b(osaka)\b/i, city: "Osaka", country: "Japan" },
  // UAE
  { pattern: /\b(dubai)\b/i, city: "Dubai", country: "United Arab Emirates" },
  { pattern: /\b(abu dhabi)\b/i, city: "Abu Dhabi", country: "United Arab Emirates" },
  // India
  { pattern: /\b(vadodara|baroda)\b/i, city: "Vadodara", country: "India" },
  { pattern: /\b(ahmedabad)\b/i, city: "Ahmedabad", country: "India" },
  { pattern: /\b(surat)\b/i, city: "Surat", country: "India" },
  { pattern: /\b(jaipur)\b/i, city: "Jaipur", country: "India" },
  { pattern: /\b(jammu)\b/i, city: "Jammu", country: "India" },
  { pattern: /\b(delhi|new delhi)\b/i, city: "Delhi", country: "India" },
  { pattern: /\b(mumbai|bombay)\b/i, city: "Mumbai", country: "India" },
  { pattern: /\b(bangalore|bengaluru)\b/i, city: "Bangalore", country: "India" },
  // Europe
  { pattern: /\b(paris)\b/i, city: "Paris", country: "France" },
  { pattern: /\b(milan)\b/i, city: "Milan", country: "Italy" },
  { pattern: /\b(rome)\b/i, city: "Rome", country: "Italy" },
  { pattern: /\b(madrid)\b/i, city: "Madrid", country: "Spain" },
  { pattern: /\b(barcelona)\b/i, city: "Barcelona", country: "Spain" },
  { pattern: /\b(amsterdam)\b/i, city: "Amsterdam", country: "Netherlands" },
  { pattern: /\b(zurich)\b/i, city: "Zurich", country: "Switzerland" },
  { pattern: /\b(dublin)\b/i, city: "Dublin", country: "Ireland" },
];

// Industry patterns
const INDUSTRY_RULES: { pattern: RegExp; industry: string }[] = [
  { pattern: /\b(d to c|d2c|dtc|direct to consumer|ecommerce|e-commerce|online brand|apparel brand|clothing brand|skincare brand|lifestyle brand)\b/i, industry: "D2C Direct-to-Consumer brands" },
  { pattern: /\b(supermarket|supermarkets|grocery store|grocery stores|groceries|hypermarket|food mart)\b/i, industry: "Supermarkets" },
  { pattern: /\b(car dealer|car dealership|automotive dealership|dealerships|car showroom|automobile)\b/i, industry: "Automotive dealerships" },
  { pattern: /\b(saas|software company|software companies|b2b tech|tech startups|it company)\b/i, industry: "Software SaaS companies" },
  { pattern: /\b(law firm|law firms|lawyer|lawyers|attorney|attorneys|legal practice|solicitors)\b/i, industry: "Law firms" },
  { pattern: /\b(restaurant|restaurants|cafe|cafes|hospitality|bistro|dining|bakeries)\b/i, industry: "Restaurants" },
  { pattern: /\b(gym|gyms|fitness center|fitness centers|crossfit|yoga studio)\b/i, industry: "Gyms" },
  { pattern: /\b(real estate|realty|realtors|property management|real estate agency)\b/i, industry: "Real estate agencies" },
  { pattern: /\b(accountant|accountants|accounting firm|cpa|tax firm|auditing)\b/i, industry: "Accounting firms" },
  { pattern: /\b(dental|dentist|dentists|dental clinic|dental clinics|orthodontics)\b/i, industry: "Dental clinics" },
  { pattern: /\b(dermatology|dermatologist|skin clinic|skin clinics|cosmetology)\b/i, industry: "Dermatology clinics" },
  { pattern: /\b(hospital|hospitals|healthcare center|medical center)\b/i, industry: "Hospitals" },
];

export function parseNaturalLanguagePrompt(prompt: string): ParsedPromptResult {
  const p = prompt.trim();
  let country = "United States";
  let city = "New York";
  let industry = "D2C Direct-to-Consumer brands";
  let serviceTrack = "creative+technical";
  let limit = 10;
  let detectedPersona: string | undefined;

  // 1. Detect City / State first (higher precision)
  let foundCity = false;
  for (const item of CITY_MAP) {
    if (item.pattern.test(p)) {
      city = item.city;
      country = item.country;
      foundCity = true;
      break;
    }
  }

  // 2. If no explicit city, check Country Map
  if (!foundCity) {
    for (const item of COUNTRY_MAP) {
      if (item.pattern.test(p)) {
        country = item.country;
        city = item.defaultCity;
        foundCity = true;
        break;
      }
    }
  }

  // 3. Dynamic Freeform Location Extractor (captures ANY city/country across the globe from "in <Location>")
  if (!foundCity) {
    const locMatch = p.match(/\b(?:in|across|at|around|near)\s+([a-zA-Z\s,]+?)(?:\s+(?:for|with|who|to|from|having|seeking)\b|$)/i);
    if (locMatch && locMatch[1]) {
      const rawLoc = locMatch[1].trim();
      if (rawLoc.includes(",")) {
        const parts = rawLoc.split(",").map((s) => s.trim());
        city = parts[0] || "Metropolitan Area";
        country = parts[1] || parts[0];
      } else {
        const words = rawLoc.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
          city = words.slice(0, -1).join(" ");
          country = words[words.length - 1]!;
        } else {
          city = rawLoc;
          country = rawLoc;
        }
      }
      foundCity = true;
    }
  }

  // 4. Detect Industry
  for (const item of INDUSTRY_RULES) {
    if (item.pattern.test(p)) {
      industry = item.industry;
      break;
    }
  }

  // 5. Detect User Persona & Service Track
  if (/f&b|food|beverage|grocery|supermarket|distribution|wholesale|shelf|retail food/i.test(p)) {
    serviceTrack = "technical"; // maps to high-converting commercial/retail track
    detectedPersona = "Food & Beverage Distribution & Wholesale Sales";
  } else if (/creative\s*(and|&|\+)\s*technical/i.test(p) || /design\s*(and|&|\+)\s*(development|dev|code)/i.test(p)) {
    serviceTrack = "creative+technical";
    detectedPersona = "Creative + Technical Studio Owner";
  } else if (/creative|branding|graphic design|marketing agency/i.test(p)) {
    serviceTrack = "creative";
    detectedPersona = "Creative Agency / Brand Studio";
  } else if (/technical|software engineer|developer|performance|automation/i.test(p)) {
    serviceTrack = "technical";
    detectedPersona = "Technical Specialist / Performance Studio";
  }

  // 5. Detect Limit (e.g. "5 leads", "top 10", "20 prospects")
  const limitMatch = p.match(/\b([1-9]|[1-2][0-9]|30)\s*(leads|prospects|businesses|companies|results)?\b/i);
  if (limitMatch && limitMatch[1]) {
    const parsedNum = parseInt(limitMatch[1], 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 30) {
      limit = parsedNum;
    }
  }

  const summary = `Target: ${industry} in ${city}, ${country} (${limit} leads, track: ${serviceTrack})`;

  return {
    data: {
      industry,
      city,
      country,
      limit,
      serviceTrack,
      provider: "waterfall",
    },
    summary,
    detectedPersona,
    confidence: "high",
  };
}
