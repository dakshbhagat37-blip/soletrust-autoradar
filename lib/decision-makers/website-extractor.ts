import * as cheerio from "cheerio";
import type { PersonCandidate } from "./types.ts";
import { matchRoleInText } from "./roles.ts";
import { parsePersonName } from "./name-parser.ts";

const PROFILE_CARD_SELECTORS = [
  ".doctor-card",
  ".doctor-profile",
  ".team-member",
  ".team-card",
  ".physician-card",
  ".specialist-card",
  ".leadership-card",
  ".member",
  ".doctor",
  ".profile",
  ".person",
  "article.team",
];

type CheerioSelection = ReturnType<ReturnType<typeof cheerio.load>>;

function extractCandidateFromCard(
  cardEl: CheerioSelection,
  pageUrl: string,
  sourceHost: string
): PersonCandidate | null {
  const cardText = cardEl.text().replace(/\s+/g, " ").trim();
  const roleMatch = matchRoleInText(cardText);
  if (!roleMatch) return null;

  // Find candidate name in headings or strong tags inside the card
  let rawName = "";
  cardEl.find("h2, h3, h4, h5, .name, .title, strong, b").each((_, el) => {
    if (rawName) return;
    const t = cardEl.find(el).text().replace(/\s+/g, " ").trim();
    const parsed = parsePersonName(t);
    if (parsed.isValid) {
      rawName = t;
    }
  });

  if (!rawName) return null;
  const parsed = parsePersonName(rawName);
  if (!parsed.isValid) return null;

  // Check for LinkedIn or professional profile link in this card
  let profileUrl: string | null = null;
  cardEl.find('a[href*="linkedin.com/in/"]').each((_, a) => {
    if (profileUrl) return;
    const href = cardEl.find(a).attr("href");
    if (href) profileUrl = href.trim();
  });

  return {
    fullName: parsed.fullName,
    role: roleMatch.role,
    roleLabel: roleMatch.label,
    sourceUrl: pageUrl,
    sourceHost,
    sourceType: pageUrl.toLowerCase().includes("team") || pageUrl.toLowerCase().includes("doctor")
      ? "official_team"
      : "official_about",
    evidenceText: cardText.slice(0, 300),
    profileUrl,
    credentials: parsed.credentials,
    confidenceScore: 85,
  };
}

/**
 * Extracts decision-maker candidates from page HTML (structured cards, headings, and text sentences).
 */
export function extractDecisionMakersFromHtml(
  html: string,
  pageUrl: string
): PersonCandidate[] {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe").remove();

  let sourceHost = "official_website";
  try {
    sourceHost = new URL(pageUrl).hostname;
  } catch {
    sourceHost = "official_website";
  }

  const candidates: PersonCandidate[] = [];
  const seenNames = new Set<string>();

  // 1. Check structured profile cards
  for (const selector of PROFILE_CARD_SELECTORS) {
    $(selector).each((_, el) => {
      const card = $(el);
      const cand = extractCandidateFromCard(card, pageUrl, sourceHost);
      if (cand && !seenNames.has(cand.fullName.toLowerCase())) {
        seenNames.add(cand.fullName.toLowerCase());
        candidates.push(cand);
      }
    });
  }

  // 2. Sentence & paragraph regex patterns
  // E.g. "Founded by Dr. Anita Patel in 2012"
  // E.g. "Dr. Chirag Desai, MD, is the Medical Director of..."
  // E.g. "Our Chief Dermatologist, Dr. Rajiv Shah..."
  const paragraphs = $("p, li, .about-content, .lead")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get();

  for (const p of paragraphs) {
    if (p.length < 15 || p.length > 500) continue;

    const roleMatch = matchRoleInText(p);
    if (!roleMatch) continue;

    // Pattern A: "Dr. [Name] ..., [Role]" or "[Role] ... Dr. [Name]"
    const doctorPattern = /\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\b/g;
    const matches = p.match(doctorPattern) || [];

    for (const match of matches) {
      const parsed = parsePersonName(match);
      if (parsed.isValid && !seenNames.has(parsed.fullName.toLowerCase())) {
        seenNames.add(parsed.fullName.toLowerCase());
        candidates.push({
          fullName: parsed.fullName,
          role: roleMatch.role,
          roleLabel: roleMatch.label,
          sourceUrl: pageUrl,
          sourceHost,
          sourceType: "official_about",
          evidenceText: p.slice(0, 300),
          credentials: parsed.credentials,
          confidenceScore: 80,
        });
      }
    }

    // Pattern B: "Founded by [Name]" or "Co-founded by [Name]"
    const foundedMatch = p.match(/\b(?:co[-\s]?founded|founded)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\b/i);
    if (foundedMatch && foundedMatch[1]) {
      const parsed = parsePersonName(foundedMatch[1]);
      if (parsed.isValid && !seenNames.has(parsed.fullName.toLowerCase())) {
        seenNames.add(parsed.fullName.toLowerCase());
        candidates.push({
          fullName: parsed.fullName,
          role: "founder",
          roleLabel: "Founder",
          sourceUrl: pageUrl,
          sourceHost,
          sourceType: "official_about",
          evidenceText: p.slice(0, 300),
          credentials: parsed.credentials,
          confidenceScore: 90,
        });
      }
    }
  }

  // 3. Headings with explicit role (e.g. "Dr. Rajiv Shah - Medical Director")
  $("h2, h3, h4").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length < 10 || text.length > 120) return;

    const roleMatch = matchRoleInText(text);
    if (!roleMatch) return;

    // Look for separator: "Dr. Name - Role" or "Role: Dr. Name"
    const parts = text.split(/[-–|:,]/).map((s) => s.trim());
    for (const part of parts) {
      const parsed = parsePersonName(part);
      if (parsed.isValid && !seenNames.has(parsed.fullName.toLowerCase())) {
        seenNames.add(parsed.fullName.toLowerCase());
        candidates.push({
          fullName: parsed.fullName,
          role: roleMatch.role,
          roleLabel: roleMatch.label,
          sourceUrl: pageUrl,
          sourceHost,
          sourceType: "official_website",
          evidenceText: text,
          credentials: parsed.credentials,
          confidenceScore: 75,
        });
      }
    }
  });

  return candidates;
}
