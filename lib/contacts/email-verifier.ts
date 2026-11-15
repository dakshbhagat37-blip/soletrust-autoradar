import * as dns from "node:dns";
import type { ContactOwnershipType, EmailVerificationResult } from "./types.ts";

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "aol.com",
  "gmx.com",
  "zoho.com",
]);

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "emailondeck.com",
  "dispostable.com",
]);

const RECEPTION_LOCAL_PARTS = [
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
];

const RFC5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type VerifyEmailOptions = {
  businessDomain?: string | null;
  checkMx?: boolean;
  ownershipHint?: ContactOwnershipType;
  customMxResolver?: (domain: string) => Promise<Array<{ exchange: string; priority: number }>>;
};

/**
 * Validates email syntax, detects free/disposable providers, checks domain alignment with business,
 * and performs safe MX lookups.
 */
export async function verifyEmail(
  rawEmail: string,
  options: VerifyEmailOptions = {}
): Promise<EmailVerificationResult> {
  const normalized = rawEmail.trim().toLowerCase();
  const reasons: string[] = [];

  const atIndex = normalized.lastIndexOf("@");
  if (atIndex === -1 || !RFC5322_EMAIL_REGEX.test(normalized)) {
    return {
      email: rawEmail,
      normalized,
      syntaxValid: false,
      domain: "",
      isFreeEmail: false,
      isDisposable: false,
      domainMatchesBusiness: false,
      mxValid: false,
      mxRecords: [],
      ownershipType: "unknown",
      verificationStatus: "invalid",
      score: 0,
      reasons: ["Email fails RFC 5322 syntax validation."],
    };
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  // Check disposable email services
  const isDisposable =
    DISPOSABLE_EMAIL_DOMAINS.has(domain) ||
    Array.from(DISPOSABLE_EMAIL_DOMAINS).some((d) => domain.endsWith(`.${d}`));

  if (isDisposable) {
    return {
      email: rawEmail,
      normalized,
      syntaxValid: true,
      domain,
      isFreeEmail: false,
      isDisposable: true,
      domainMatchesBusiness: false,
      mxValid: false,
      mxRecords: [],
      ownershipType: "unknown",
      verificationStatus: "invalid",
      score: 0,
      reasons: ["Email belongs to a known temporary/disposable domain."],
    };
  }

  // Check consumer/free email providers
  const isFreeEmail =
    FREE_EMAIL_DOMAINS.has(domain) ||
    Array.from(FREE_EMAIL_DOMAINS).some((d) => domain.endsWith(`.${d}`));

  // Check domain alignment with business
  const cleanBusinessDomain = (options.businessDomain || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();

  const domainMatchesBusiness =
    Boolean(cleanBusinessDomain) &&
    (domain === cleanBusinessDomain || domain.endsWith(`.${cleanBusinessDomain}`));

  // Determine ownership type
  let ownershipType: ContactOwnershipType = options.ownershipHint || "business_main";
  if (!options.ownershipHint) {
    if (RECEPTION_LOCAL_PARTS.some((p) => localPart === p || localPart.startsWith(p))) {
      ownershipType = "reception";
    } else {
      ownershipType = "business_main";
    }
  }

  // Calculate verification score
  let score = 50; // Base valid syntax
  reasons.push("Valid RFC 5322 syntax.");

  if (domainMatchesBusiness) {
    score += 35;
    reasons.push(`Domain matches official business domain (${domain}).`);
  } else if (isFreeEmail) {
    score += 10;
    reasons.push("Hosted on a public consumer email provider (e.g. Gmail).");
  } else {
    score += 20;
    reasons.push("Corporate custom domain.");
  }

  // Safe MX Record Resolution
  let mxValid: boolean | null = null;
  const mxRecords: string[] = [];

  if (options.checkMx) {
    try {
      let records: Array<{ exchange: string; priority: number }>;
      if (options.customMxResolver) {
        records = await options.customMxResolver(domain);
      } else {
        const mxPromise = dns.promises.resolveMx(domain);
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => reject(new Error("dns_timeout")), 1500);
          timer.unref();
        });
        records = await Promise.race([mxPromise, timeoutPromise]);
      }

      if (records && records.length > 0) {
        mxValid = true;
        mxRecords.push(...records.map((r) => r.exchange));
        score = Math.min(100, score + 15);
        reasons.push(`DNS MX records verified: ${mxRecords.slice(0, 2).join(", ")}.`);
      } else {
        mxValid = false;
        score = Math.max(0, score - 30);
        reasons.push("No MX records configured for domain.");
      }
    } catch {
      // Offline, sandboxed, timeout, or NXDOMAIN
      // UNKNOWN > WRONG: Do not fabricate mx_valid.
      mxValid = null;
      reasons.push("DNS MX lookup skipped or unresolved in offline sandbox.");
    }
  }

  // Verification status ledger
  let verificationStatus: EmailVerificationResult["verificationStatus"] = "syntax_valid";
  if (mxValid === true && domainMatchesBusiness) {
    verificationStatus = "mx_valid";
  } else if (mxValid === false) {
    verificationStatus = "invalid";
  } else {
    verificationStatus = "syntax_valid";
  }

  return {
    email: rawEmail,
    normalized,
    syntaxValid: true,
    domain,
    isFreeEmail,
    isDisposable: false,
    domainMatchesBusiness,
    mxValid,
    mxRecords,
    ownershipType,
    verificationStatus,
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}
