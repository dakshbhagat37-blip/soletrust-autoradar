import type { SearchFormData } from "../../components/SearchForm.tsx";

export type ParsedPromptResult = {
  data: SearchFormData;
  summary: string;
  detectedPersona?: string;
  confidence: "high" | "medium" | "low";
};

// Known global country monikers & default financial centers
const COUNTRY_MAP: { pattern: RegExp; country: string; defaultCity: string; tld: string; phonePrefix: string }[] = [
  { pattern: /\b(china|prc|mainland china|zhongguo)\b/i, country: "China", defaultCity: "Shanghai", tld: "cn", phonePrefix: "+86" },
  { pattern: /\b(australia|aus|aussie|down under)\b/i, country: "Australia", defaultCity: "Sydney", tld: "au", phonePrefix: "+61" },
  { pattern: /\b(united states|usa|us|u\.s\.|america)\b/i, country: "United States", defaultCity: "New York", tld: "com", phonePrefix: "+1" },
  { pattern: /\b(united kingdom|uk|u\.k\.|britain|england|scotland|wales)\b/i, country: "United Kingdom", defaultCity: "London", tld: "co.uk", phonePrefix: "+44" },
  { pattern: /\b(germany|deutschland)\b/i, country: "Germany", defaultCity: "Munich", tld: "de", phonePrefix: "+49" },
  { pattern: /\b(canada)\b/i, country: "Canada", defaultCity: "Toronto", tld: "ca", phonePrefix: "+1" },
  { pattern: /\b(japan|nippon)\b/i, country: "Japan", defaultCity: "Tokyo", tld: "jp", phonePrefix: "+81" },
  { pattern: /\b(united arab emirates|uae|u\.a\.e\.|emirates)\b/i, country: "United Arab Emirates", defaultCity: "Dubai", tld: "ae", phonePrefix: "+971" },
  { pattern: /\b(india|bharat)\b/i, country: "India", defaultCity: "Mumbai", tld: "in", phonePrefix: "+91" },
  { pattern: /\b(france)\b/i, country: "France", defaultCity: "Paris", tld: "fr", phonePrefix: "+33" },
  { pattern: /\b(singapore)\b/i, country: "Singapore", defaultCity: "Singapore", tld: "sg", phonePrefix: "+65" },
  { pattern: /\b(hong kong|hk)\b/i, country: "Hong Kong", defaultCity: "Hong Kong", tld: "hk", phonePrefix: "+852" },
  { pattern: /\b(taiwan|taipei)\b/i, country: "Taiwan", defaultCity: "Taipei", tld: "tw", phonePrefix: "+886" },
  { pattern: /\b(south korea|korea)\b/i, country: "South Korea", defaultCity: "Seoul", tld: "kr", phonePrefix: "+82" },
  { pattern: /\b(italy|italia)\b/i, country: "Italy", defaultCity: "Milan", tld: "it", phonePrefix: "+39" },
  { pattern: /\b(spain|españa)\b/i, country: "Spain", defaultCity: "Madrid", tld: "es", phonePrefix: "+34" },
  { pattern: /\b(netherlands|holland)\b/i, country: "Netherlands", defaultCity: "Amsterdam", tld: "nl", phonePrefix: "+31" },
  { pattern: /\b(switzerland|swiss)\b/i, country: "Switzerland", defaultCity: "Zurich", tld: "ch", phonePrefix: "+41" },
  { pattern: /\b(brazil|brasil)\b/i, country: "Brazil", defaultCity: "Sao Paulo", tld: "br", phonePrefix: "+55" },
  { pattern: /\b(mexico)\b/i, country: "Mexico", defaultCity: "Mexico City", tld: "mx", phonePrefix: "+52" },
  { pattern: /\b(south africa)\b/i, country: "South Africa", defaultCity: "Johannesburg", tld: "za", phonePrefix: "+27" },
  { pattern: /\b(new zealand|nz)\b/i, country: "New Zealand", defaultCity: "Auckland", tld: "nz", phonePrefix: "+64" },
  { pattern: /\b(saudi arabia|saudi|ksa)\b/i, country: "Saudi Arabia", defaultCity: "Riyadh", tld: "sa", phonePrefix: "+966" },
  { pattern: /\b(ireland)\b/i, country: "Ireland", defaultCity: "Dublin", tld: "ie", phonePrefix: "+353" },
  { pattern: /\b(sweden)\b/i, country: "Sweden", defaultCity: "Stockholm", tld: "se", phonePrefix: "+46" },
];

