import type { PersonCandidate } from "./types.ts";
import { parsePersonName } from "./name-parser.ts";
import { matchRoleInText } from "./roles.ts";

const BLOCKED_PUBLIC_HOSTS = new Set([
  "justdial.com",
  "sulekha.com",
  "indiamart.com",
  "tradeindia.com",
  "zaubacorp.com",
  "top-rated.online",
  "indiainfo.net",
  "bdir.in",
  "deldure.com",
  "yellowpages.com",
]);

export function isBlockedPublicHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    for (const blocked of BLOCKED_PUBLIC_HOSTS) {
      if (host === blocked || host.endsWith(`.${blocked}`)) {
        return true;
      }
    }
  } catch {
    return true;
  }
  return false;
}

export type SearchSnippet = {
  title: string;
  url: string;
  snippet: string;
};

/**
 * Generates targeted queries to discover owners, doctors, or founders of a business.
 */
export function generateDecisionMakerQueries(
  companyName: string,
  city?: string | null
): string[] {
  const cleanComp = companyName.replace(/[^\w\s]/g, " ").trim();
  const cityStr = city ? ` ${city}` : "";

  return [
    `"${cleanComp}"${cityStr} founder OR owner OR "medical director" OR "chief dermatologist"`,
    `"${cleanComp}"${cityStr} doctor OR "clinic director"`,
    `site:linkedin.com/in/ "${cleanComp}"`,
  ];
}

/**
 * Extracts decision-maker candidates from public search snippets.
 */
export function extractCandidatesFromSearchSnippets(
  snippets: SearchSnippet[],
  companyName: string
): PersonCandidate[] {
  const candidates: PersonCandidate[] = [];
  const compLower = companyName.toLowerCase();

  for (const s of snippets) {
    if (isBlockedPublicHost(s.url)) continue;

    const combinedText = `${s.title} - ${s.snippet}`;
    const lowerText = combinedText.toLowerCase();

    // Verify snippet mentions company name to avoid unrelated persons from broad searches
    if (!lowerText.includes(compLower)) {
      continue;
    }

    let sourceHost = "web";
    try {
      sourceHost = new URL(s.url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      sourceHost = "web";
    }

    const isLinkedIn = sourceHost.includes("linkedin.com");

    // Match role in snippet
    const roleMatch = matchRoleInText(combinedText);
    if (!roleMatch && !isLinkedIn) continue;

    // Doctor pattern: "Dr. [First] [Last]"
    const doctorPattern = /\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\b/g;
    const docMatches = combinedText.match(doctorPattern) || [];

    for (const match of docMatches) {
      const parsed = parsePersonName(match);
      if (parsed.isValid) {
        candidates.push({
          fullName: parsed.fullName,
          role: roleMatch ? roleMatch.role : "clinic_director",
          roleLabel: roleMatch ? roleMatch.label : "Doctor / Clinic Director",
          sourceUrl: s.url,
          sourceHost,
          sourceType: isLinkedIn ? "public_professional_profile" : "search_result",
          evidenceText: s.snippet || s.title,
          profileUrl: isLinkedIn ? s.url : null,
          credentials: parsed.credentials,
          confidenceScore: isLinkedIn ? 70 : 60,
        });
      }
    }

    // LinkedIn title pattern: "[Name] - [Role] - [Company]"
    if (isLinkedIn && s.title.includes(" - ")) {
      const parts = s.title.split(" - ").map((p) => p.trim());
      if (parts.length >= 2) {
        const parsed = parsePersonName(parts[0]);
        if (parsed.isValid) {
          const roleText = parts[1];
          const matchedRole = matchRoleInText(roleText);
          candidates.push({
            fullName: parsed.fullName,
            role: matchedRole ? matchedRole.role : "founder",
            roleLabel: matchedRole ? matchedRole.label : roleText,
            sourceUrl: s.url,
            sourceHost: "linkedin.com",
            sourceType: "public_professional_profile",
            evidenceText: combinedText.slice(0, 250),
            profileUrl: s.url,
            credentials: parsed.credentials,
            confidenceScore: 75,
          });
        }
      }
    }
  }

  return candidates;
}
