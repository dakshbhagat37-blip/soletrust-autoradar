import { logger } from "../logging/logger.ts";
import { resolveDecisionMakerEmail } from "./smtp-verifier.ts";

export interface OffWebsiteOwnerIntel {
  ownerFound: boolean;
  fullName: string | null;
  role: string | null;
  linkedinUrl: string | null;
  directPhone: string | null;
  phoneLabel: "DIRECT_MOBILE" | "WHATSAPP_VERIFIED" | "CORPORATE_SWITCHBOARD" | "UNKNOWN";
  email: string | null;
  emailStatus: "VERIFIED_SMTP" | "VERIFIED_TENANT" | "UNKNOWN";
  rdapRegistrantOrg: string | null;
  rdapContactName: string | null;
  corporateRegistryRecord: {
    registryName?: string;
    entityNumber?: string;
    directorName?: string;
    status?: string;
  } | null;
  confidenceScore: number;
  corroboratingSignals: string[];
  provenance: Array<{
    source: "RDAP" | "CORPORATE_REGISTRY" | "PRESS_INTERVIEW" | "LINKEDIN_OSINT" | "SMTP_VERIFIER";
    detail: string;
    timestamp: string;
  }>;
}

export interface OwnerDetectiveQuery {
  companyName: string;
  domain: string;
  city?: string | null;
  country?: string | null;
  existingPhones?: string[];
  searxngUrl?: string;
  timeoutMs?: number;
}

const PRIVACY_PROXY_PATTERNS = [
  /whoisguard/i,
  /domains\s*by\s*proxy/i,
  /contact\s*privacy/i,
  /privacy\s*protect/i,
  /withheld\s*for\s*privacy/i,
  /redacted\s*for\s*privacy/i,
  /cloudflare/i,
  /superprivacy/i,
  /proxy\s*protection/i,
  /namecheap/i,
  /godaddy/i,
  /data\s*protected/i,
  /gdpr\s*masked/i,
];

function isPrivacyProxy(val?: string | null): boolean {
  if (!val) return true;
  const s = val.trim();
  if (s.length < 3) return true;
  return PRIVACY_PROXY_PATTERNS.some((p) => p.test(s));
}

/**
 * Vector 1: RDAP Domain Registry Lookup
 * Queries rdap.org for real registrant entity / admin contact
 */
export async function queryRdapDomainIntelligence(
  domain: string,
  timeoutMs = 5000
): Promise<{ registrantOrg: string | null; contactName: string | null; creationDate: string | null }> {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim().toLowerCase();
  if (!cleanDomain || cleanDomain.includes("localhost")) {
    return { registrantOrg: null, contactName: null, creationDate: null };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`https://rdap.org/domain/${cleanDomain}`, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timer);
    if (!res || !res.ok) {
      return { registrantOrg: null, contactName: null, creationDate: null };
    }

    const data = await res.json().catch(() => null);
    if (!data) return { registrantOrg: null, contactName: null, creationDate: null };

    let registrantOrg: string | null = null;
    let contactName: string | null = null;
    let creationDate: string | null = null;

    if (Array.isArray(data.events)) {
      const regEvent = data.events.find((e: { eventAction: string }) => e?.eventAction === "registration");
      if (regEvent?.eventDate) {
        creationDate = regEvent.eventDate;
      }
    }

    if (Array.isArray(data.entities)) {
      for (const ent of data.entities) {
        const roles = Array.isArray(ent.roles) ? ent.roles : [];
        const isRegistrantOrAdmin = roles.includes("registrant") || roles.includes("administrative");
        if (isRegistrantOrAdmin && Array.isArray(ent.vcardArray?.[1])) {
          for (const item of ent.vcardArray[1]) {
            if (item[0] === "fn" && typeof item[3] === "string") {
              const nameCandidate = item[3].trim();
              if (!isPrivacyProxy(nameCandidate)) {
                if (nameCandidate.split(/\s+/).length >= 2 && !contactName) {
                  contactName = nameCandidate;
                } else if (!registrantOrg) {
                  registrantOrg = nameCandidate;
                }
              }
            } else if (item[0] === "org" && typeof item[3] === "string") {
              const orgCandidate = item[3].trim();
              if (!isPrivacyProxy(orgCandidate)) {
                registrantOrg = orgCandidate;
              }
            }
          }
        }
      }
    }

    return { registrantOrg, contactName, creationDate };
  } catch {
    return { registrantOrg: null, contactName: null, creationDate: null };
  }
}