// Known cities and states with direct country linkage
const CITY_MAP: { pattern: RegExp; city: string; country: string }[] = [
  // India
  { pattern: /\b(mumbai|bombay)\b/i, city: "Mumbai", country: "India" },
  { pattern: /\b(delhi|new delhi)\b/i, city: "Delhi", country: "India" },
  { pattern: /\b(bangalore|bengaluru)\b/i, city: "Bangalore", country: "India" },
  { pattern: /\b(hyderabad)\b/i, city: "Hyderabad", country: "India" },
  { pattern: /\b(pune)\b/i, city: "Pune", country: "India" },
  { pattern: /\b(chennai|madras)\b/i, city: "Chennai", country: "India" },
  { pattern: /\b(kolkata|calcutta)\b/i, city: "Kolkata", country: "India" },
  { pattern: /\b(ahmedabad)\b/i, city: "Ahmedabad", country: "India" },
  { pattern: /\b(surat)\b/i, city: "Surat", country: "India" },
  { pattern: /\b(vadodara|baroda)\b/i, city: "Vadodara", country: "India" },
  { pattern: /\b(jaipur)\b/i, city: "Jaipur", country: "India" },
  { pattern: /\b(lucknow)\b/i, city: "Lucknow", country: "India" },
  { pattern: /\b(chandigarh)\b/i, city: "Chandigarh", country: "India" },
  { pattern: /\b(indore)\b/i, city: "Indore", country: "India" },
  { pattern: /\b(jammu)\b/i, city: "Jammu", country: "India" },

  // USA
  { pattern: /\b(new york|nyc|manhattan|brooklyn)\b/i, city: "New York", country: "United States" },
  { pattern: /\b(california|los angeles|san francisco|san diego|silicon valley|san jose)\b/i, city: "California", country: "United States" },
  { pattern: /\b(texas|houston|dallas|austin|fort worth)\b/i, city: "Texas", country: "United States" },
  { pattern: /\b(florida|miami|orlando|tampa)\b/i, city: "Florida", country: "United States" },
  { pattern: /\b(chicago|illinois)\b/i, city: "Chicago", country: "United States" },
  { pattern: /\b(seattle|washington state)\b/i, city: "Seattle", country: "United States" },
  { pattern: /\b(boston|massachusetts)\b/i, city: "Boston", country: "United States" },
  { pattern: /\b(atlanta|georgia)\b/i, city: "Atlanta", country: "United States" },
  { pattern: /\b(denver|colorado)\b/i, city: "Denver", country: "United States" },

  // UK & Europe
  { pattern: /\b(london|westminster|camden|the city)\b/i, city: "London", country: "United Kingdom" },
  { pattern: /\b(manchester)\b/i, city: "Manchester", country: "United Kingdom" },
  { pattern: /\b(birmingham)\b/i, city: "Birmingham", country: "United Kingdom" },
  { pattern: /\b(paris)\b/i, city: "Paris", country: "France" },
  { pattern: /\b(rotterdam|amsterdam|the hague)\b/i, city: "Rotterdam", country: "Netherlands" },
  { pattern: /\b(berlin)\b/i, city: "Berlin", country: "Germany" },
  { pattern: /\b(munich|münchen|bavaria)\b/i, city: "Munich", country: "Germany" },
  { pattern: /\b(frankfurt)\b/i, city: "Frankfurt", country: "Germany" },
  { pattern: /\b(milan)\b/i, city: "Milan", country: "Italy" },
  { pattern: /\b(madrid)\b/i, city: "Madrid", country: "Spain" },
  { pattern: /\b(zurich)\b/i, city: "Zurich", country: "Switzerland" },
  { pattern: /\b(dublin)\b/i, city: "Dublin", country: "Ireland" },

  // UAE & Middle East
  { pattern: /\b(dubai)\b/i, city: "Dubai", country: "United Arab Emirates" },
  { pattern: /\b(abu dhabi)\b/i, city: "Abu Dhabi", country: "United Arab Emirates" },
  { pattern: /\b(riyadh)\b/i, city: "Riyadh", country: "Saudi Arabia" },

  // Australia & New Zealand
  { pattern: /\b(sydney|new south wales)\b/i, city: "Sydney", country: "Australia" },
  { pattern: /\b(melbourne|victoria)\b/i, city: "Melbourne", country: "Australia" },
  { pattern: /\b(brisbane|queensland)\b/i, city: "Brisbane", country: "Australia" },
  { pattern: /\b(perth)\b/i, city: "Perth", country: "Australia" },
  { pattern: /\b(auckland)\b/i, city: "Auckland", country: "New Zealand" },

  // Canada
  { pattern: /\b(toronto|ontario)\b/i, city: "Toronto", country: "Canada" },
  { pattern: /\b(vancouver|british columbia)\b/i, city: "Vancouver", country: "Canada" },
  { pattern: /\b(montreal|quebec)\b/i, city: "Montreal", country: "Canada" },

  // Asia
  { pattern: /\b(singapore)\b/i, city: "Singapore", country: "Singapore" },
  { pattern: /\b(tokyo)\b/i, city: "Tokyo", country: "Japan" },
  { pattern: /\b(shanghai)\b/i, city: "Shanghai", country: "China" },
  { pattern: /\b(beijing)\b/i, city: "Beijing", country: "China" },
  { pattern: /\b(shenzhen)\b/i, city: "Shenzhen", country: "China" },
];

