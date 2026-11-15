const MEDICAL_DEGREES = [
  "MBBS",
  "M.B.B.S.",
  "MD",
  "M.D.",
  "DVD",
  "D.V.D.",
  "DDVL",
  "D.D.V.L.",
  "DNB",
  "D.N.B.",
  "FCPS",
  "FAM",
  "FAAD",
  "FACS",
  "MCh",
  "M.Ch.",
  "MRCP",
  "FRCP",
  "MS",
  "M.S.",
  "PHD",
  "Ph.D.",
];

const HONORIFICS = [
  "dr.",
  "dr",
  "doctor",
  "prof.",
  "prof",
  "professor",
  "mr.",
  "mr",
  "ms.",
  "ms",
  "mrs.",
  "mrs",
  "shri",
  "smt",
];

const BLOCKED_NAME_WORDS = new Set([
  "clinic",
  "clinics",
  "hospital",
  "hospitals",
  "center",
  "centre",
  "studio",
  "agency",
  "company",
  "service",
  "services",
  "care",
  "skin",
  "hair",
  "laser",
  "derma",
  "dermatology",
  "dermatologist",
  "cosmetic",
  "cosmetology",
  "aesthetic",
  "aesthetics",
  "contact",
  "about",
  "home",
  "team",
  "appointment",
  "appointments",
  "book",
  "booking",
  "review",
  "reviews",
  "rating",
  "ratings",
  "vadodara",
  "baroda",
  "gujarat",
  "india",
  "map",
  "maps",
  "directions",
  "street",
  "view",
  "road",
  "nagar",
  "complex",
  "plaza",
  "privacy",
  "policy",
  "terms",
  "condition",
  "conditions",
  "read",
  "more",
  "call",
  "now",
  "phone",
  "email",
  "gallery",
  "faqs",
  "faq",
  "treatment",
  "treatments",
  "patient",
  "patients",
  "feedback",
]);

export type ParsedPersonName = {
  isValid: boolean;
  fullName: string;
  honorific?: string | null;
  credentials: string[];
  cleanName: string;
};

/**
 * Cleans and standardizes potential person names.
 * Removes degrees, trailing commas, and filters non-person noise.
 */
export function parsePersonName(raw: string): ParsedPersonName {
  const invalidResult: ParsedPersonName = {
    isValid: false,
    fullName: "",
    honorific: null,
    credentials: [],
    cleanName: "",
  };

  if (!raw || typeof raw !== "string") {
    return invalidResult;
  }

  // Pre-clean whitespace and punctuation
  let text = raw.replace(/\s+/g, " ").trim();

  // Remove common prefix text like "Meet", "About", "Dr."
  text = text.replace(/^(?:meet|about|profile of|consult)\s+/i, "");

  // Strip parenthetical notes like (Dermatology) or (Skin Specialist)
  text = text.replace(/\([^)]*\)/g, " ").trim();

  // Extract medical credentials (e.g. MBBS, MD, DVD)
  const credentials: string[] = [];
  for (const deg of MEDICAL_DEGREES) {
    const escaped = deg.replace(/\./g, "\\.");
    const regex = new RegExp(`[,\\s(/-]+${escaped}[)\\s,.-]*`, "gi");
    if (regex.test(text)) {
      credentials.push(deg.toUpperCase().replace(/\./g, ""));
      text = text.replace(regex, " ").trim();
    }
  }

  // Clean trailing punctuation & brackets
  text = text.replace(/^[-,:()\s]+|[-,:()\s]+$/g, "").trim();

  // Extract honorific
  let honorific: string | null = null;

  for (const h of HONORIFICS) {
    const pattern = new RegExp(`^${h.replace(".", "\\.")}\\s+`, "i");
    if (pattern.test(text)) {
      honorific = text.match(pattern)?.[0]?.trim() || null;
      text = text.replace(pattern, "").trim();
      break;
    }
  }

  // Also support "Dr. (Mrs.) First Last"
  if (/^\((?:mrs|ms|mr)\)\s+/i.test(text)) {
    text = text.replace(/^\((?:mrs|ms|mr)\)\s+/i, "").trim();
  }

  // Filter digits, URLs, symbols
  if (/\d/.test(text) || /[@/\\~_+=#%*<>]/.test(text)) {
    return invalidResult;
  }

  const words = text.split(/\s+/).filter(Boolean);

  // A valid person name typically has 2 to 4 words (e.g., "Anita Patel", "Chirag K. Desai")
  if (words.length < 2 || words.length > 5) {
    return invalidResult;
  }

  // Check if any word is a blocked organizational or UI word
  for (const word of words) {
    const wLower = word.toLowerCase().replace(/[^a-z]/g, "");
    if (BLOCKED_NAME_WORDS.has(wLower)) {
      return invalidResult;
    }
    // Each word must start with an uppercase letter or capital initial (e.g. "K.")
    if (!/^[A-Z]/.test(word)) {
      return invalidResult;
    }
  }

  const cleanName = words.join(" ");
  const fullName = honorific ? `${honorific} ${cleanName}` : cleanName;

  return {
    isValid: true,
    fullName,
    honorific,
    credentials,
    cleanName,
  };
}
