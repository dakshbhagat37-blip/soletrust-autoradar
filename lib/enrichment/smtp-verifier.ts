import * as dns from "node:dns";
import * as net from "node:net";
import { logger } from "../logging/logger.ts";

export type EmailVerificationStatus =
  | "VERIFIED_SMTP"
  | "PUBLIC_EXTRACTED"
  | "CATCH_ALL_PATTERN"
  | "VERIFIED_TENANT"
  | "UNKNOWN";

export interface Port25Diagnostic {
  reachable: boolean;
  latencyMs: number;
  testedHost: string;
  details: string;
  checkedAt: string;
}

let cachedPort25Diagnostic: { diagnostic: Port25Diagnostic; expiresAt: number } | null = null;

/**
 * Perform a runtime outbound TCP Port 25 reachability check.
 * Detects whether the host network / cloud provider blocks outbound port 25.
 */
export async function checkOutboundPort25Reachability(timeoutMs: number = 2500): Promise<Port25Diagnostic> {
  const now = Date.now();
  if (cachedPort25Diagnostic && cachedPort25Diagnostic.expiresAt > now) {
    return cachedPort25Diagnostic.diagnostic;
  }

  const testHost = "aspmx.l.google.com";
  const start = Date.now();

  const diagnostic: Port25Diagnostic = await new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (reachable: boolean, details: string) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // Ignore
      }
      resolve({
        reachable,
        latencyMs: Date.now() - start,
        testedHost: testHost,
        details,
        checkedAt: new Date().toISOString(),
      });
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      finalize(true, "Outbound TCP Port 25 is open and unrestricted.");
    });

    socket.on("timeout", () => {
      finalize(false, "Outbound TCP Port 25 connection timed out (likely filtered by ISP/Host firewall). Enterprise HTTPS fallback active.");
    });

    socket.on("error", (err) => {
      finalize(false, `Outbound TCP Port 25 connection error: ${err.message}. Enterprise HTTPS fallback active.`);
    });

    try {
      socket.connect(25, testHost);
    } catch (err) {
      finalize(false, `Port 25 socket initialization error: ${(err as Error).message}`);
    }
  });

  cachedPort25Diagnostic = {
    diagnostic,
    expiresAt: now + 5 * 60 * 1000, // 5 min TTL
  };

  return diagnostic;
}

/**
 * Enterprise HTTPS Mailbox Verification for Microsoft 365 / Exchange Online
 * Queries Microsoft's GetCredentialType identity federation endpoint without requiring outbound Port 25.
 */
export async function verifyMicrosoft365Mailbox(
  email: string,
  timeoutMs: number = 3500
): Promise<{ verified: boolean; exists: boolean; details: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("https://login.microsoftonline.com/common/GetCredentialType", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        username: email,
        isOtherIdpSupported: true,
        checkPhones: false,
        isRemoteNGCSupported: true,
        isCookieBannerShown: false,
        isFidoSupported: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json() as {
        IfExistsResult?: number;
        ThrottleStatus?: number;
        Credentials?: { HasPassword?: boolean; PrefCredential?: number };
      };

      // IfExistsResult: 0 = User exists in Microsoft 365 tenant, 1 = Does not exist, 5 = Federated/External
      if (data.IfExistsResult === 0 || (data.Credentials && data.Credentials.HasPassword)) {
        return {
          verified: true,
          exists: true,
          details: "Mailbox verified in active Microsoft 365 enterprise tenant via HTTPS identity gate.",
        };
      } else if (data.IfExistsResult === 1) {
        return {
          verified: true,
          exists: false,
          details: "Mailbox does not exist in Microsoft 365 tenant (IfExistsResult: 1).",
        };
      }
    }

    return {
      verified: false,
      exists: false,
      details: "Microsoft 365 GetCredentialType response inconclusive or throttled.",
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      details: `Microsoft 365 HTTPS verification skipped: ${(err as Error).message}`,
    };
  }
}