// Universal Semantic Industry Rules across Global Sectors
const INDUSTRY_RULES: { pattern: RegExp; industry: string; serviceTrack: string; persona: string }[] = [
  // 1. Taxation, Accounting & Chartered Accountants
  {
    pattern: /\b(tax|taxation|tax firm|tax firms|tax consultant|tax consultants|chartered accountant|chartered accountants|ca firm|ca firms|cpa|cpa firm|cpas|accounting firm|accounting firms|accountants|audit firm|auditors)\b/i,
    industry: "Taxation & Chartered Accountants",
    serviceTrack: "technical",
    persona: "Tax Advisory & Financial Compliance",
  },
  // 2. Solar & Renewable Energy EPC
  {
    pattern: /\b(solar|solar epc|solar installer|solar installers|photovoltaic|commercial solar|rooftop solar|renewable energy|clean energy|solar energy)\b/i,
    industry: "Commercial Solar & Renewable Energy EPC",
    serviceTrack: "technical",
    persona: "Clean Energy Infrastructure & Engineering",
  },
  // 3. Logistics, Freight & Supply Chain
  {
    pattern: /\b(logistics|freight|freight forwarder|freight forwarders|cargo|shipping company|shipping companies|warehousing|3pl|supply chain|transport company)\b/i,
    industry: "Logistics & Freight Services",
    serviceTrack: "technical",
    persona: "Supply Chain & Fleet Operations",
  },
  // 4. Manufacturing & Industrial
  {
    pattern: /\b(manufacturing|manufacturer|manufacturers|fabrication|machining|industrial equipment|assembly plant|factory|precision engineering|contract manufacturing)\b/i,
    industry: "Manufacturing & Industrial Engineering",
    serviceTrack: "technical",
    persona: "Industrial Manufacturing & Operations",
  },
  // 5. EdTech & Educational Services
  {
    pattern: /\b(edtech|education company|tutoring|academy|coaching institute|training institute|higher education|vocational)\b/i,
    industry: "EdTech & Educational Services",
    serviceTrack: "creative+technical",
    persona: "Education Technology & Learning Platforms",
  },
  // 6. Real Estate & Property Management
  {
    pattern: /\b(real estate|realty|realtors|property management|real estate agency|commercial real estate|proptech|property developer)\b/i,
    industry: "Real Estate & Property Management",
    serviceTrack: "creative",
    persona: "Real Estate Brokerage & Development",
  },
  // 7. Clinics & Healthcare
  {
    pattern: /\b(clinic|clinics|medical center|medical centre|health clinic|diagnostic center|pathology lab|healthcare clinic)\b/i,
    industry: "Healthcare & Medical Clinics",
    serviceTrack: "technical",
    persona: "Clinical Healthcare & Practice Management",
  },
  // 8. Dental Practices
  {
    pattern: /\b(dental|dentist|dentists|dental clinic|dental clinics|orthodontics|pediatric dental)\b/i,
    industry: "Dental Clinics & Orthodontics",
    serviceTrack: "technical",
    persona: "Dental Practice & Oral Care",
  },
  // 9. Dermatology & Aesthetics
  {
    pattern: /\b(dermatology|dermatologist|skin clinic|skin clinics|cosmetology|aesthetic clinic)\b/i,
    industry: "Dermatology & Skin Clinics",
    serviceTrack: "creative+technical",
    persona: "Dermatology & Aesthetic Medicine",
  },
  // 10. Hospitals & Multispecialty Centers
  {
    pattern: /\b(hospital|hospitals|multispecialty hospital|trauma center|healthcare facility)\b/i,
    industry: "Hospitals & Medical Centers",
    serviceTrack: "technical",
    persona: "Hospital Administration & Operations",
  },
  // 11. Law Firms & Legal
  {
    pattern: /\b(law firm|law firms|lawyer|lawyers|attorney|attorneys|legal practice|solicitors|advocates|barristers)\b/i,
    industry: "Law Firms & Legal Practices",
    serviceTrack: "technical",
    persona: "Legal Counsel & Corporate Law",
  },
  // 12. Software & SaaS
  {
    pattern: /\b(saas|software company|software companies|b2b tech|tech startups|it company|cloud software|developer tools)\b/i,
    industry: "Software SaaS & Cloud Companies",
    serviceTrack: "creative+technical",
    persona: "SaaS & High-Growth Technology",
  },
  // 13. D2C & Ecommerce Brands
  {
    pattern: /\b(d to c|d2c|dtc|direct to consumer|ecommerce|e-commerce|online brand|apparel brand|clothing brand|skincare brand|lifestyle brand)\b/i,
    industry: "D2C Direct-to-Consumer Brands",
    serviceTrack: "creative+technical",
    persona: "E-Commerce & Brand Studio",
  },
  // 14. Supermarkets & Grocery
  {
    pattern: /\b(supermarket|supermarkets|grocery store|grocery stores|groceries|hypermarket|food mart|organic market)\b/i,
    industry: "Supermarkets",
    serviceTrack: "technical",
    persona: "Food & Beverage Distribution & Wholesale Sales",
  },
  // 15. Automotive Dealerships
  {
    pattern: /\b(car dealer|car dealership|automotive dealership|dealerships|car showroom|automobile showroom)\b/i,
    industry: "Automotive Dealerships",
    serviceTrack: "creative+technical",
    persona: "Automotive Retail & Showrooms",
  },
  // 16. Restaurants & Hospitality
  {
    pattern: /\b(restaurant|restaurants|cafe|cafes|hospitality|bistro|dining|bakeries|food & beverage|f&b)\b/i,
    industry: "Restaurants & Hospitality",
    serviceTrack: "creative",
    persona: "Hospitality & Restaurant Group",
  },
  // 17. Gyms & Fitness
  {
    pattern: /\b(gym|gyms|fitness center|fitness centers|crossfit|yoga studio|pilates studio)\b/i,
    industry: "Gyms & Fitness Centers",
    serviceTrack: "creative",
    persona: "Fitness & Wellness Studio",
  },
  // 18. Export / Import & International Trade
  {
    pattern: /\b(export|import|exporters|importers|export-import|international trade|commodity trader|merchant exporter)\b/i,
    industry: "Export & Import Trading",
    serviceTrack: "technical",
    persona: "International Trade & Merchant Export",
  },
];

