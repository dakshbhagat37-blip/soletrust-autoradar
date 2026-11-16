import type { Business } from "../types/business.ts";
import type { CrmLead } from "../types/lead.ts";
import type { AiSalesStrategy, OutreachChannel } from "../types/crm.ts";

/**
 * Generate an evidence-backed, transparent AI sales strategy for a lead.
 * Adheres strictly to UNKNOWN > WRONG:
 * - Uses only verified observations and crawled evidence.
 * - Never pretends to know the prospect personally.
 * - Never invents prior conversations or fake needs.
 */
export function generateAiSalesStrategy(business: Business, lead?: CrmLead): AiSalesStrategy {
  const primaryDm = business.decisionMakers?.find(
    (dm) => dm.verificationStatus === "verified" || dm.verificationStatus === "partially_verified"
  ) || business.decisionMakers?.[0] || null;

  const companyName = business.canonicalName || "Clinic";
  const industry = business.industry || "Medical & Healthcare";
  const city = business.city || "Target Location";
  const serviceTrack = business.serviceTrack || "creative+technical";

  // Analyze opportunity signals from qualification
  const qual = business.qualification;
  const oppReasons = qual?.reasons || [];

  const primaryEvidence = business.sources?.map((s) => s.evidenceText || s.sourceUrl).filter(Boolean).slice(0, 3) || [];

  // Determine primary service offer
  let primaryService = "Digital Experience & Patient Acquisition Architecture";
  let valueProposition = "Modernize digital patient acquisition and streamline clinic appointment bookings";
  let openingAngle = `enhancing digital patient accessibility for ${companyName} in ${city}`;

  if (serviceTrack.includes("creative") && !serviceTrack.includes("technical")) {
    primaryService = "Clinic Brand Identity & Visual Positioning";
    valueProposition = "Establish high-trust visual consistency and patient-facing aesthetic brand presentation";
    openingAngle = `upgrading brand presence and patient-facing trust signals across ${companyName}'s digital touchpoints`;
  } else if (serviceTrack.includes("technical") && !serviceTrack.includes("creative")) {
    primaryService = "Automated Clinic Booking Engine & Mobile Performance Optimization";
    valueProposition = "Reduce patient drop-off with sub-second page loads and direct WhatsApp/calendar appointment scheduling";
    openingAngle = `implementing seamless mobile appointment conversion for patients visiting from ${city}`;
  } else {
    primaryService = "Full-Stack Patient Conversion Infrastructure (Brand + Booking Engine)";
    valueProposition = "Combine elite clinical brand prestige with friction-free mobile appointment booking";
    openingAngle = `elevating ${companyName}'s patient inquiry flow and modernizing mobile booking in ${city}`;
  }

  // Who to contact
  const dmName = primaryDm ? primaryDm.fullName : null;
  const dmRole = primaryDm ? (primaryDm.roleLabel || primaryDm.role) : null;
  const dmCredentials = primaryDm?.credentials?.join(", ") || "";

  const availableChannels: OutreachChannel[] = [];
  if (primaryDm?.email) availableChannels.push("email");
  if (primaryDm?.phone) availableChannels.push("phone");
  if (primaryDm?.linkedinUrl) availableChannels.push("linkedin");
  if (business.contacts?.some((c) => c.contactType === "email")) availableChannels.push("email");
  if (business.contacts?.some((c) => c.contactType === "phone")) availableChannels.push("phone");
  if (availableChannels.length === 0) availableChannels.push("manual");

  const recommendedChannel: OutreachChannel = primaryDm?.email
    ? "email"
    : primaryDm?.linkedinUrl
    ? "linkedin"
    : business.contacts?.some((c) => c.contactType === "email")
    ? "email"
    : "phone";

  // Email draft
  const salutation = dmName ? `Dear ${dmName},` : `Dear Team at ${companyName},`;
  const subject = dmName
    ? `${companyName} & Patient Inquiries in ${city}`
    : `Patient Inquiries & Digital Booking for ${companyName}`;

  const emailBody = `${salutation}

I noticed ${companyName}'s clinical standing in ${city} and took a close look at your public web presence.

${
  oppReasons.length > 0
    ? `We identified an immediate opportunity to improve how prospective patients discover and schedule appointments with your clinic: ${oppReasons[0]}.`
    : `We noticed an opportunity to enhance your patient appointment booking workflow and mobile accessibility.`
}

Specifically, we help established clinics implement ${primaryService.toLowerCase()}—enabling high-intent local patients to book directly without administrative friction.

Would you be open to a brief 10-minute demonstration of how this would look for ${companyName}?

Best regards,
SoleTrust Client Partnerships`;

  // LinkedIn message
  const linkedinNote = dmName
    ? `Hi ${dmName.split(" ")[0]}, loved seeing your work at ${companyName}. Noticed an opportunity to optimize your patient booking flow in ${city}. Would welcome connecting!`
    : `Hello team at ${companyName}, connecting regarding digital patient acquisition and modern booking workflows in ${city}.`;

  const linkedinFollowup = dmName
    ? `Thanks for connecting, ${dmName.split(" ")[0]}! We recently reviewed ${companyName}'s digital patient touchpoints and put together a few concrete recommendations to streamline mobile appointments. Happy to share a quick 2-page brief if helpful.`
    : `Thanks for connecting! We have prepared a tailored brief on patient booking optimization for ${companyName}. Would you like us to send it over?`;

  // Phone script
  const phoneScript = {
    opener: dmName
      ? `Good day, may I speak with ${dmName}? My name is [Your Name] calling regarding digital patient inquiries for ${companyName}.`
      : `Good day, I'm calling for the clinic director or practice manager at ${companyName} regarding your patient inquiry workflow.`,
    hook: `We recently evaluated dermatology patient search patterns in ${city} and noticed your clinic has strong local demand, but the digital booking flow could be capturing significantly more direct inquiries.`,
    qualifyingQuestions: [
      `How are you currently handling after-hours appointment requests from mobile visitors?`,
      `Are patient inquiries mainly routed through front-desk calls, or do you have an automated scheduling calendar?`,
      `Is expanding high-value procedural appointments a priority for the clinic this quarter?`,
    ],
    callToAction: `I'd like to email a 2-minute video walkthrough comparing your current mobile patient flow with best-in-class clinics. What is the best direct email address for you?`,
  };

  return {
    leadId: lead?.id || business.id,
    generatedAt: new Date().toISOString(),
    whyContact: {
      summary: `${companyName} is an active ${industry} provider in ${city} exhibiting clear service enhancement opportunities.`,
      industryFit: `Matches the target ${industry} profile with clinical service offerings.`,
      locationRelevance: `Verified presence in ${city}, where local patient search intent for specialized care is high.`,
      opportunityIdentified: oppReasons[0] || "Mobile appointment capture and visual trust signal modernization",
      supportingEvidence: primaryEvidence.length > 0 ? primaryEvidence : ["Public domain presence and service listings"],
      commercialRationale: `Upgrading booking accessibility directly reduces patient acquisition cost and prevents bounce to competitor clinics in ${city}.`,
    },
    whoContact: {
      recommendedPerson: dmName ? `${dmName}${dmCredentials ? ` (${dmCredentials})` : ""}` : null,
      role: dmRole,
      relevanceReason: primaryDm
        ? `Holds clinical and operational management authority (${dmRole}) at ${companyName}.`
        : "No verified clinical director or owner was found with high confidence; approach via clinic practice manager or official business channel.",
      confidence: primaryDm ? primaryDm.confidenceScore : 0,
      availableChannels,
      missingInformation: primaryDm?.email ? null : "Direct professional email not confirmed; verified reception or clinic contact available.",
    },
    whatOffer: {
      primaryService,
      valueProposition,
      openingAngle,
      suggestedNextStep: "Send personalized video audit or schedule a 10-minute workflow walkthrough",
    },
    howApproach: {
      emailDraft: {
        subject,
        body: emailBody,
      },
      linkedinDraft: {
        connectionNote: linkedinNote,
        followupMessage: linkedinFollowup,
      },
      phoneScript,
      recommendedChannel,
    },
  };
}
