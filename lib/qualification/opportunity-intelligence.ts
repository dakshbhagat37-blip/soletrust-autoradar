import type { Business } from "../types/business.ts";
import type { WebsiteIntelligence } from "../intelligence/types.ts";
import type { OpportunityIntelligence, QualificationContext, TargetDecisionMakerApproach } from "./types.ts";
import { evaluateServiceFit } from "./service-fit.ts";

/**
 * Generates transparent Opportunity Intelligence for a prospect business,
 * articulating suitability rationale, tailored service recommendations, supporting evidence,
 * targeted decision-maker approach, and explicit unknown fields (UNKNOWN > WRONG).
 */
export function generateOpportunityIntelligence(
  business: Business,
  intelligence?: WebsiteIntelligence | null,
  context?: QualificationContext
): OpportunityIntelligence {
  const serviceFit = evaluateServiceFit(business, intelligence, context);
  const requestedTrack = (context?.requestedServiceTrack || business.serviceTrack || "creative+technical").toLowerCase();

  // 1. Suitability Rationale
  const hasPhysicalPresence = Boolean(business.address && business.city);
  const hasDoctors = (business.decisionMakers && business.decisionMakers.length > 0) || intelligence?.hasTeamPage;
  const isDigitalGap =
    intelligence?.hasHttps === false ||
    (intelligence && !intelligence.hasCallToAction) ||
    (intelligence && (intelligence.socialLinks?.length ?? 0) === 0);

  let suitabilityRationale = "";
  if (hasPhysicalPresence && isDigitalGap) {
    suitabilityRationale = `High-potential prospect in ${business.city || "target region"}: Operates verified physical premises with active clinical practice, but demonstrates critical digital modernization and patient acquisition gaps.`;
  } else if (hasPhysicalPresence && hasDoctors) {
    suitabilityRationale = `Established commercial practice in ${business.city || "target region"}: Identified leadership and operating facilities suitable for professional creative and technical scaling.`;
  } else if (hasPhysicalPresence) {
    suitabilityRationale = `Active operating business in ${business.city || "target region"} with physical facility footprint; eligible for digital infrastructure and reach enhancement.`;
  } else {
    suitabilityRationale = `Discovered entity in ${business.city || "target region"} with basic identity established; requires on-site verification before commercial outreach.`;
  }

  // 2. Recommended Services
  const recommendedServices: string[] = [];

  if (intelligence?.hasHttps === false || (business.website && !business.website.startsWith("https://"))) {
    recommendedServices.push("HTTPS Security Hardening & SSL Migration");
  }

  if (intelligence && !intelligence.hasCallToAction) {
    recommendedServices.push("Online Appointment Scheduling & Patient Conversion Flow");
  }

  if (intelligence?.signals?.includes("missing_title") || intelligence?.signals?.includes("missing_meta_description")) {
    recommendedServices.push("Local Healthcare SEO & Search Engine Snippet Optimization");
  }

  if (intelligence && (intelligence.socialLinks?.length ?? 0) === 0) {
    recommendedServices.push("Omnichannel Social Media Branding & Patient Trust Strategy");
  }

  if (intelligence && (intelligence.links?.length ?? 0) < 5) {
    recommendedServices.push("Modern Responsive Healthcare Website Redesign");
  }

  if (requestedTrack.includes("technical") && recommendedServices.length === 0) {
    recommendedServices.push("Digital Infrastructure Audit & Custom Patient Portal Integration");
  }

  if (requestedTrack.includes("creative") && !recommendedServices.some((s) => s.includes("Branding"))) {
    recommendedServices.push("Brand Identity Refresh & Patient Acquisition Campaign");
  }

  if (recommendedServices.length === 0) {
    recommendedServices.push("Full-Funnel Creative & Technical Digital Modernization");
  }

  // 3. Supporting Evidence
  const supportingEvidence: string[] = [];
  for (const signal of serviceFit.signals) {
    supportingEvidence.push(`${signal.label}: ${signal.evidenceText}`);
  }
  if (supportingEvidence.length === 0) {
    if (business.address) {
      supportingEvidence.push(`Verified physical address: ${business.address}`);
    }
    if (business.website) {
      supportingEvidence.push(`Active web presence at ${business.website}`);
    }
  }

  // 4. Target Decision-Maker Approach
  let targetDecisionMaker: TargetDecisionMakerApproach | null = null;
  const dms = business.decisionMakers || [];

  const commercialPurchaser = dms.find((d) => d.isPurchasingAuthority);
  const clinicalLeader = dms.find((d) => d.authorityType === "clinical_authority");

  if (commercialPurchaser) {
    targetDecisionMaker = {
      fullName: commercialPurchaser.fullName,
      roleLabel: commercialPurchaser.roleLabel,
      authorityType: commercialPurchaser.authorityType,
      approachRationale: `Directly pitch ${commercialPurchaser.fullName} (${commercialPurchaser.roleLabel}): Holds confirmed commercial purchasing and organizational authority for budget approval.`,
    };
  } else if (clinicalLeader) {
    targetDecisionMaker = {
      fullName: clinicalLeader.fullName,
      roleLabel: clinicalLeader.roleLabel,
      authorityType: "clinical_authority",
      approachRationale: `Consult ${clinicalLeader.fullName} (${clinicalLeader.roleLabel}) for clinical workflow endorsement; partner with clinic director or practice manager for commercial purchase sign-off.`,
    };
  } else if (dms.length > 0) {
    const firstDm = dms[0];
    targetDecisionMaker = {
      fullName: firstDm.fullName,
      roleLabel: firstDm.roleLabel,
      authorityType: firstDm.authorityType,
      approachRationale: `Engage ${firstDm.fullName} (${firstDm.roleLabel}) to establish practice leadership contact and determine internal purchasing workflow.`,
    };
  } else {
    targetDecisionMaker = {
      fullName: null,
      roleLabel: null,
      authorityType: null,
      approachRationale: "No individual decision-maker verified. Initiate contact through general enquiry channel or practice administrator.",
    };
  }

  // 5. Unknown Fields (UNKNOWN > WRONG)
  const unknownFields: string[] = [];
  if (!commercialPurchaser) {
    unknownFields.push("Commercial Purchasing Authority (Owner / Managing Director)");
  }
  if (!business.contacts?.some((c) => c.contactType === "email")) {
    unknownFields.push("Verified Corporate / Practice Email");
  }
  if (!business.contacts?.some((c) => c.contactType === "phone")) {
    unknownFields.push("Verified Business Telephone Line");
  }
  if (!business.website) {
    unknownFields.push("Official Website Domain");
  }
  if (!business.employeeRange) {
    unknownFields.push("Practice Team / Employee Headcount");
  }

  return {
    suitabilityRationale,
    recommendedServices,
    supportingEvidence,
    targetDecisionMaker,
    unknownFields,
    serviceFitScore: serviceFit.score,
  };
}

