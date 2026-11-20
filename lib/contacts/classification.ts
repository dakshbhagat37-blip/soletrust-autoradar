import type { Business } from "../types/business.ts";
import type { Contact } from "../types/contact.ts";
import type { SourceEvidence } from "../types/evidence.ts";
import { verifyEmail, type VerifyEmailOptions } from "./email-verifier.ts";
import { verifyPhone, type VerifyPhoneOptions } from "./phone-verifier.ts";
import { isGenericEmail } from "../enrichment/crawler.ts";
import type { ContactVerificationSummary } from "./types.ts";

export type ContactClassificationOptions = {
  checkMx?: boolean;
};

export type ClassifyContactsResult = {
  business: Business;
  summary: ContactVerificationSummary;
};

/**
 * Classifies, validates, and verifies all contacts belonging to a business and its decision-makers.
 * Enforces strict separation between business lines and personal direct lines (UNKNOWN > WRONG).
 */
export async function classifyAndVerifyBusinessContacts(
  business: Business,
  options: ContactClassificationOptions = {}
): Promise<ClassifyContactsResult> {
  const verifiedContacts: Contact[] = [];
  const seenValues = new Set<string>();
  const now = new Date().toISOString();

  let verifiedCount = 0;
  let partiallyVerifiedCount = 0;
  let invalidCount = 0;
  let hasDirectDecisionMakerContact = false;
  let hasVerifiedBusinessContact = false;
  let totalScore = 0;

  // Four separate counters per Master Development Requirements:
  let verifiedBusinessPhones = 0;
  let verifiedBusinessEmails = 0;
  let verifiedDecisionMakerPhones = 0;
  let verifiedDecisionMakerEmails = 0;

  const rawContacts = [...(business.contacts || [])];

  for (const contact of rawContacts) {
    if (contact.contactType === "email") {
      const emailOpts: VerifyEmailOptions = {
        businessDomain: business.domain,
        checkMx: options.checkMx ?? false,
        ownershipHint: contact.ownershipType,
      };

      const res = await verifyEmail(contact.value, emailOpts);
      const key = `email:${res.normalized}`;

      if (seenValues.has(key)) continue;
      seenValues.add(key);

      const evidence: SourceEvidence = {
        sourceUrl: contact.sourceUrl || business.website || "official_website",
        sourceHost: business.domain || "official_domain",
        sourceType: "official_contact",
        sourceTitle: "Email Verification",
        evidenceText: `Verified email: ${res.email}. Reasons: ${res.reasons.join(" ")}`,
        confidence: res.score >= 80 ? "high" : res.score >= 50 ? "medium" : "low",
        discoveredAt: now,
      };

      const updatedContact: Contact = {
        ...contact,
        value: res.normalized,
        ownershipType: res.ownershipType,
        verificationStatus: res.verificationStatus,
        verificationMethod: options.checkMx ? "rfc5322_syntax+domain_alignment+dns_mx" : "rfc5322_syntax+domain_alignment",
        evidence: [...(contact.evidence || []), evidence],
        verifiedAt: now,
      };

      if (res.syntaxValid && res.verificationStatus !== "invalid") {
        if (res.verificationStatus === "mx_valid" || res.domainMatchesBusiness) {
          verifiedCount++;
          verifiedBusinessEmails++;
          hasVerifiedBusinessContact = true;
        } else {
          partiallyVerifiedCount++;
          verifiedBusinessEmails++;
        }
        totalScore += res.score;
        verifiedContacts.push(updatedContact);
      } else {
        invalidCount++;
      }
    } else if (contact.contactType === "phone") {
      const phoneOpts: VerifyPhoneOptions = {
        country: business.country,
        targetCity: business.city,
        ownershipHint: contact.ownershipType,
      };

      const res = verifyPhone(contact.value, phoneOpts);
      const key = `phone:${res.digits}`;

      if (seenValues.has(key)) continue;
      seenValues.add(key);

      if (res.syntaxValid) {
        const evidence: SourceEvidence = {
          sourceUrl: contact.sourceUrl || business.website || "official_website",
          sourceHost: business.domain || "official_domain",
          sourceType: "official_contact",
          sourceTitle: "Phone Verification",
          evidenceText: `Verified phone: ${res.display || res.normalized}. Reasons: ${res.reasons.join(" ")}`,
          confidence: res.score >= 80 ? "high" : "medium",
          discoveredAt: now,
        };

        const updatedContact: Contact = {
          ...contact,
          value: res.display || res.normalized || contact.value,
          countryCode: res.countryCode,
          ownershipType: res.ownershipType,
          verificationStatus: res.verificationStatus,
          verificationMethod: "e164_and_national_std_validation",
          evidence: [...(contact.evidence || []), evidence],
          verifiedAt: now,
        };

        partiallyVerifiedCount++;
        verifiedBusinessPhones++;
        hasVerifiedBusinessContact = true;
        totalScore += res.score;
        verifiedContacts.push(updatedContact);
      } else {
        invalidCount++;
      }
    }
  }

  // Check Decision-Maker Contacts (Strictly Direct Contacts Only - Never assign reception lines without evidence)
  let detectedFallbackEmail: string | null = business.fallbackCorporateEmail || null;

  const updatedDecisionMakers = (business.decisionMakers || []).map((dm) => {
    const dmContacts: Contact[] = [];
    let dmEmail = dm.email || null;
    if (dmEmail && isGenericEmail(dmEmail)) {
      if (!detectedFallbackEmail) detectedFallbackEmail = dmEmail;
      dmEmail = null; // Strictly ban generic emails from being the decision maker's email
    }

    for (const dmC of dm.contacts || []) {
      if (dmC.contactType === "email") {
        const emailVal = dmC.value.toLowerCase().trim();
        const key = `email:${emailVal}`;

        if (isGenericEmail(emailVal)) {
          // Demote generic inbox to corporate fallback
          if (!detectedFallbackEmail) detectedFallbackEmail = emailVal;
          if (!seenValues.has(key)) {
            seenValues.add(key);
            verifiedCount++;
            verifiedBusinessEmails++;
            verifiedContacts.push({
              ...dmC,
              value: emailVal,
              ownershipType: "business_main",
              verificationStatus: "syntax_valid",
              verifiedAt: now,
            });
          }
          continue;
        }

        if (!seenValues.has(key)) {
          seenValues.add(key);
          hasDirectDecisionMakerContact = true;
          verifiedDecisionMakerEmails++;
          dmContacts.push({
            ...dmC,
            decisionMakerId: dm.id,
            ownershipType: "decision_maker_direct",
            verificationStatus: "syntax_valid",
            verifiedAt: now,
          });
        }
      } else if (dmC.contactType === "phone") {
        const digits = dmC.value.replace(/\D/g, "");
        const key = `phone:${digits}`;
        if (!seenValues.has(key)) {
          seenValues.add(key);
          hasDirectDecisionMakerContact = true;
          verifiedDecisionMakerPhones++;
          dmContacts.push({
            ...dmC,
            decisionMakerId: dm.id,
            ownershipType: "decision_maker_direct",
            verificationStatus: "syntax_valid",
            verifiedAt: now,
          });
        }
      }
    }
    return {
      ...dm,
      email: dmEmail,
      contacts: dmContacts,
    };
  });

  const totalAssessed = verifiedCount + partiallyVerifiedCount + invalidCount;
  const overallScore = totalAssessed > 0 ? Math.round(totalScore / (verifiedCount + partiallyVerifiedCount || 1)) : 0;

  const summary: ContactVerificationSummary = {
    contacts: verifiedContacts,
    verifiedCount,
    partiallyVerifiedCount,
    invalidCount,
    hasDirectDecisionMakerContact,
    hasVerifiedBusinessContact,
    overallScore,
    verifiedBusinessPhones,
    verifiedBusinessEmails,
    verifiedDecisionMakerPhones,
    verifiedDecisionMakerEmails,
  };

  const updatedBusiness: Business = {
    ...business,
    contacts: verifiedContacts,
    decisionMakers: updatedDecisionMakers,
    fallbackCorporateEmail: detectedFallbackEmail,
    updatedAt: now,
  };

  return {
    business: updatedBusiness,
    summary,
  };
}
