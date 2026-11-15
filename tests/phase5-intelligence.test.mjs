import test from "node:test";
import assert from "node:assert/strict";

import {
  isPrivateIp,
  validateUrlSafe,
  politeFetch,
} from "../lib/intelligence/crawler.ts";

import { analyzeWebsite } from "../lib/intelligence/website.ts";
import { extractContactsFromHtml } from "../lib/intelligence/contact-extractor.ts";
import { enrichBusinessFromWebsite } from "../lib/intelligence/enrichment.ts";

test("Phase 5 - SSRF Protection: isPrivateIp blocks loopback, private, and cloud metadata IPs", () => {
  // Loopback and unspecified
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("127.0.1.1"), true);
  assert.equal(isPrivateIp("0.0.0.0"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("::"), true);

  // Cloud metadata (AWS, GCP, Azure, OpenStack)
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("169.254.1.1"), true);

  // Private RFC 1918 IPv4
  assert.equal(isPrivateIp("10.0.0.1"), true);
  assert.equal(isPrivateIp("10.255.255.255"), true);
  assert.equal(isPrivateIp("172.16.0.1"), true);
  assert.equal(isPrivateIp("172.25.10.5"), true);
  assert.equal(isPrivateIp("172.31.255.255"), true);
  assert.equal(isPrivateIp("192.168.0.1"), true);
  assert.equal(isPrivateIp("192.168.1.100"), true);

  // Carrier-grade NAT
  assert.equal(isPrivateIp("100.64.0.1"), true);
  assert.equal(isPrivateIp("100.100.5.5"), true);

  // IPv4-mapped IPv6
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
  assert.equal(isPrivateIp("::ffff:10.0.0.1"), true);
  assert.equal(isPrivateIp("::ffff:169.254.169.254"), true);

  // IPv6 ULA and link-local
  assert.equal(isPrivateIp("fc00::1"), true);
  assert.equal(isPrivateIp("fd12:3456:789a::1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);

  // Legitimate public IPs must NOT be blocked
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
  assert.equal(isPrivateIp("142.250.190.46"), false);
});

test("Phase 5 - SSRF Protection: validateUrlSafe blocks forbidden protocols and private hosts", async () => {
  // Protocol tests
  const fileCheck = await validateUrlSafe("file:///etc/passwd");
  assert.equal(fileCheck.safe, false);
  assert.equal(fileCheck.reason, "forbidden_protocol");

  const ftpCheck = await validateUrlSafe("ftp://ftp.example.com/file");
  assert.equal(ftpCheck.safe, false);
  assert.equal(ftpCheck.reason, "forbidden_protocol");

  // Hostname checks
  const localhostCheck = await validateUrlSafe("http://localhost:3000/api");
  assert.equal(localhostCheck.safe, false);
  assert.equal(localhostCheck.reason, "blocked_hostname");

  const internalCheck = await validateUrlSafe("http://mycorp.internal/data");
  assert.equal(internalCheck.safe, false);
  assert.equal(internalCheck.reason, "blocked_hostname");

  // Direct IP checks (without DNS)
  const privateIpCheck = await validateUrlSafe("http://169.254.169.254/latest/meta-data/");
  assert.equal(privateIpCheck.safe, false);
  assert.equal(privateIpCheck.reason, "private_ip_blocked");

  const loopbackIpCheck = await validateUrlSafe("http://127.0.0.1:8080");
  assert.equal(loopbackIpCheck.safe, false);
  assert.equal(loopbackIpCheck.reason, "private_ip_blocked");

  // Allowed public URL syntax with skipDns
  const validCheck = await validateUrlSafe("https://auraskinclinic.in", { skipDns: true });
  assert.equal(validCheck.safe, true);
  assert.equal(validCheck.normalizedUrl, "https://auraskinclinic.in/");
});

test("Phase 5 - Polite Crawler: blocks SSRF targets and handles mock responses", async () => {
  // SSRF target should immediately be blocked before network fetch
  const blockedCrawl = await politeFetch("http://127.0.0.1:5000/secret");
  assert.equal(blockedCrawl.reachable, false);
  assert.ok(blockedCrawl.error?.includes("ssrf_blocked"));

  // Mock fetcher test for redirect tracking and safe body handling
  const mockFetcher = async (url) => {
    if (url === "https://testclinic.com/") {
      return new Response(null, {
        status: 301,
        headers: { Location: "https://testclinic.com/home" },
      });
    }
    if (url === "https://testclinic.com/home") {
      return new Response("<html><head><title>Test Clinic</title></head><body><h1>Welcome</h1></body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Not found", { status: 404 });
  };

  const res = await politeFetch("https://testclinic.com/", {
    customFetch: mockFetcher,
    skipDnsValidation: true,
  });

  assert.equal(res.reachable, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.finalUrl, "https://testclinic.com/home");
  assert.equal(res.redirects.length, 1);
  assert.ok(res.body?.includes("Test Clinic"));
});

test("Phase 5 - Website Intelligence: extracts title, meta, headings, subpages, and signals", async () => {
  const mockHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Aura Skin &amp; Hair Clinic Vadodara | Leading Dermatologist</title>
      <meta name="description" content="Premier dermatology and laser clinic in Alkapuri, Vadodara. Specialized acne, scar, and hair loss treatments.">
      <meta name="generator" content="WordPress 6.4.2">
      <meta property="og:title" content="Aura Skin Clinic Vadodara">
    </head>
    <body>
      <nav>
        <a href="/">Home</a>
        <a href="/about-us">About Our Clinic</a>
        <a href="/our-doctors">Our Dermatologists &amp; Team</a>
        <a href="/treatments">Services &amp; Treatments</a>
        <a href="/contact-us">Contact Us</a>
        <a href="https://instagram.com/auraskin_vadodara" target="_blank">Instagram</a>
        <a href="https://linkedin.com/company/auraskinclinic" target="_blank">LinkedIn</a>
      </nav>
      <main>
        <h1>Advanced Clinical Dermatology in Vadodara</h1>
        <h2>Comprehensive Skin Care &amp; Laser Technology</h2>
        <p>Aura Skin Clinic is a specialized medical center in Vadodara offering state of the art skin treatments.</p>
        <a href="/book-appointment" class="btn">Book Consultation Now</a>
      </main>
      <footer>
        <p>Aura Skin Clinic, 302 Alkapuri Plaza, RC Dutt Road, Vadodara 390007, Gujarat</p>
      </footer>
    </body>
    </html>
  `;

  const intelligence = await analyzeWebsite("https://auraskin.in", {
    htmlContent: mockHtml,
  });

  assert.equal(intelligence.reachable, true);
  assert.equal(intelligence.statusCode, 200);
  assert.equal(intelligence.title, "Aura Skin & Hair Clinic Vadodara | Leading Dermatologist");
  assert.ok(intelligence.description?.includes("Premier dermatology and laser clinic"));

  // Headings
  assert.equal(intelligence.headings.length, 2);
  assert.equal(intelligence.headings[0], "Advanced Clinical Dermatology in Vadodara");

  // Subpages discovery
  assert.equal(intelligence.hasContactPage, true);
  assert.equal(intelligence.discoveredPages.contact, "https://auraskin.in/contact-us");
  assert.equal(intelligence.hasTeamPage, true);
  assert.equal(intelligence.discoveredPages.team, "https://auraskin.in/our-doctors");
  assert.equal(intelligence.discoveredPages.about, "https://auraskin.in/about-us");
  assert.equal(intelligence.discoveredPages.services, "https://auraskin.in/treatments");

  // Social links
  assert.equal(intelligence.socialLinks.length, 2);
  assert.ok(intelligence.socialLinks.some((s) => s.platform === "instagram"));
  assert.ok(intelligence.socialLinks.some((s) => s.platform === "linkedin"));

  // Signals
  assert.ok(intelligence.signals.includes("has_https"));
  assert.ok(intelligence.signals.includes("has_contact_page"));
  assert.ok(intelligence.signals.includes("has_team_page"));
  assert.ok(intelligence.signals.includes("has_call_to_action"));
  assert.ok(intelligence.signals.includes("cms_wordpress"));
});

test("Phase 5 - Contact Extractor: strictly classifies reception vs business_main and filters noise", () => {
  const contactPageHtml = `
    <html>
    <body>
      <div class="contact-card">
        <h3>Aura Skin &amp; Hair Clinic</h3>
        <p>Clinic Reception: <a href="mailto:reception@auraskin.in">reception@auraskin.in</a></p>
        <p>General Enquiries: <a href="mailto:info@auraskin.in">info@auraskin.in</a></p>
        <p>Appointments Phone: <a href="tel:0265-2345678">0265-2345678</a></p>
        <p>Mobile Helpline: <a href="tel:+919825012345">+91 98250 12345</a></p>
        <!-- False positive noise that should be rejected -->
        <img src="/assets/email-icon@2x.png" alt="icon">
        <a href="mailto:avatar@3x.jpg">Bad image</a>
        <p>Sample: demo@example.com</p>
        <p>Pincode: 390007 (Not a phone number)</p>
      </div>
      <footer>
        <p class="address">Aura Skin Clinic, 302 Alkapuri Plaza, RC Dutt Road, Vadodara, Gujarat 390007</p>
      </footer>
    </body>
    </html>
  `;

  const result = extractContactsFromHtml(
    contactPageHtml,
    "https://auraskin.in/contact-us"
  );

  // Email validation & classification
  assert.equal(result.emails.length, 2);

  const receptionEmail = result.emails.find((e) => e.email === "reception@auraskin.in");
  assert.ok(receptionEmail);
  assert.equal(receptionEmail.ownershipType, "reception");

  const businessEmail = result.emails.find((e) => e.email === "info@auraskin.in");
  assert.ok(businessEmail);
  assert.equal(businessEmail.ownershipType, "business_main");

  // False positives must be filtered out
  assert.ok(!result.emails.some((e) => e.email.includes("2x.png")));
  assert.ok(!result.emails.some((e) => e.email.includes("3x.jpg")));
  assert.ok(!result.emails.some((e) => e.email.includes("example.com")));

  // Phone validation & normalization
  assert.ok(result.phones.length >= 2);
  const landline = result.phones.find((p) => p.phone.includes("0265-2345678"));
  assert.ok(landline);
  assert.equal(landline.countryCode, "+91");

  const mobile = result.phones.find((p) => p.phone.includes("+91 98250 12345"));
  assert.ok(mobile);
  assert.equal(mobile.countryCode, "+91");

  // Pincode 390007 must NOT be extracted as a phone number
  assert.ok(!result.phones.some((p) => p.phone === "390007" || p.rawPhone === "390007"));

  // UNKNOWN > WRONG Compliance:
  // Contacts must have decisionMakerId = null
  for (const c of result.contacts) {
    assert.equal(c.decisionMakerId, null, "Website contact must NEVER be assigned to decision-maker!");
    assert.equal(c.verificationStatus, "extracted");
    assert.ok(c.evidence && c.evidence.length > 0);
    assert.equal(c.evidence[0].sourceType, "official_contact");
  }

  // Address snippet extraction
  assert.ok(result.addressSnippet?.includes("Alkapuri Plaza"));
  assert.ok(result.addressSnippet?.includes("Vadodara"));
});

test("Phase 5 - Business Enrichment Integration: updates business with subpage intelligence and contacts", async () => {
  const initialBusiness = {
    id: "biz-vadodara-001",
    canonicalName: "Aura Skin & Hair Clinic",
    website: "https://auraskin.in",
    domain: "auraskin.in",
    industry: "Dermatology Clinic",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 92,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [],
    decisionMakers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockHomepage = `
    <html>
    <head><title>Aura Skin Clinic</title><meta name="description" content="Top skin clinic in Vadodara"></head>
    <body>
      <nav><a href="/contact">Contact</a><a href="/doctors">Doctors</a></nav>
      <h1>Aura Skin Clinic</h1>
      <p>Contact us at reception@auraskin.in</p>
    </body>
    </html>
  `;

  const mockContactPage = `
    <html>
    <body>
      <h2>Get In Touch</h2>
      <p>Direct line: 0265-2345678</p>
      <p>Email: info@auraskin.in</p>
      <div class="address">Opposite Inox Cinema, Race Course, Vadodara, Gujarat</div>
    </body>
    </html>
  `;

  const enriched = await enrichBusinessFromWebsite(initialBusiness, {
    fetchSubpages: true,
    mockHtmlByUrl: {
      "https://auraskin.in": mockHomepage,
      "https://auraskin.in/contact": mockContactPage,
    },
  });

  // Verify business fields updated
  assert.equal(enriched.business.description, "Top skin clinic in Vadodara");
  assert.ok(enriched.business.address?.includes("Race Course, Vadodara"));

  // Verify contacts added and deduplicated
  assert.ok(enriched.newContacts.length >= 3);
  assert.ok(enriched.business.contacts.some((c) => c.value === "reception@auraskin.in"));
  assert.ok(enriched.business.contacts.some((c) => c.value === "info@auraskin.in"));
  assert.ok(enriched.business.contacts.some((c) => c.value.includes("0265-2345678")));

  // Verify sources enriched with evidence
  assert.ok(enriched.business.sources.length >= 3);
  assert.ok(enriched.business.sources.some((s) => s.sourceType === "official_contact"));
});