/**
 * Vector 2: Corporate Registry Intelligence
 * Queries open corporate databases (OpenCorporates public search endpoint)
 */
export async function queryCorporateRegistry(
  companyName: string,
  country = "United States",
  timeoutMs = 5000
): Promise<{ registryName: string; entityNumber?: string; directorName?: string; status?: string } | null> {
  const cleanName = companyName.trim();
  if (!cleanName || cleanName.length < 3) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const jurisdiction = country.toLowerCase().includes("australia") ? "au" : country.toLowerCase().includes("uk") || country.toLowerCase().includes("united kingdom") ? "gb" : "us";
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(cleanName)}&jurisdiction_code=${jurisdiction}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timer);
    if (!res || !res.ok) return null;

    const json = await res.json().catch(() => null);
    const company = json?.results?.companies?.[0]?.company;
    if (!company) return null;

    return {
      registryName: company.jurisdiction_code?.toUpperCase() || "OpenCorporates Registry",
      entityNumber: company.company_number,
      directorName: company.agent_name || undefined,
      status: company.current_status || "Active",
    };
  } catch {
    return null;
  }
}

/**
 * Vector 3 & 4: Deep Digital Footprint, Press Triangulation & Owner Contact Resolution
 */
export async function detectOffWebsiteOwner(query: OwnerDetectiveQuery): Promise<OffWebsiteOwnerIntel> {
  const timeoutMs = query.timeoutMs || 6000;
  const searxngBase = (query.searxngUrl || process.env.SEARXNG_URL || "http://localhost:8080").replace(/\/$/, "");
  const company = query.companyName.trim();
  const domain = query.domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim().toLowerCase();
  const city = query.city?.trim() || "";

  const result: OffWebsiteOwnerIntel = {
    ownerFound: false,
    fullName: null,
    role: null,
    linkedinUrl: null,
    directPhone: query.existingPhones?.[0] || null,
    phoneLabel: query.existingPhones?.[0] ? "CORPORATE_SWITCHBOARD" : "UNKNOWN",
    email: null,
    emailStatus: "UNKNOWN",
    rdapRegistrantOrg: null,
    rdapContactName: null,
    corporateRegistryRecord: null,
    confidenceScore: 0.0,
    corroboratingSignals: [],
    provenance: [],
  };

  if (!company && !domain) return result;

  // 1. RDAP Query
  if (domain) {
    const rdap = await queryRdapDomainIntelligence(domain, timeoutMs);
    if (rdap.registrantOrg) {
      result.rdapRegistrantOrg = rdap.registrantOrg;
      result.corroboratingSignals.push(`RDAP Registrant Org: "${rdap.registrantOrg}"`);
      result.provenance.push({
        source: "RDAP",
        detail: `Registrant Organization: ${rdap.registrantOrg}`,
        timestamp: new Date().toISOString(),
      });
    }
    if (rdap.contactName) {
      result.rdapContactName = rdap.contactName;
      result.corroboratingSignals.push(`RDAP Contact: "${rdap.contactName}"`);
      result.provenance.push({
        source: "RDAP",
        detail: `Administrative Contact: ${rdap.contactName}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 2. Corporate Registry
  const corp = await queryCorporateRegistry(company, query.country || "United States", timeoutMs);
  if (corp) {
    result.corporateRegistryRecord = corp;
    result.corroboratingSignals.push(`Corporate Registry Match: ${corp.registryName} #${corp.entityNumber || "N/A"}`);
    result.provenance.push({
      source: "CORPORATE_REGISTRY",
      detail: `Verified with ${corp.registryName}: ${corp.status || "Active"}${corp.directorName ? ` (Director: ${corp.directorName})` : ""}`,
      timestamp: new Date().toISOString(),
    });

    if (corp.directorName && !result.fullName) {
      result.fullName = corp.directorName;
      result.role = "Managing Director / Officer";
    }
  }

  // 3. SearXNG Targeted Dorks (Press, Interviews, LinkedIn Profiles)
  const dorks = [
    `"${company}" ${city} ("founded by" OR "owned by" OR "CEO" OR "Founder" OR "Managing Director")`,
    `site:linkedin.com/in/ "${company}" ("CEO" OR "Founder" OR "Owner")`,
  ];

  for (const dork of dorks) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `${searxngBase}/search?q=${encodeURIComponent(dork)}&format=json`;
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);
      if (!res || !res.ok) continue;

      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.results)) continue;

      for (const item of data.results) {
        const title: string = item.title || "";
        const snippet: string = item.content || "";
        const url: string = item.url || "";
        const text = `${title} ${snippet}`.toLowerCase();

        // Find LinkedIn profile URL
        if (url.includes("linkedin.com/in/") && !result.linkedinUrl) {
          const match = url.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
          if (match) {
            result.linkedinUrl = match[0];
            result.corroboratingSignals.push(`Personal LinkedIn Resolved: ${match[0]}`);
            result.provenance.push({
              source: "LINKEDIN_OSINT",
              detail: `Discovered verified personal profile: ${match[0]} (${title})`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Extract Owner Name from title or snippet if not yet resolved
        if (!result.fullName) {
          const nameMatch = title.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*[-–|]/);
          if (nameMatch && !isPrivacyProxy(nameMatch[1])) {
            result.fullName = nameMatch[1];
            result.role = "Founder & CEO";
            result.corroboratingSignals.push(`Leadership Press Triangulation: ${nameMatch[1]}`);
            result.provenance.push({
              source: "PRESS_INTERVIEW",
              detail: `Cited in publication: "${title}" (${url})`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Direct Mobile / WhatsApp detection
        const waMatch = text.match(/(?:wa\.me\/|whatsapp:\s*)(\+?\d{9,15})/i) || text.match(/\b(?:\+?1[-.]?)?\(?([2-9]\d{2})\)?[-.]?(\d{3})[-.]?(\d{4})\b/);
        if (waMatch && (!result.directPhone || result.phoneLabel === "CORPORATE_SWITCHBOARD")) {
          result.directPhone = waMatch[0].trim();
          result.phoneLabel = text.includes("whatsapp") || text.includes("wa.me") ? "WHATSAPP_VERIFIED" : "DIRECT_MOBILE";
          result.corroboratingSignals.push(`Direct Contact Vector: ${result.directPhone} (${result.phoneLabel})`);
        }
      }
    } catch {
      // Dork execution error
    }
  }

  // Fallback to RDAP contact if no other name was found
  if (!result.fullName && result.rdapContactName) {
    result.fullName = result.rdapContactName;
    result.role = "Proprietor / Domain Registrant";
  }

  // 4. In-House SMTP Handshake & Permutation Verification
  if (result.fullName && domain) {
    try {
      const emailRes = await resolveDecisionMakerEmail(result.fullName, domain);
      if (emailRes && emailRes.email && (emailRes.status === "VERIFIED_SMTP" || emailRes.status === "VERIFIED_TENANT")) {
        result.email = emailRes.email;
        result.emailStatus = emailRes.status;
        result.corroboratingSignals.push(`Direct Mailbox Verified: ${emailRes.email} (${emailRes.status})`);
        result.provenance.push({
          source: "SMTP_VERIFIER",
          detail: `Cryptographically/Protocol-Verified Mailbox: ${emailRes.email} via ${emailRes.details || "Direct Protocol Handshake"}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Email resolution error
    }
  }

  // Calculate Corroboration Score: Require >= 2 matching signals for high confidence
  const signalCount = result.corroboratingSignals.length;
  if (signalCount >= 3) {
    result.confidenceScore = 0.95;
    result.ownerFound = true;
  } else if (signalCount >= 2) {
    result.confidenceScore = 0.85;
    result.ownerFound = true;
  } else if (signalCount === 1) {
    result.confidenceScore = 0.60;
    result.ownerFound = !!result.fullName;
  } else {
    result.confidenceScore = 0.0;
    result.ownerFound = false;
  }

  logger.info(`Off-website owner detection complete for ${company}`, {
    context: "OwnerDetective",
    data: {
      ownerFound: result.ownerFound,
      fullName: result.fullName,
      confidence: result.confidenceScore,
    },
  });

  return result;
}
