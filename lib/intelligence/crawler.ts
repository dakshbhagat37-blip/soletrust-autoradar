import * as dns from "node:dns";
import type { CrawlResult } from "./types.ts";
import { logger } from "../logging/logger.ts";

const BLOCKED_HOST_SUFFIXES = [
  "localhost",
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  "metadata.google.internal",
];

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; SoleTrustAutoRadar/1.0; +https://soletrust.com/bot)";

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * or cloud metadata ranges (SSRF prevention).
 */
export function isPrivateIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();

  // IPv6 loopback / unspecified
  if (trimmed === "::1" || trimmed === "::" || trimmed === "0.0.0.0") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (trimmed.startsWith("::ffff:")) {
    return isPrivateIp(trimmed.slice(7));
  }

  // IPv4 CIDR checks
  const ipv4Parts = trimmed.split(".").map((p) => Number(p));
  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every((p) => !Number.isNaN(p) && p >= 0 && p <= 255)
  ) {
    const [a, b] = ipv4Parts;

    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 Loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 Link-local / Cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 Private
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 Private
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 Carrier-grade NAT
    if (a === 192 && b === 0) return true; // 192.0.0.0/24 & 192.0.2.0/24 TEST-NET-1
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true; // Benchmark / TEST-NET-2
    if (a === 203 && b === 0) return true; // TEST-NET-3
    if (a >= 224) return true; // 224.0.0.0/4 Multicast & 240.0.0.0/4 Reserved
    return false;
  }

  // IPv6 Unique Local Address (fc00::/7) or Link-Local (fe80::/10)
  if (
    trimmed.startsWith("fc") ||
    trimmed.startsWith("fd") ||
    trimmed.startsWith("fe8") ||
    trimmed.startsWith("fe9") ||
    trimmed.startsWith("fea") ||
    trimmed.startsWith("feb")
  ) {
    return true;
  }

  return false;
}

export type UrlSafetyValidation = {
  safe: boolean;
  reason?: string;
  resolvedIp?: string;
  normalizedUrl?: string;
};

/**
 * Validates that a given URL is safe to crawl (HTTP/HTTPS only, no private hostnames or IPs).
 */
export async function validateUrlSafe(
  urlString: string,
  options?: { skipDns?: boolean }
): Promise<UrlSafetyValidation> {
  const trimmed = urlString.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return { safe: false, reason: "invalid_url" };
    }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "forbidden_protocol" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  for (const blocked of BLOCKED_HOST_SUFFIXES) {
    if (hostname === blocked || hostname.endsWith(blocked)) {
      return { safe: false, reason: "blocked_hostname" };
    }
  }

  // Check if hostname is directly an IP address
  const directIp = hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets if any
  if (isPrivateIp(directIp)) {
    return { safe: false, reason: "private_ip_blocked", resolvedIp: directIp };
  }

  if (options?.skipDns) {
    return { safe: true, normalizedUrl: parsed.toString() };
  }

  // Resolve hostname via DNS to prevent DNS-rebinding SSRF
  try {
    const lookup = await dns.promises.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      return {
        safe: false,
        reason: "resolved_private_ip",
        resolvedIp: lookup.address,
      };
    }
    return {
      safe: true,
      resolvedIp: lookup.address,
      normalizedUrl: parsed.toString(),
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    return {
      safe: false,
      reason: code === "ENOTFOUND" ? "dns_not_found" : "dns_lookup_failed",
    };
  }
}

export type PoliteFetchOptions = {
  timeoutMs?: number;
  maxRedirects?: number;
  maxBytes?: number;
  userAgent?: string;
  customFetch?: typeof fetch;
  skipDnsValidation?: boolean; // Useful for mock server tests
};

/**
 * Executes a polite, SSRF-safe HTTP GET request with timeout, redirect tracking,
 * and maximum payload bounds.
 */
