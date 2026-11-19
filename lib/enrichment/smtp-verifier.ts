import * as dns from "node:dns";
import * as net from "node:net";
import { logger } from "../logging/logger.ts";

export type EmailVerificationStatus =
  | "VERIFIED_SMTP"
  | "PUBLIC_EXTRACTED"
  | "CATCH_ALL_PATTERN"
  | "UNKNOWN";

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

  // Network / timeout / blocked port 25
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
    if (check.status === "VERIFIED_SMTP") {
      return check;
    }
    if (check.status === "CATCH_ALL_PATTERN") {
      return check;
    }
  }

  return null;
}
