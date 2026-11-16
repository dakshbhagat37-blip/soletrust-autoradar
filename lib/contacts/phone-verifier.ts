import type { ContactOwnershipType, PhoneVerificationResult } from "./types.ts";

const INDIAN_STD_CODES: Record<string, string> = {
  "011": "Delhi",
  "022": "Mumbai",
  "033": "Kolkata",
  "044": "Chennai",
  "040": "Hyderabad",
  "080": "Bangalore",
  "020": "Pune",
  "0141": "Jaipur",
  "0191": "Jammu",
  "0194": "Srinagar",
  "0172": "Chandigarh",
  "0522": "Lucknow",
  "0512": "Kanpur",
  "0731": "Indore",
  "0755": "Bhopal",
  "0612": "Patna",
  "0712": "Nagpur",
  "0265": "Vadodara",
  "079": "Ahmedabad",
  "0261": "Surat",
  "0281": "Rajkot",
  "0278": "Bhavnagar",
  "0288": "Jamnagar",
  "0260": "Vapi",
  "02642": "Bharuch",
  "02692": "Anand",
  "02762": "Mehsana",
  "0484": "Kochi",
  "0471": "Trivandrum",
  "0422": "Coimbatore",
  "0891": "Visakhapatnam",
};

export type VerifyPhoneOptions = {
  country?: string | null;
  targetCity?: string | null;
  ownershipHint?: ContactOwnershipType;
};

function isNonPhoneString(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;

  // Dates: YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) return true;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(trimmed)) return true;

  // Year or single numbers
  if (/^\d{4}$/.test(trimmed)) return true;

  // Pincode (6 digits in India, e.g. 390001, 390007)
  const cleanDigits = trimmed.replace(/\D/g, "");
  if (cleanDigits.length === 6) return true;

  // URLs or emails
  if (trimmed.includes("@") || /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    return true;
  }

  // Length guards
  if (cleanDigits.length < 7 || cleanDigits.length > 15) return true;

  // Repetitive sequence (e.g. 0000000000, 1111111111)
  if (/^(\d)\1+$/.test(cleanDigits)) return true;

  return false;
}

/**
 * Validates, cleans, and classifies phone numbers with support for Indian mobiles,
 * Vadodara STD landlines, and international formats.
 */
export function verifyPhone(
  rawPhone: string,
  options: VerifyPhoneOptions = {}
): PhoneVerificationResult {
  const trimmed = rawPhone.trim();
  const reasons: string[] = [];

  if (isNonPhoneString(trimmed)) {
    return {
      rawPhone,
      normalized: null,
      display: null,
      digits: trimmed.replace(/\D/g, ""),
      countryCode: null,
      phoneType: "unknown",
      stdAreaCode: null,
      syntaxValid: false,
      ownershipType: "unknown",
      verificationStatus: "invalid",
      score: 0,
      reasons: ["Failed phone syntax validation (date, pincode, or invalid length)."],
    };
  }

  const digits = trimmed.replace(/\D/g, "");
  const hasPlus = trimmed.startsWith("+");

  let normalized: string | null = null;
  let display: string | null = null;
  let countryCode: string | null = null;
  let phoneType: PhoneVerificationResult["phoneType"] = "unknown";
  let stdAreaCode: string | null = null;
  let score = 50;

  // Case 1: Indian Toll Free (e.g. 1800-xxx-xxxx)
  if (digits.startsWith("1800") && (digits.length === 10 || digits.length === 11)) {
    phoneType = "toll_free";
    countryCode = "+91";
    normalized = `+91 ${digits}`;
    display = `1800 ${digits.slice(4, 7)} ${digits.slice(7)}`;
    score = 80;
    reasons.push("Indian toll-free number.");
  }
  // Case 2: Indian Mobile (+91 or without country code)
  else if (
    (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) ||
    (digits.length === 10 && /^[6-9]/.test(digits)) ||
    (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1)))
  ) {
    phoneType = "mobile";
    countryCode = "+91";
    const local10 = digits.length === 12 ? digits.slice(2) : digits.length === 11 ? digits.slice(1) : digits;
    normalized = `+91 ${local10.slice(0, 5)} ${local10.slice(5)}`;
    display = normalized;
    score = 85;
    reasons.push("Valid 10-digit Indian mobile number (+91).");
  }
  // Case 3: Indian Landline with STD Code (e.g. 0265 Vadodara or 079 Ahmedabad)
  else if (
    (digits.length === 11 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("910"))
  ) {
    const stdCandidate = digits.length === 12 ? digits.slice(2) : digits;

    // Check known Indian STD codes
    for (const [code, city] of Object.entries(INDIAN_STD_CODES)) {
      if (stdCandidate.startsWith(code)) {
        stdAreaCode = code;
        phoneType = "landline";
        countryCode = "+91";
        const localNum = stdCandidate.slice(code.length);
        normalized = `${code}-${localNum}`;
        display = `${code}-${localNum}`;
        score = 85;
        reasons.push(`Valid Indian landline with ${city} STD code (${code}).`);

        if (options.targetCity && city.toLowerCase() === options.targetCity.toLowerCase()) {
          score += 10;
          reasons.push(`STD code (${code}) directly corroborates target city (${city}).`);
        }
        break;
      }
    }

    if (!stdAreaCode) {
      phoneType = "landline";
      countryCode = "+91";
      normalized = stdCandidate;
      display = stdCandidate;
      score = 70;
      reasons.push("Indian landline with standard area code.");
    }
  }
  // Case 4: International E.164 (+<country><digits>)
  else if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    normalized = `+${digits}`;
    display = `+${digits}`;
    countryCode = `+${digits.slice(0, 3)}`;
    phoneType = "unknown";
    score = 70;
    reasons.push("Standard international E.164 phone number.");
  } else {
    // Unrecognized format
    return {
      rawPhone,
      normalized: null,
      display: null,
      digits,
      countryCode: null,
      phoneType: "unknown",
      stdAreaCode: null,
      syntaxValid: false,
      ownershipType: "unknown",
      verificationStatus: "invalid",
      score: 0,
      reasons: ["Phone digits do not conform to valid national or international formats."],
    };
  }

  // Determine ownership type
  let ownershipType: ContactOwnershipType = options.ownershipHint || "business_main";
  if (!options.ownershipHint) {
    if (phoneType === "toll_free") {
      ownershipType = "business_main";
    } else {
      ownershipType = "business_main";
    }
  }

  return {
    rawPhone,
    normalized,
    display,
    digits,
    countryCode,
    phoneType,
    stdAreaCode,
    syntaxValid: true,
    ownershipType,
    verificationStatus: "syntax_valid",
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}

