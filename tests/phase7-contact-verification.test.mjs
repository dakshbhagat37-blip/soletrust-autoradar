import test from "node:test";
import assert from "node:assert/strict";

import {
  verifyEmail,
} from "../lib/contacts/email-verifier.ts";

import {
  verifyPhone,
} from "../lib/contacts/phone-verifier.ts";

import {
  classifyAndVerifyBusinessContacts,
} from "../lib/contacts/classification.ts";

test("Phase 7 - Email Verifier: validates syntax, domain matching, and blocks disposables", async () => {
  // Corporate domain matching business website
  const corp = await verifyEmail("info@auraskin.in", {
    businessDomain: "auraskin.in",
  });
  assert.equal(corp.syntaxValid, true);
  assert.equal(corp.domainMatchesBusiness, true);
  assert.equal(corp.ownershipType, "business_main");
  assert.ok(corp.score >= 85);

  // Reception email classification
  const rec = await verifyEmail("reception@auraskin.in", {
    businessDomain: "auraskin.in",
  });
  assert.equal(rec.syntaxValid, true);
  assert.equal(rec.ownershipType, "reception");

  // Free consumer email (Gmail)
  const free = await verifyEmail("auraskinvadodara@gmail.com", {
    businessDomain: "auraskin.in",
  });
  assert.equal(free.syntaxValid, true);
  assert.equal(free.isFreeEmail, true);
  assert.equal(free.domainMatchesBusiness, false);
  assert.ok(free.score <= 65);

  // Disposable email rejection
  const disp = await verifyEmail("fake@10minutemail.com");
  assert.equal(disp.isDisposable, true);
  assert.equal(disp.verificationStatus, "invalid");
  assert.equal(disp.score, 0);

  // Malformed syntax rejection
  const invalid = await verifyEmail("not-an-email");
  assert.equal(invalid.syntaxValid, false);
  assert.equal(invalid.verificationStatus, "invalid");
});

test("Phase 7 - Email Verifier: safe MX check handles sandbox offline gracefully (UNKNOWN > WRONG)", async () => {
  // Case A: When MX resolution succeeds
  const verifiedMx = await verifyEmail("contact@auraskin.in", {
    businessDomain: "auraskin.in",
    checkMx: true,
    customMxResolver: async () => [{ exchange: "mail.auraskin.in", priority: 10 }],
  });
  assert.equal(verifiedMx.syntaxValid, true);
  assert.equal(verifiedMx.mxValid, true);
  assert.equal(verifiedMx.verificationStatus, "mx_valid");

  // Case B: When MX resolution fails in offline/sandboxed environment
  const offlineMx = await verifyEmail("contact@auraskin.in", {
    businessDomain: "auraskin.in",
    checkMx: true,
    customMxResolver: async () => {
      throw new Error("ENOTFOUND");
    },
  });
  assert.equal(offlineMx.syntaxValid, true);
  assert.equal(offlineMx.mxValid, null);
  assert.equal(offlineMx.verificationStatus, "syntax_valid");
  assert.ok(offlineMx.reasons.some((r) => r.includes("sandbox") || r.includes("DNS")));
});

test("Phase 7 - Phone Verifier: formats Indian mobiles, Vadodara landlines, and toll-free numbers", () => {
  // Vadodara mobile number
  const mobile = verifyPhone("+91 98250 12345");
  assert.equal(mobile.syntaxValid, true);
  assert.equal(mobile.phoneType, "mobile");
  assert.equal(mobile.countryCode, "+91");
  assert.equal(mobile.display, "+91 98250 12345");
  assert.ok(mobile.score >= 85);

  // Mobile without country code (10 digits)
  const mobile10 = verifyPhone("9825012345");
  assert.equal(mobile10.syntaxValid, true);
  assert.equal(mobile10.phoneType, "mobile");
  assert.equal(mobile10.display, "+91 98250 12345");

  // Vadodara STD landline (0265)
  const vadodaraLandline = verifyPhone("0265-2345678", {
    targetCity: "Vadodara",
  });
  assert.equal(vadodaraLandline.syntaxValid, true);
  assert.equal(vadodaraLandline.phoneType, "landline");
  assert.equal(vadodaraLandline.stdAreaCode, "0265");
  assert.ok(vadodaraLandline.score >= 90); // boosted for city match

  // Toll-free helpline
  const tollFree = verifyPhone("1800-200-1234");
  assert.equal(tollFree.syntaxValid, true);
  assert.equal(tollFree.phoneType, "toll_free");
  assert.equal(tollFree.ownershipType, "business_main");
});