/**
 * Enterprise HTTPS Tenant Verification for Google Workspace
 */
export async function verifyGoogleWorkspaceTenant(
  domain: string,
  email: string,
  timeoutMs: number = 3500
): Promise<{ verified: boolean; isTenant: boolean; details: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Probe Google Workspace enterprise domain SAML / service login endpoint
    const res = await fetch(`https://www.google.com/a/${encodeURIComponent(domain)}/ServiceLogin`, {
      method: "HEAD",
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    // Google Workspace redirects to accounts.google.com/signin/v2/identifier or ServiceLogin with domain param
    const loc = res.headers.get("location") || "";
    const isGoogleTenant = res.status === 302 && (loc.includes("accounts.google.com") || loc.includes("ServiceLogin"));

    if (isGoogleTenant) {
      return {
        verified: true,
        isTenant: true,
        details: `Confirmed active Google Workspace enterprise domain tenant for ${domain}.`,
      };
    }

    return {
      verified: false,
      isTenant: false,
      details: `Domain ${domain} is not an actively hosted Google Workspace web tenant.`,
    };
  } catch (err) {
    return {
      verified: false,
      isTenant: false,
      details: `Google Workspace tenant lookup skipped: ${(err as Error).message}`,
    };
  }
}

export interface EmailVerificationResult {
  email: string;
  status: EmailVerificationStatus;
  isCatchAll: boolean;
  mxRecordFound: boolean;
  mxHost?: string;
  smtpResponseCode?: number;
  confidenceScore: number;
  details: string;
}

/**
 * Generate standard corporate email permutations for a named individual on a domain
 */
export function generateEmailPermutations(fullName: string, domain: string): string[] {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, "").trim();
  const parts = fullName.toLowerCase().trim().replace(/[^a-z\s-]/g, "").split(/\s+/).filter(Boolean);

  if (parts.length === 0 || !cleanDomain) return [];

  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  const candidates: string[] = [];

  if (first && last) {
    candidates.push(`${first}.${last}@${cleanDomain}`); // first.last@
    candidates.push(`${first.charAt(0)}${last}@${cleanDomain}`); // flast@
    candidates.push(`${first}@${cleanDomain}`); // first@
    candidates.push(`${first}${last.charAt(0)}@${cleanDomain}`); // firstl@
    candidates.push(`${last}.${first}@${cleanDomain}`); // last.first@
  } else if (first) {
    candidates.push(`${first}@${cleanDomain}`);
  }

  // Common role-based mailboxes
  candidates.push(`founder@${cleanDomain}`);
  candidates.push(`ceo@${cleanDomain}`);
  candidates.push(`contact@${cleanDomain}`);

  return Array.from(new Set(candidates));
}

/**
 * Resolve MX records for a domain, sorted by priority ascending
 */
export async function resolveMxRecords(domain: string): Promise<dns.MxRecord[]> {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, "").trim();
  try {
    const records = await dns.promises.resolveMx(cleanDomain);
    if (!records || records.length === 0) return [];
    return records.sort((a, b) => a.priority - b.priority);
  } catch (err) {
    logger.debug(`MX lookup failed for ${cleanDomain}: ${(err as Error).message}`, { context: "SmtpVerifier" });
    return [];
  }
}

/**
 * Execute a low-level SMTP RCPT TO handshake against an MX host
 */
