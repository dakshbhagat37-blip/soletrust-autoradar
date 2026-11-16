import * as cheerio from "cheerio";
import type { Contact, ContactOwnershipType } from "../types/contact.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import type {
  DiscoveredBusinessContacts,
  ExtractedEmail,
  ExtractedPhone,
  SocialProfileLink,
} from "./types.ts";

const ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".css",
  ".js",
  ".woff",
  ".woff2",
];

const DUMMY_DOMAINS = [
  "example.com",
  "domain.com",
  "test.com",
  "email.com",
  "mysite.com",
  "company.com",
  "yoursite.com",
  "sample.com",
  "wix.com",
  "sentry.io",
];

const RECEPTION_EMAIL_PREFIXES = [
  "reception",
  "frontdesk",
  "desk",
  "appointment",
  "appointments",
  "booking",
  "bookings",
  "clinic",
  "opd",
  "patientcare",
  "helpdesk",
];

const BUSINESS_MAIN_PREFIXES = [
  "info",
  "contact",
  "hello",
  "admin",
  "support",
  "enquiry",
  "enquiries",
  "inquiry",
  "office",
  "mail",
  "care",
  "general",
  "customercare",
];

function isAssetOrDummyEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();

  // Filter image/asset pseudo-emails like 'icon@2x.png'
  for (const ext of ASSET_EXTENSIONS) {
    if (lower.endsWith(ext) || lower.includes(`${ext}@`)) {
      return true;
    }
  }

  // Filter dummy/placeholder domains
  const domain = lower.split("@")[1];
  if (!domain || DUMMY_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return true;
  }

  // Filter common framework artifacts
  if (lower.includes("sentry") || lower.includes("webpack") || lower.includes("node_modules")) {
    return true;
  }

  return false;
}

function classifyEmailOwnership(email: string): ContactOwnershipType {
  const localPart = email.split("@")[0].toLowerCase();

  for (const prefix of RECEPTION_EMAIL_PREFIXES) {
    if (localPart === prefix || localPart.startsWith(prefix)) {
      return "reception";
    }
  }

  for (const prefix of BUSINESS_MAIN_PREFIXES) {
    if (localPart === prefix || localPart.startsWith(prefix)) {
      return "business_main";
    }
  }

  // UNKNOWN > WRONG: Never assume an unclassified website email belongs to a decision maker.
  // Default to business_main.
  return "business_main";
}

function classifyPhoneOwnership(contextSnippet: string = ""): ContactOwnershipType {
  const lower = contextSnippet.toLowerCase();
  if (
    lower.includes("reception") ||
    lower.includes("front desk") ||
    lower.includes("appointment") ||
    lower.includes("booking") ||
    lower.includes("help desk") ||
    lower.includes("opd") ||
    lower.includes("enquiry") ||
    lower.includes("inquiry") ||
    lower.includes("helpline")
  ) {
    return "reception";
  }
  if (
    lower.includes("doctor") ||
    lower.includes("consultant") ||
    lower.includes("dr.") ||
    lower.includes("direct line") ||
    lower.includes("personal")
  ) {
    return "professional_direct";
  }
  return "business_main";
}

