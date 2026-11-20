import * as cheerio from "cheerio";
import { isPrivateIp } from "../intelligence/crawler.ts";
import { logger } from "../logging/logger.ts";

export const GENERIC_EMAIL_PREFIXES = new Set([
  "info",
  "contact",
  "support",
  "sales",
  "admin",
  "office",
  "hello",
  "help",
  "enquiry",
  "enquiries",
  "billing",
  "team",
  "careers",
  "jobs",
  "general",
  "mail",
  "inbox",
  "customercare",
  "service",
  "reception",
  "frontdesk",
  "press",
  "media",
]);

export function isGenericEmail(email: string | null | undefined): boolean {
  if (!email || !email.includes("@")) return false;
  const localPart = email.split("@")[0].toLowerCase().trim();
  return GENERIC_EMAIL_PREFIXES.has(localPart);
}

export interface CrawledPageIntel {
  url: string;
  statusCode: number;
  executiveCandidates: Array<{
    name: string;
    role: string;
    context: string;
    confidence: number;
  }>;
  emailsFound: string[];
  fallbackCorporateEmails: string[];
  directPersonalEmails: string[];
  phonesFound: string[];
  whatsAppLinks: string[];
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    github?: string;
    youtube?: string;
  };
  auditSignals: {
    hasMetaPixel: boolean;
    hasGoogleTag: boolean;
    hasBookingEngine: boolean;
    copyrightYear: number | null;
    isMobileResponsive: boolean;
    hasSsl: boolean;
    serverTechnology?: string;
  };
}

const EXECUTIVE_TITLE_REGEX =
  /\b(?:founder|co-founder|chief executive officer|ceo|owner|co-owner|proprietor|managing partner|managing director|store director|purchasing manager|head of ecommerce|director of marketing|clinic director|lead dentist|practice head|principal|director|partner)\b/i;

const COMMON_PAGE_PATHS = [
  "",
  "/about",
  "/about-us",
  "/team",
  "/our-team",
  "/leadership",
  "/partners",
  "/founder",
  "/contact",
  "/contact-us",
  "/privacy-policy",
  "/terms",
  "/imprint",
];

const DISALLOWED_NAMES = new Set([
  "home", "about", "contact", "privacy", "policy", "terms", "service", "services",
  "menu", "products", "careers", "login", "register", "cart", "checkout", "blog",
  "team", "support", "help", "faq", "copyright", "all rights reserved",
]);

/**
 * Deep in-house domain & website crawler
 * Crawls core institutional pages, sitemaps, and extracts decision-makers, direct contacts,
 * WhatsApp links, and technical conversion signals without external lead brokers.
 */