export async function testSmtpAddress(
  email: string,
  mxHost: string,
  timeoutMs: number = 4000
): Promise<{ code: number; message: string }> {
  return new Promise((resolve) => {
    let resolved = false;
    const socket = new net.Socket();

    const finish = (code: number, message: string) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {
        // Ignore destroy error
      }
      resolve({ code, message });
    };

    socket.setTimeout(timeoutMs);

    socket.on("timeout", () => {
      finish(408, "SMTP connection timed out");
    });

    socket.on("error", (err) => {
      finish(500, `SMTP connection error: ${err.message}`);
    });

    let step = 0;
    let buffer = "";

    socket.connect(25, mxHost, () => {
      // Wait for banner from server
    });

    socket.on("data", (data) => {
      buffer += data.toString();
      if (!buffer.endsWith("\n") && !buffer.endsWith("\r\n")) return;

      const lines = buffer.trim().split(/\r?\n/);
      const lastLine = lines[lines.length - 1];
      const code = parseInt(lastLine.slice(0, 3), 10);
      buffer = "";

      if (step === 0) {
        // Banner received
        if (code === 220) {
          step = 1;
          socket.write(`HELO autoradar.local\r\n`);
        } else {
          finish(code, lastLine);
        }
      } else if (step === 1) {
        // HELO response
        if (code === 250) {
          step = 2;
          socket.write(`MAIL FROM:<verify@autoradar.local>\r\n`);
        } else {
          finish(code, lastLine);
        }
      } else if (step === 2) {
        // MAIL FROM response
        if (code === 250) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish(code, lastLine);
        }
      } else if (step === 3) {
        // RCPT TO response - this tells us if address exists
        socket.write(`QUIT\r\n`);
        finish(code, lastLine);
      }
    });
  });
}

/**
 * In-House Email Permutation & Live SMTP Handshake Verifier
 * Verifies domain MX records, probes catch-all behavior, and evaluates candidate email permutations.
 */
export async function verifyEmailAddress(
  email: string,
  options: { isKnownPublicScraped?: boolean; timeoutMs?: number } = {}
): Promise<EmailVerificationResult> {
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      email: cleanEmail,
      status: "UNKNOWN",
      isCatchAll: false,
      mxRecordFound: false,
      confidenceScore: 0.0,
      details: "Invalid email syntax format",
    };
  }

  const domain = parts[1];
  const mxRecords = await resolveMxRecords(domain);

  if (mxRecords.length === 0) {
    return {
      email: cleanEmail,
      status: "UNKNOWN",
      isCatchAll: false,
      mxRecordFound: false,
      confidenceScore: 0.0,
      details: `No active MX records found for domain ${domain}`,
    };
  }

  const primaryMx = mxRecords[0].exchange;

  // If already extracted directly from public website / schema
  if (options.isKnownPublicScraped) {
    return {
      email: cleanEmail,
      status: "PUBLIC_EXTRACTED",
      isCatchAll: false,
      mxRecordFound: true,
      mxHost: primaryMx,
      confidenceScore: 0.90,
      details: "Extracted directly from official website/documents and verified against active MX host",
    };
  }

  // Perform Catch-All Test using impossible address
  const impossibleEmail = `test_autoradar_nonexistent_${Date.now()}@${domain}`;
  const catchAllCheck = await testSmtpAddress(impossibleEmail, primaryMx, options.timeoutMs || 3000);

  const isCatchAll = catchAllCheck.code === 250;

  // Perform RCPT TO on candidate email
  const candidateCheck = await testSmtpAddress(cleanEmail, primaryMx, options.timeoutMs || 3000);

  if (candidateCheck.code === 250) {
    if (isCatchAll) {
      return {
        email: cleanEmail,
        status: "CATCH_ALL_PATTERN",
        isCatchAll: true,
        mxRecordFound: true,
        mxHost: primaryMx,
        smtpResponseCode: 250,
        confidenceScore: 0.65,
        details: "Domain operates as catch-all server; permutation is structurally valid but mailbox is not individually testable via SMTP",
      };
    }

    return {
      email: cleanEmail,
      status: "VERIFIED_SMTP",
      isCatchAll: false,
      mxRecordFound: true,
      mxHost: primaryMx,
      smtpResponseCode: 250,
      confidenceScore: 0.98,
      details: `Mailbox verified directly via live SMTP RCPT TO handshake against ${primaryMx}`,
    };
  }

  if (candidateCheck.code >= 500 && candidateCheck.code <= 559) {
    return {
      email: cleanEmail,
      status: "UNKNOWN",
      isCatchAll: false,
      mxRecordFound: true,
      mxHost: primaryMx,
      smtpResponseCode: candidateCheck.code,
      confidenceScore: 0.0,
      details: `Recipient mailbox rejected by server (Code ${candidateCheck.code}): ${candidateCheck.message}`,
    };
  }

  // Network / timeout / blocked port 25 — Execute Enterprise HTTPS Fallback
  const lowerMx = primaryMx.toLowerCase();
  const isM365 = lowerMx.includes("outlook.com") || lowerMx.includes("protection.outlook.com");
  const isGoogle = lowerMx.includes("google.com") || lowerMx.includes("googlemail.com");

  if (isM365) {
    const m365Result = await verifyMicrosoft365Mailbox(cleanEmail, options.timeoutMs || 3000);
    if (m365Result.verified && m365Result.exists) {
      return {
        email: cleanEmail,
        status: "VERIFIED_TENANT",
        isCatchAll: false,
        mxRecordFound: true,
        mxHost: primaryMx,
        confidenceScore: 0.96,
        details: `${m365Result.details} (Bypassed restricted host outbound Port 25)`,
      };
    } else if (m365Result.verified && !m365Result.exists) {
      return {
        email: cleanEmail,
        status: "UNKNOWN",
        isCatchAll: false,
        mxRecordFound: true,
        mxHost: primaryMx,
        confidenceScore: 0.0,
        details: m365Result.details,
      };
    }
  }

  if (isGoogle) {
    const googleResult = await verifyGoogleWorkspaceTenant(domain, cleanEmail, options.timeoutMs || 3000);
    if (googleResult.verified && googleResult.isTenant) {
      return {
        email: cleanEmail,
        status: "VERIFIED_TENANT",
        isCatchAll: false,
        mxRecordFound: true,
        mxHost: primaryMx,
        confidenceScore: 0.92,
        details: `${googleResult.details} (Bypassed restricted host outbound Port 25)`,
      };
    }
  }

  return {
    email: cleanEmail,
    status: "UNKNOWN",
    isCatchAll: false,
    mxRecordFound: true,
    mxHost: primaryMx,
    smtpResponseCode: candidateCheck.code,
    confidenceScore: 0.40,
    details: `SMTP probe port 25 connection dropped or timed out (${candidateCheck.message}). Adhering to UNKNOWN > WRONG.`,
  };
}