test("Phase 7 - Phone Verifier: rejects non-phone noise (pincodes, dates, repetitive digits)", () => {
  // Pincode 390007 (Vadodara PIN) must NOT be accepted as a phone
  const pincode = verifyPhone("390007");
  assert.equal(pincode.syntaxValid, false);
  assert.equal(pincode.verificationStatus, "invalid");

  // ISO Date string
  const date = verifyPhone("2024-05-12");
  assert.equal(date.syntaxValid, false);

  // Repetitive dummy digits
  const repetitive = verifyPhone("0000000000");
  assert.equal(repetitive.syntaxValid, false);

  // Too short
  const shortNum = verifyPhone("12345");
  assert.equal(shortNum.syntaxValid, false);
});

test("Phase 7 - Ownership Separation: never attributes reception lines to decision makers (UNKNOWN > WRONG)", async () => {
  const mockBusiness = {
    id: "biz-vadodara-002",
    canonicalName: "Aura Skin Clinic",
    domain: "auraskin.in",
    website: "https://auraskin.in",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [
      {
        id: "c-rec",
        contactType: "phone",
        value: "0265-2345678",
        ownershipType: "reception",
        verificationStatus: "extracted",
        decisionMakerId: null,
      },
      {
        id: "c-email",
        contactType: "email",
        value: "info@auraskin.in",
        ownershipType: "business_main",
        verificationStatus: "extracted",
        decisionMakerId: null,
      },
    ],
    decisionMakers: [
      {
        id: "dm-001",
        fullName: "Dr. Anita Patel",
        role: "founder",
        roleLabel: "Founder & Medical Director",
        discoveryStatus: "discovered",
        verificationStatus: "verified",
        confidenceScore: 95,
        evidence: [],
        contacts: [], // Anita does NOT have a publicly listed direct mobile
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await classifyAndVerifyBusinessContacts(mockBusiness);

  // Decision maker contacts must remain strictly separate from clinic reception line
  const anita = result.business.decisionMakers.find((dm) => dm.fullName === "Dr. Anita Patel");
  assert.ok(anita);
  assert.equal(anita.contacts.length, 0, "Clinic reception line must NEVER be assigned to decision-maker!");

  // Business contacts must be classified properly
  const recContact = result.business.contacts.find((c) => c.value.includes("0265-2345678"));
  assert.ok(recContact);
  assert.equal(recContact.ownershipType, "reception");
  assert.equal(recContact.verificationStatus, "syntax_valid");

  // Summary counts
  assert.equal(result.summary.hasDirectDecisionMakerContact, false);
  assert.equal(result.summary.hasVerifiedBusinessContact, true);
  assert.ok(result.summary.overallScore >= 80);
});

test("Phase 7 - Pipeline: filters invalid contacts, deduplicates, and creates verification evidence", async () => {
  const mockBusiness = {
    id: "biz-vadodara-003",
    canonicalName: "Radiant Skin & Laser",
    domain: "radiantskin.in",
    website: "https://radiantskin.in",
    city: "Vadodara",
    country: "India",
    identityStatus: "verified",
    identityScore: 85,
    qualificationScore: 0,
    status: "researching",
    sources: [],
    contacts: [
      {
        contactType: "email",
        value: "contact@radiantskin.in",
        ownershipType: "business_main",
        verificationStatus: "extracted",
      },
      {
        contactType: "email",
        value: "bad-disposable@10minutemail.com", // should be rejected
        ownershipType: "business_main",
        verificationStatus: "extracted",
      },
      {
        contactType: "phone",
        value: "390007", // pincode: should be rejected
        ownershipType: "business_main",
        verificationStatus: "extracted",
      },
      {
        contactType: "phone",
        value: "+91 98250 99999",
        ownershipType: "business_main",
        verificationStatus: "extracted",
      },
    ],
    decisionMakers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await classifyAndVerifyBusinessContacts(mockBusiness);

  // Invalid contacts (disposable email and pincode) filtered out from valid contacts list
  assert.equal(result.business.contacts.length, 2);
  assert.equal(result.summary.invalidCount, 2);
  assert.equal(result.summary.hasVerifiedBusinessContact, true);

  // Evidence provenance created for verified contacts
  for (const c of result.business.contacts) {
    assert.ok(c.evidence && c.evidence.length > 0);
    assert.ok(c.verifiedAt);
  }
});