function cleanPhoneNumber(raw: string): { cleaned: string; digits: string; countryCode: string | null } | null {
  const trimmed = raw.trim();

  // Remove common prefix labels like "Tel:", "Phone:", "Call:", "M:"
  const noLabel = trimmed.replace(/^(tel|phone|call|mobile|mob|m|ph|contact|reception|fax)\s*[:.-]\s*/i, "");

  // Extract digits and optional leading plus
  const hasPlus = noLabel.startsWith("+");
  const digits = noLabel.replace(/\D/g, "");

  // Filter out pincodes (e.g. 6-digit Indian PIN 390001) or dates (20240512)
  if (digits.length === 6 || digits.length < 8 || digits.length > 15) {
    return null;
  }

  // Filter repetitive sequence (e.g., 0000000000, 1111111111)
  if (/^(\d)\1+$/.test(digits)) {
    return null;
  }

  let countryCode: string | null = null;
  let normalized = noLabel;

  if (hasPlus) {
    if (digits.startsWith("91") && digits.length === 12) {
      countryCode = "+91";
      normalized = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    } else {
      normalized = `+${digits}`;
    }
  } else if (digits.length === 10) {
    // 10-digit Indian mobile or landline without STD 0
    if (/^[6-9]/.test(digits)) {
      countryCode = "+91";
      normalized = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else {
      normalized = digits;
    }
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // 11 digits starting with 0 (e.g., 02652345678 or 09825012345)
    countryCode = "+91";
    if (digits.startsWith("0265")) {
      // Vadodara STD
      normalized = `0265-${digits.slice(4)}`;
    } else {
      normalized = `0${digits.slice(1, 5)}-${digits.slice(5)}`;
    }
  }

  return {
    cleaned: normalized,
    digits,
    countryCode,
  };
}

/**
 * Extracts emails, phone numbers, and physical address indicators from HTML text and links.
 */
export function extractContactsFromHtml(
  html: string,
  sourceUrl: string
): DiscoveredBusinessContacts {
  const $ = cheerio.load(html);

  // Remove irrelevant DOM trees
  $("script, style, noscript, svg, iframe").remove();

  const sourceHost = (() => {
    try {
      return new URL(sourceUrl).hostname;
    } catch {
      return "website";
    }
  })();

  const emailsMap = new Map<string, ExtractedEmail>();
  const phonesMap = new Map<string, ExtractedPhone>();
  const socialProfiles: SocialProfileLink[] = [];

  // 1. Mailto links
  $('a[href^="mailto:"]').each((_, el) => {
    const rawHref = $(el).attr("href") || "";
    const mailto = rawHref.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
    if (mailto && !isAssetOrDummyEmail(mailto)) {
      const ownership = classifyEmailOwnership(mailto);
      emailsMap.set(mailto, {
        email: mailto,
        ownershipType: ownership,
        sourceUrl,
        contextSnippet: $(el).parent().text().replace(/\s+/g, " ").trim().slice(0, 150),
      });
    }
  });

  // 2. Tel links
  $('a[href^="tel:"]').each((_, el) => {
    const rawHref = $(el).attr("href") || "";
    const tel = rawHref.replace(/^tel:/i, "").trim();
    const phoneRes = cleanPhoneNumber(tel);
    if (phoneRes) {
      const contextSnippet = $(el).parent().text().replace(/\s+/g, " ").trim().slice(0, 150);
      phonesMap.set(phoneRes.digits, {
        phone: phoneRes.cleaned,
        rawPhone: tel,
        countryCode: phoneRes.countryCode,
        ownershipType: classifyPhoneOwnership(contextSnippet),
        sourceUrl,
        contextSnippet,
      });
    }
  });

  // 3. Text regex scanning
  const bodyText = $("body").text();

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matchedEmails = bodyText.match(emailRegex) || [];
  for (const match of matchedEmails) {
    const email = match.toLowerCase().trim();
    if (!emailsMap.has(email) && !isAssetOrDummyEmail(email)) {
      emailsMap.set(email, {
        email,
        ownershipType: classifyEmailOwnership(email),
        sourceUrl,
      });
    }
  }

  // Phone regex for Indian landlines and mobiles
  // Matches formats like: +91 265 2334455, 0265-2334455, +91-9825012345, 98250 12345, 09825012345
  const phoneRegex =
    /(?:\+91[\s.-]?)?(?:(?:\(?0\d{2,4}\)?[\s.-]?\d{6,8})|(?:[6-9]\d{4}[\s.-]?\d{5})|(?:\d{3,4}[\s.-]\d{6,8}))/g;

  const matchedPhones = bodyText.match(phoneRegex) || [];
  for (const match of matchedPhones) {
    const res = cleanPhoneNumber(match);
    if (res && !phonesMap.has(res.digits)) {
      phonesMap.set(res.digits, {
        phone: res.cleaned,
        rawPhone: match.trim(),
        countryCode: res.countryCode,
        ownershipType: "business_main",
        sourceUrl,
      });
    }
  }

  // 4. Address snippet search
  let addressSnippet: string | null = null;
  const addressKeywords = [
    "floor",
    "opp.",
    "opposite",
    "road",
    "rd",
    "b/h",
    "behind",
    "near",
    "circle",
    "complex",
    "plaza",
    "building",
    "tower",
    "center",
    "centre",
    "street",
    "lane",
    "avenue",
    "marg",
    "nagar",
    "block",
    "sector",
    "plot",
    "course",
    "pincode",
    "pin",
    "suite",
    "vadodara",
    "baroda",
    "gujarat",
    "ahmedabad",
    "surat",
    "jaipur",
    "jammu",
    "delhi",
    "mumbai",
  ];
  $("footer, .footer, #footer, .contact-info, .contact-details, .address, address").each((_, el) => {
    if (addressSnippet) return;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const lower = text.toLowerCase();
    const count = addressKeywords.filter((k) => lower.includes(k)).length;
    if (count >= 2 && text.length > 20 && text.length < 300) {
      addressSnippet = text;
    }
  });

  const emails = Array.from(emailsMap.values());
  const phones = Array.from(phonesMap.values());
  const now = new Date().toISOString();

  // 5. Construct standardized Contact records
  const contacts: Contact[] = [];
  const evidenceList: SourceEvidence[] = [];

  for (const item of emails) {
    const evidence: SourceEvidence = {
      sourceUrl,
      sourceHost,
      sourceType: "official_contact",
      sourceTitle: "Official Website Contact",
      evidenceText: item.contextSnippet
        ? `Email found on official website: ${item.email} (context: ${item.contextSnippet})`
        : `Email found on official website: ${item.email}`,
      confidence: "high",
      discoveredAt: now,
    };
    evidenceList.push(evidence);

    contacts.push({
      id: crypto.randomUUID(),
      decisionMakerId: null, // Strictly null: generic website contacts never assigned to decision-makers!
      contactType: "email",
      value: item.email,
      countryCode: null,
      ownershipType: item.ownershipType,
      verificationStatus: "extracted",
      sourceUrl,
      evidence: [evidence],
    });
  }

  for (const item of phones) {
    const evidence: SourceEvidence = {
      sourceUrl,
      sourceHost,
      sourceType: "official_contact",
      sourceTitle: "Official Website Phone",
      evidenceText: item.contextSnippet
        ? `Phone found on official website: ${item.phone} (context: ${item.contextSnippet})`
        : `Phone found on official website: ${item.phone}`,
      confidence: "high",
      discoveredAt: now,
    };
    evidenceList.push(evidence);

    contacts.push({
      id: crypto.randomUUID(),
      decisionMakerId: null, // Strictly null: business phone lines never assigned to individual decision-makers!
      contactType: "phone",
      value: item.phone,
      countryCode: item.countryCode,
      ownershipType: item.ownershipType,
      verificationStatus: "extracted",
      sourceUrl,
      evidence: [evidence],
    });
  }

  return {
    emails,
    phones,
    addressSnippet,
    socialProfiles,
    contacts,
    evidence: evidenceList,
  };
}