/**
 * High-Level Decision Maker Email Resolver:
 * Takes a decision maker's name and company domain, generates permutations,
 * tests MX records, and resolves the best verified email candidate.
 */
export async function resolveDecisionMakerEmail(
  personName: string,
  domain: string,
  scrapedEmails: string[] = []
): Promise<EmailVerificationResult | null> {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, "").trim();

  // 1. Check if any scraped email directly matches person's name
  const nameParts = personName.toLowerCase().split(/\s+/).filter(Boolean);
  if (nameParts.length >= 1) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    for (const scraped of scrapedEmails) {
      const lower = scraped.toLowerCase();
      if (lower.includes(firstName) || (lastName && lower.includes(lastName))) {
        return verifyEmailAddress(scraped, { isKnownPublicScraped: true });
      }
    }
  }

  // 2. Generate permutations and test top candidates
  const permutations = generateEmailPermutations(personName, cleanDomain);
  const mxRecords = await resolveMxRecords(cleanDomain);
  if (mxRecords.length === 0) return null;

  // Test primary permutation (first.last or flast)
  for (const candidate of permutations.slice(0, 3)) {
    const check = await verifyEmailAddress(candidate);
    if (check.status === "VERIFIED_SMTP" || check.status === "VERIFIED_TENANT") {
      return check;
    }
    if (check.status === "CATCH_ALL_PATTERN") {
      return check;
    }
  }

  return null;
}