export async function politeFetch(
  targetUrl: string,
  options: PoliteFetchOptions = {}
): Promise<CrawlResult> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxRedirects = options.maxRedirects ?? 3;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024; // 2MB
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const fetchFn = options.customFetch ?? fetch;

  const redirects: string[] = [];
  const visited = new Set<string>();
  let currentUrl = targetUrl.trim();
  const startTime = Date.now();

  try {
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
      // Validate SSRF safety of current URL
      const safety = await validateUrlSafe(currentUrl, {
        skipDns: options.skipDnsValidation,
      });

      if (!safety.safe) {
        return {
          url: targetUrl,
          finalUrl: currentUrl,
          reachable: false,
          statusCode: null,
          contentType: null,
          contentLength: 0,
          body: null,
          redirects,
          error: `ssrf_blocked: ${safety.reason}`,
          timingMs: Date.now() - startTime,
        };
      }

      const validUrl = safety.normalizedUrl ?? currentUrl;
      visited.add(validUrl);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetchFn(validUrl, {
          method: "GET",
          headers: {
            "User-Agent": userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
          },
          redirect: "manual", // Handle redirects manually for SSRF safety
          signal: controller.signal,
          cache: "no-store",
        });
      } finally {
        clearTimeout(timer);
      }

      const status = response.status;

      // Handle redirect status codes (301, 302, 303, 307, 308)
      if (
        status === 301 ||
        status === 302 ||
        status === 303 ||
        status === 307 ||
        status === 308
      ) {
        const locationHeader = response.headers.get("location");
        if (!locationHeader) {
          return {
            url: targetUrl,
            finalUrl: currentUrl,
            reachable: false,
            statusCode: status,
            contentType: response.headers.get("content-type"),
            contentLength: 0,
            body: null,
            redirects,
            error: "redirect_without_location",
            timingMs: Date.now() - startTime,
          };
        }

        const nextUrl = new URL(locationHeader, currentUrl).toString();
        redirects.push(nextUrl);

        if (visited.has(nextUrl)) {
          return {
            url: targetUrl,
            finalUrl: nextUrl,
            reachable: false,
            statusCode: status,
            contentType: response.headers.get("content-type"),
            contentLength: 0,
            body: null,
            redirects,
            error: "circular_redirect",
            timingMs: Date.now() - startTime,
          };
        }

        if (redirectCount === maxRedirects) {
          return {
            url: targetUrl,
            finalUrl: nextUrl,
            reachable: false,
            statusCode: status,
            contentType: response.headers.get("content-type"),
            contentLength: 0,
            body: null,
            redirects,
            error: "redirect_limit_exceeded",
            timingMs: Date.now() - startTime,
          };
        }

        currentUrl = nextUrl;
        continue;
      }

      const contentType = response.headers.get("content-type");
      const contentLengthHeader = response.headers.get("content-length");
      const declaredLength = contentLengthHeader
        ? Number.parseInt(contentLengthHeader, 10)
        : null;

      if (declaredLength !== null && declaredLength > maxBytes) {
        return {
          url: targetUrl,
          finalUrl: currentUrl,
          reachable: true,
          statusCode: status,
          contentType,
          contentLength: declaredLength,
          body: null,
          redirects,
          error: "content_length_exceeded_limit",
          timingMs: Date.now() - startTime,
        };
      }

      if (!response.ok) {
        return {
          url: targetUrl,
          finalUrl: currentUrl,
          reachable: true,
          statusCode: status,
          contentType,
          contentLength: 0,
          body: null,
          redirects,
          error: `http_error_${status}`,
          timingMs: Date.now() - startTime,
        };
      }

      // Read response body safely within byte limit
      const rawBody = await response.text();
      const actualLength = Buffer.byteLength(rawBody, "utf8");

      return {
        url: targetUrl,
        finalUrl: currentUrl,
        reachable: true,
        statusCode: status,
        contentType,
        contentLength: actualLength,
        body: actualLength > maxBytes ? rawBody.slice(0, maxBytes) : rawBody,
        redirects,
        timingMs: Date.now() - startTime,
      };
    }

    return {
      url: targetUrl,
      finalUrl: currentUrl,
      reachable: false,
      statusCode: null,
      contentType: null,
      contentLength: 0,
      body: null,
      redirects,
      error: "redirect_limit_exceeded",
      timingMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError");
    const errMsg = err instanceof Error ? err.message : String(err);

    logger.debug("Polite fetch failed", {
      data: {
        url: targetUrl,
        error: errMsg,
        isAbort,
      },
    });

    return {
      url: targetUrl,
      finalUrl: currentUrl,
      reachable: false,
      statusCode: null,
      contentType: null,
      contentLength: 0,
      body: null,
      redirects,
      error: isAbort ? "timeout" : errMsg,
      timingMs: Date.now() - startTime,
    };
  }
}
