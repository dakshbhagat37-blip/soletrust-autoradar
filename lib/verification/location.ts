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
  bangalore: ["080", "80"],
  pune: ["020", "20"],
};

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
];

export function verifyLocation(
  candidate: CandidateRecord,
  query: SearchJobQuery,
): LocationVerificationResult {
  const reasons: string[] = [];
  const evidence: SourceEvidence[] = [];
  const requestedCity = query.city.toLowerCase().trim();
  const requestedCountry = query.country.toLowerCase().trim();

  const candidateCity = (candidate.city || "").toLowerCase().trim();
  const candidateCountry = (candidate.country || "").toLowerCase().trim();
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

  // 1. Conflicting City Check
  if (!candidateText.includes(requestedCity)) {
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
  if (candidateCity === requestedCity || address.includes(requestedCity) || candidateText.includes(requestedCity)) {
    score += 40;
    reasons.push(`Verified operational presence in requested city "${query.city}" (+40)`);

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

  // 3. Country Verification
  if (candidateCountry === requestedCountry || candidateText.includes(requestedCountry)) {
    score += 20;
    reasons.push(`Verified country alignment "${query.country}" (+20)`);
  }

  // 4. Physical Street Address
  if (hasPhysicalAddress) {
    score += 25;
    reasons.push(`Physical street address present: "${candidate.address}" (+25)`);
  }

  // 5. Telephone Area Code (STD) Matching - Supplementary Only (Max +10)
  // Mobile numbers (6-9 prefix in India) do not carry city STD codes and are strictly excluded.
  if (candidate.phone && INDIAN_STD_CODES[requestedCity]) {
    const digitsOnly = candidate.phone.replace(/\D/g, "");
    // Check if this is an Indian mobile number (e.g. +91 98265..., 98265...)
    const isIndianMobile = /^(?:91)?[6-9]\d{9}$/.test(digitsOnly);

    if (isIndianMobile) {
      reasons.push(
        `Phone ${candidate.phone} is a mobile number; mobile series do not establish city STD presence (+0)`,
      );
    } else {
      // Landline check: strip country code 91 if present, then leading 0
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