export async function crawlDomainIntelligence(
  rawUrl: string,
  options: { timeoutMs?: number; maxPages?: number } = {}
): Promise<CrawledPageIntel> {
  const timeoutMs = options.timeoutMs || 8000;
  const maxPages = options.maxPages || 4;

  let targetBase = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetBase)) {
    targetBase = `https://${targetBase}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetBase);
  } catch {
    return createEmptyIntel(rawUrl);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (isPrivateIp(hostname) || hostname === "localhost") {
    logger.warn(`SSRF attempt blocked for host: ${hostname}`, { context: "DeepCrawler" });
    return createEmptyIntel(rawUrl);
  }

  const result: CrawledPageIntel = {
    url: targetBase,
    statusCode: 200,
    executiveCandidates: [],
    emailsFound: [],
    fallbackCorporateEmails: [],
    directPersonalEmails: [],
    phonesFound: [],
    whatsAppLinks: [],
    socialProfiles: {},
    auditSignals: {
      hasMetaPixel: false,
      hasGoogleTag: false,
      hasBookingEngine: false,
      copyrightYear: null,
      isMobileResponsive: false,
      hasSsl: parsedUrl.protocol === "https:",
    },
  };

  const pagesToCrawl = COMMON_PAGE_PATHS.slice(0, maxPages).map(
    (p) => `${parsedUrl.origin}${p}`
  );

  for (const pageUrl of pagesToCrawl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(pageUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (!resp.ok) continue;

      const html = await resp.text();
      const $ = cheerio.load(html);

      // 1. Audit Signals Detection (DOM tags, hydrated scripts, Next.js __NEXT_DATA__, and Shopify analytics)
      const htmlText = html.toLowerCase();
      
      const scriptContents: string[] = [];
      $("script").each((_, el) => {
        const text = $(el).html() || $(el).text() || "";
        if (text.length > 0) {
          scriptContents.push(text.toLowerCase());
        }
      });
      const combinedScripts = scriptContents.join("\n");
      const fullContext = `${htmlText}\n${combinedScripts}`;

      // Meta Pixel & CAPI Detection (DOM + hydrated JSON/Shopify/Next.js)
      if (
        fullContext.includes("fbq('init'") ||
        fullContext.includes("connect.facebook.net") ||
        fullContext.includes("fbevents.js") ||
        fullContext.includes("facebook-jssdk") ||
        fullContext.includes("meta-pixel") ||
        fullContext.includes("fb_pixel_id") ||
        fullContext.includes("window.fbq") ||
        fullContext.includes('"facebook"')
      ) {
        result.auditSignals.hasMetaPixel = true;
      }

      // Google Tag & Analytics Detection (gtag, GTM, Shopify trekkie, ga)
      if (
        fullContext.includes("googletagmanager.com") ||
        fullContext.includes("gtag('config'") ||
        fullContext.includes("google-analytics.com") ||
        fullContext.includes("analytics.js") ||
        fullContext.includes("gtm.js") ||
        fullContext.includes("window.datalayer") ||
        fullContext.includes("trekkie") ||
        fullContext.includes("shopifyanalytics")
      ) {
        result.auditSignals.hasGoogleTag = true;
      }

      // Modern Booking & Scheduling Engine Detection (Fresha, Calendly, Cal, Acuity, etc.)
      if (
        fullContext.includes("calendly.com") ||
        fullContext.includes("cal.com") ||
        fullContext.includes("acuityscheduling.com") ||
        fullContext.includes("fresha.com") ||
        fullContext.includes("mindbodyonline.com") ||
        fullContext.includes("vagaro.com") ||
        fullContext.includes("setmore.com") ||
        fullContext.includes("jane.app") ||
        fullContext.includes("hotdoc.com.au") ||
        fullContext.includes("healthengine.com.au") ||
        fullContext.includes("squareup.com/appointments") ||
        fullContext.includes("zocdoc.com") ||
        fullContext.includes("booker.com") ||
        fullContext.includes("tidycal.com") ||
        fullContext.includes("appointment") ||
        fullContext.includes("booking")
      ) {
        result.auditSignals.hasBookingEngine = true;
      }

      if ($('meta[name="viewport"]').length > 0) {
        result.auditSignals.isMobileResponsive = true;
      }

      const copyrightMatch = html.match(/(?:©|&copy;|copyright)\s*(?:20\d\d|19\d\d)/i);
      if (copyrightMatch) {
        const yearMatch = copyrightMatch[0].match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) {
          result.auditSignals.copyrightYear = parseInt(yearMatch[1], 10);
        }
      }

      // 2. WhatsApp & Phone Link Extraction
      $('a[href]').each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("tel:")) {
          const cleanPhone = href.replace("tel:", "").trim();
          if (cleanPhone && !result.phonesFound.includes(cleanPhone)) {
            result.phonesFound.push(cleanPhone);
          }
        } else if (href.includes("wa.me/") || href.includes("api.whatsapp.com/send")) {
          if (!result.whatsAppLinks.includes(href)) {
            result.whatsAppLinks.push(href);
            // Extract raw number if present
            const waMatch = href.match(/(?:wa\.me\/|phone=)(\+?\d{8,15})/);
            if (waMatch && !result.phonesFound.includes(waMatch[1])) {
              result.phonesFound.push(waMatch[1]);
            }
          }
        } else if (href.startsWith("mailto:")) {
          const cleanMail = href.replace("mailto:", "").split("?")[0].trim().toLowerCase();
          if (cleanMail.includes("@") && !result.emailsFound.includes(cleanMail)) {
            result.emailsFound.push(cleanMail);
            if (isGenericEmail(cleanMail)) {
              if (!result.fallbackCorporateEmails.includes(cleanMail)) {
                result.fallbackCorporateEmails.push(cleanMail);
              }
            } else {
              if (!result.directPersonalEmails.includes(cleanMail)) {
                result.directPersonalEmails.push(cleanMail);
              }
            }
          }
        } else if (href.includes("linkedin.com/in/") || href.includes("linkedin.com/company/")) {
          if (!result.socialProfiles.linkedin) result.socialProfiles.linkedin = href;
        } else if (href.includes("twitter.com/") || href.includes("x.com/")) {
          if (!result.socialProfiles.twitter) result.socialProfiles.twitter = href;
        } else if (href.includes("instagram.com/")) {
          if (!result.socialProfiles.instagram) result.socialProfiles.instagram = href;
        } else if (href.includes("github.com/")) {
          if (!result.socialProfiles.github) result.socialProfiles.github = href;
        }
      });

      // 3. Regex Body Phone & Email Scan
      const mailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      for (const m of mailMatches) {
        const lower = m.toLowerCase();
        if (
          !lower.endsWith(".png") &&
          !lower.endsWith(".jpg") &&
          !lower.endsWith(".jpeg") &&
          !lower.includes("sentry") &&
          !result.emailsFound.includes(lower)
        ) {
          result.emailsFound.push(lower);
          if (isGenericEmail(lower)) {
            if (!result.fallbackCorporateEmails.includes(lower)) {
              result.fallbackCorporateEmails.push(lower);
            }
          } else {
            if (!result.directPersonalEmails.includes(lower)) {
              result.directPersonalEmails.push(lower);
            }
          }
        }
      }

      // 4. Executive & Decision-Maker Pattern Mining
      // Check schema.org Person markup first
      $('script[type="application/ld+json"]').each((_, scriptEl) => {
        try {
          const jsonText = $(scriptEl).text();
          const parsed = JSON.parse(jsonText);
          const entities = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of entities) {
            if (item?.["@type"] === "Person" || item?.founder || item?.employee) {
              const person = item?.["@type"] === "Person" ? item : item.founder || item.employee;
              if (person?.name) {
                const nameStr = typeof person.name === "string" ? person.name : person.name?.name;
                const jobTitle = person?.jobTitle || "Executive / Founder";
                if (nameStr && nameStr.trim().split(" ").length >= 2) {
                  result.executiveCandidates.push({
                    name: nameStr.trim(),
                    role: jobTitle,
                    context: "Schema.org Person structured data",
                    confidence: 0.95,
                  });
                }
              }
            }
          }
        } catch {
          // Ignore invalid JSON-LD blocks
        }
      });

      // Scan headings and card blocks
      $("h1, h2, h3, h4, strong, .team-member, .member, .leadership").each((_, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 3 && text.length < 50) {
          const parentText = $(elem).parent().text().trim();
          if (EXECUTIVE_TITLE_REGEX.test(parentText)) {
            const roleMatch = parentText.match(EXECUTIVE_TITLE_REGEX);
            const role = roleMatch ? roleMatch[0] : "Executive";
            const words = text.split(/\s+/);
            if (words.length >= 2 && words.length <= 4) {
              const lowerName = text.toLowerCase();
              if (
                !DISALLOWED_NAMES.has(lowerName) &&
                !EXECUTIVE_TITLE_REGEX.test(text) &&
                !/^[0-9]/.test(text)
              ) {
                const alreadyAdded = result.executiveCandidates.some(
                  (c) => c.name.toLowerCase() === lowerName
                );
                if (!alreadyAdded) {
                  result.executiveCandidates.push({
                    name: text,
                    role: role.charAt(0).toUpperCase() + role.slice(1),
                    context: parentText.slice(0, 100),
                    confidence: 0.85,
                  });
                }
              }
            }
          }
        }
      });
    } catch {
      // Individual page timeouts/errors are handled silently; continue to next page
    }
  }

  return result;
}

function createEmptyIntel(rawUrl: string): CrawledPageIntel {
  return {
    url: rawUrl,
    statusCode: 0,
    executiveCandidates: [],
    emailsFound: [],
    fallbackCorporateEmails: [],
    directPersonalEmails: [],
    phonesFound: [],
    whatsAppLinks: [],
    socialProfiles: {},
    auditSignals: {
      hasMetaPixel: false,
      hasGoogleTag: false,
      hasBookingEngine: false,
      copyrightYear: null,
      isMobileResponsive: false,
      hasSsl: false,
    },
  };
}