/**
 * Universal Natural Language Prompt Parser
 * Maps ANY global prompt into localized geographic boundaries, verified country codes,
 * and high-fidelity industry ontology—never restricting users to a fixed template set.
 */
export function parseNaturalLanguagePrompt(prompt: string): ParsedPromptResult {
  const p = prompt.trim();
  let country = "United States";
  let city = "New York";
  let industry = "";
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

  // 4. Detect Industry from Semantic Knowledge Map
  for (const item of INDUSTRY_RULES) {
    if (item.pattern.test(p)) {
      industry = item.industry;
      serviceTrack = item.serviceTrack;
      detectedPersona = item.persona;
      break;
    }
  }

  // 5. Dynamic Freeform Industry Extractor (captures ANY arbitrary industry when not in predefined map)
  if (!industry) {
    const findMatch = p.match(/(?:find|search|get|discover|source|locate|target)\s+(?:for\s+)?([a-zA-Z0-9\s&+-]+?)\s+(?:in|across|at|around|near)\b/i);
    if (findMatch && findMatch[1]) {
      const extracted = findMatch[1].trim();
      // Remove leading numbers or stop words
      industry = extracted.replace(/^(?:\d+|top|best|verified|commercial|local)\s+/i, "").trim();
      industry = industry.charAt(0).toUpperCase() + industry.slice(1);
    } else {
      // Check prefix before "in <City>"
      const prefixMatch = p.match(/^([a-zA-Z0-9\s&+-]+?)\s+(?:in|across|at|around|near)\b/i);
      if (prefixMatch && prefixMatch[1]) {
        industry = prefixMatch[1].trim().replace(/^(?:\d+|top|best|verified|find|search)\s+/i, "").trim();
        industry = industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    }

    if (!industry || industry.length < 2) {
      industry = "Commercial Businesses";
    }
    detectedPersona = `${industry} Executive Operations`;
  }

  // 6. Detect Limit (e.g. "5 leads", "15 taxation firms", "top 20", "30 prospects")
  const limitMatch = p.match(/\b([1-9]|[1-2][0-9]|30)\s*(?:leads|prospects|businesses|companies|results|firms|installers|agencies)?\b/i);
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
