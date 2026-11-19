import type { Business } from "../types/business.ts";
import type { CrmLead } from "../types/lead.ts";
import type { CrawledPageIntel } from "../enrichment/crawler.ts";
import type { OsintResolvedEntity } from "../enrichment/osint-resolver.ts";

export interface BehavioralAudit {
  whyToReachOut: string[];
  concreteFindings: {
    missingPixel: boolean;
    missingBookingFlow: boolean;
    outdatedCopyright: boolean;
    copyrightYear: number | null;
    weakMobileSpeed: boolean;
  };
  primaryOpeningAngle: string;
}

export interface ChannelRank {
  channel: "whatsapp" | "instagram" | "linkedin" | "email" | "phone";
  priority: number;
  label: string;
  targetAddressOrHandle: string;
  rationale: string;
}

export interface OptimalTimingWindow {
  timezone: string;
  bestDays: string[];
  bestTimeLocal: string;
  industryRhythmExplanation: string;
}

export interface MultichannelOutreachSuite {
  leadId: string;
  businessName: string;
  decisionMakerName: string | null;
  decisionMakerRole: string | null;
  audit: BehavioralAudit;
  timing: OptimalTimingWindow;
  rankedChannels: ChannelRank[];
  primaryChannel: "whatsapp" | "instagram" | "linkedin" | "email" | "phone";
  emailSequence: {
    touch1: { subject: string; body: string };
    touch2: { subject: string; body: string };
    touch3: { subject: string; body: string };
  };
  whatsAppVoiceNote: {
    durationEst: string;
    script: string;
    quickTwoLineOpener: string;
  };
  instagramDmScript: {
    referenceHook: string;
    dmMessage: string;
  };
  linkedinOutreach: {
    connectionNote: string;
    followupMessage: string;
  };
  phoneBattlecard: {
    opener: string;
    hook: string;
    qualifyingQuestions: string[];
    objectionHandlers: Record<string, string>;
    callToAction: string;
  };
}

const CITY_TIMEZONES: Record<string, string> = {
  sydney: "Australia/Sydney",
  melbourne: "Australia/Melbourne",
  brisbane: "Australia/Brisbane",
  perth: "Australia/Perth",
  shanghai: "Asia/Shanghai",
  beijing: "Asia/Shanghai",
  shenzhen: "Asia/Shanghai",
  guangzhou: "Asia/Shanghai",
  "new york": "America/New_York",
  nyc: "America/New_York",
  losangeles: "America/Los_Angeles",
  chicago: "America/Chicago",
  london: "Europe/London",
  munich: "Europe/Berlin",
  berlin: "Europe/Berlin",
  tokyo: "Asia/Tokyo",
  delhi: "Asia/Kolkata",
  mumbai: "Asia/Kolkata",
  vadodara: "Asia/Kolkata",
  ahmedabad: "Asia/Kolkata",
  dubai: "Asia/Dubai",
  toronto: "America/Toronto",
};

/**
 * Infer primary IANA timezone from location
 */
export function resolveLocationTimezone(city?: string | null, country?: string | null): string {
  const c = (city || "").toLowerCase().trim();
  const co = (country || "").toLowerCase().trim();

  if (c && CITY_TIMEZONES[c]) return CITY_TIMEZONES[c];
  if (co.includes("australia") || co === "au") return "Australia/Sydney";
  if (co.includes("china") || co === "cn") return "Asia/Shanghai";
  if (co.includes("united kingdom") || co === "uk") return "Europe/London";
  if (co.includes("germany") || co === "de") return "Europe/Berlin";
  if (co.includes("japan") || co === "jp") return "Asia/Tokyo";
  if (co.includes("united states") || co === "us" || co === "usa") return "America/New_York";
  if (co.includes("india") || co === "in") return "Asia/Kolkata";
  if (co.includes("uae") || co.includes("emirates")) return "Asia/Dubai";

  return "UTC";
}

/**
 * Outreach Brain Engine:
 * Generates WHY, WHERE, WHEN, and HOW behavioral sales intelligence
 */
export function generateOutreachBrainSuite(
  business: Business,
  lead?: CrmLead,
  crawlIntel?: CrawledPageIntel | null,
  osintIntel?: OsintResolvedEntity | null
): MultichannelOutreachSuite {
  const companyName = business.canonicalName || "Target Business";
  const industry = (business.industry || "").toLowerCase();
  const city = business.city || "Target Market";
  const timezone = resolveLocationTimezone(business.city, business.country);

  // Decision Maker identification
  const primaryDm = business.decisionMakers?.find(
    (d) => d.verificationStatus === "verified" || d.verificationStatus === "partially_verified"
  ) || business.decisionMakers?.[0];

  const dmName = osintIntel?.personName || primaryDm?.fullName || (primaryDm as unknown as { name?: string })?.name || lead?.primaryDecisionMakerName || null;
  const dmRole = osintIntel?.role || primaryDm?.roleLabel || (primaryDm as unknown as { role?: string })?.role || lead?.primaryDecisionMakerRole || "Managing Director";

  const isDtc = /d2c|dtc|d to c|ecommerce|e-commerce|consumer brand|apparel|clothing|fashion|lifestyle brand|footwear|accessories|skincare/i.test(industry);
  const isSupermarketRetail = !isDtc && /supermarket|grocery|retail|food|f&b|market|store/i.test(industry);
  const isAutomotive = !isDtc && /\b(auto|car|dealer|motor|vehicle|showroom)\b/i.test(industry);
  const isMedical = !isDtc && /\b(clinic|doctor|dentist|dental|dermatolog|health|hospital)\b/i.test(industry);

  // 1. WHY TO MESSAGE (Behavioral Audit)
  const whyReasons: string[] = [];
  const findings = {
    missingPixel: false,
    missingBookingFlow: false,
    outdatedCopyright: false,
    copyrightYear: crawlIntel?.auditSignals?.copyrightYear || null,
    weakMobileSpeed: false,
  };

  if (crawlIntel?.auditSignals) {
    if (!crawlIntel.auditSignals.hasMetaPixel && isDtc) {
      findings.missingPixel = true;
      whyReasons.push("Missing Meta / Ad tracking pixel, indicating lost retargeting ROI on paid acquisition traffic");
    }
    if (!crawlIntel.auditSignals.hasBookingEngine && (isMedical || isAutomotive)) {
      findings.missingBookingFlow = true;
      whyReasons.push("Absence of sub-minute direct appointment scheduling, causing prospective customer drop-off");
    }
    if (crawlIntel.auditSignals.copyrightYear && crawlIntel.auditSignals.copyrightYear < 2024) {
      findings.outdatedCopyright = true;
      whyReasons.push(`Digital footer copyright dates back to ${crawlIntel.auditSignals.copyrightYear}, signaling unmaintained web touchpoints`);
    }
  }

  if (whyReasons.length === 0) {
    if (isDtc) {
      whyReasons.push("Mobile storefront speed optimization opportunity to lift checkout conversion rates by 25-40%");
      whyReasons.push("Interactive 3D product visualizer to lower product return rates");
    } else if (isSupermarketRetail) {
      whyReasons.push("Margin compression on legacy grocery lines; opportunity to introduce 30%+ gross margin gourmet goods");
      whyReasons.push("Guaranteed Direct-Store-Delivery (DSD) to eliminate out-of-stock cooler slots");
    } else if (isAutomotive) {
      whyReasons.push("Under-60-second inbound test drive appointment capture to prevent showroom shopper churn");
    } else {
      whyReasons.push("24/7 automated high-intent client intake to eliminate administrative booking friction");
    }
  }

  const primaryOpeningAngle = whyReasons[0];

  // 2. WHEN TO MESSAGE (Optimal Local Timing Window)
  let bestDays = ["Tuesday", "Wednesday", "Thursday"];
  let bestTimeLocal = "8:30 AM – 10:00 AM";
  let industryRhythmExplanation = "Standard B2B decision-maker window prior to morning executive meetings";

  if (isSupermarketRetail) {
    bestDays = ["Tuesday", "Wednesday", "Thursday"];
    bestTimeLocal = "2:00 PM – 4:30 PM";
    industryRhythmExplanation = "Post-lunch lull between peak morning stocking deliveries and evening shopper rush";
  } else if (isDtc) {
    bestDays = ["Monday", "Tuesday", "Thursday"];
    bestTimeLocal = "10:00 AM – 11:30 AM";
    industryRhythmExplanation = "Post-daily metrics review when founders inspect store sales velocity and ad spend";
  } else if (isMedical) {
    bestDays = ["Wednesday", "Thursday", "Friday"];
    bestTimeLocal = "1:00 PM – 2:30 PM";
    industryRhythmExplanation = "Mid-day physician changeover when doctors complete morning procedures and check correspondence";
  } else if (isAutomotive) {
    bestDays = ["Tuesday", "Wednesday"];
    bestTimeLocal = "10:30 AM – 12:00 PM";
    industryRhythmExplanation = "Post-morning sales meeting before showroom floor traffic picks up";
  }

  const timing: OptimalTimingWindow = {
    timezone,
    bestDays,
    bestTimeLocal,
    industryRhythmExplanation,
  };

  // 3. WHERE TO MESSAGE (Channel Priority Matrix)
  const rankedChannels: ChannelRank[] = [];
  const primaryPhone = lead?.primaryPhone || business.contacts?.find((c) => c.contactType === "phone")?.value || crawlIntel?.phonesFound[0] || null;
  const primaryEmail = lead?.primaryEmail || business.contacts?.find((c) => c.contactType === "email")?.value || crawlIntel?.emailsFound[0] || null;
  const primaryWa = crawlIntel?.whatsAppLinks[0] || null;
  const igHandle = osintIntel?.instagramHandle || crawlIntel?.socialProfiles.instagram || null;
  const linkedinUrl = osintIntel?.linkedinUrl || primaryDm?.linkedinUrl || crawlIntel?.socialProfiles.linkedin || null;

  // WhatsApp priority if active mobile/WhatsApp link found
  if (primaryWa || (primaryPhone && (isSupermarketRetail || isDtc))) {
    rankedChannels.push({
      channel: "whatsapp",
      priority: 1,
      label: "WhatsApp Business Direct",
      targetAddressOrHandle: primaryWa || primaryPhone || "",
      rationale: "Fastest response channel with >90% open rates for direct store directors and eCommerce founders",
    });
  }

  // Instagram if active brand / founder IG found
  if (igHandle && isDtc) {
    rankedChannels.push({
      channel: "instagram",
      priority: 2,
      label: "Instagram DM Direct",
      targetAddressOrHandle: igHandle,
      rationale: "Direct visual reference channel; founders actively manage brand DMs and reply to aesthetic audits",
    });
  }

  // LinkedIn if decision maker profile verified
  if (linkedinUrl) {
    rankedChannels.push({
      channel: "linkedin",
      priority: 3,
      label: "LinkedIn InMail / Connection",
      targetAddressOrHandle: linkedinUrl,
      rationale: "Professional credibility channel with verified career and leadership context",
    });
  }

  // Email if verified
  if (primaryEmail) {
    rankedChannels.push({
      channel: "email",
      priority: 4,
      label: "Verified Corporate Cold Email",
      targetAddressOrHandle: primaryEmail,
      rationale: "Comprehensive 3-touch written teardown with clickable visual links",
    });
  }

  // Telephone fallback
  if (primaryPhone) {
    rankedChannels.push({
      channel: "phone",
      priority: 5,
      label: "Direct Phone Call",
      targetAddressOrHandle: primaryPhone,
      rationale: "Immediate permission-based cold call battlecard with objection handling",
    });
  }

  // Sort channels by priority
  rankedChannels.sort((a, b) => a.priority - b.priority);
  const primaryChannel = rankedChannels[0]?.channel || "email";

  // 4. HOW TO MESSAGE (Multichannel Scripts)
  const firstName = dmName ? dmName.split(" ")[0] : null;
  const salutation = firstName ? `Hi ${firstName},` : `Hello ${companyName} team,`;

  // Email 3-Touch
  const touch1 = {
    subject: firstName
      ? `${companyName} — Quick teardown on customer acquisition in ${city}`
      : `Customer Acquisition & Conversion Velocity for ${companyName}`,
    body: `${salutation}

I noticed ${companyName}'s standing in ${city} and took a close look at your public storefront touchpoints.

Specifically, we noticed an immediate opportunity to improve how prospective buyers engage: ${primaryOpeningAngle}.

We help companies in your space implement sub-second mobile conversion architecture—enabling customers to complete transactions without friction.

Would you be open to a 2-minute visual teardown walk-through this week?

Best regards,
SoleTrust Client Partnerships`,
  };

  const touch2 = {
    subject: `Re: ${touch1.subject}`,
    body: `${salutation}

Following up on my note earlier this week regarding ${companyName}'s customer acquisition flow.

To give you quick context: when businesses implement this architecture, they typically see a 25–40% reduction in mobile drop-off without increasing ad spend.

We prepared a 2-minute visual teardown comparing your current user journey with top performers in your market.

Would you prefer I send the short video link over, or would a brief 10-minute walkthrough suit you better?

Best regards,
SoleTrust Client Partnerships`,
  };

  const touch3 = {
    subject: `Closing the loop on ${companyName}`,
    body: `${salutation}

I haven't heard back, so I assume optimizing customer conversion flow for ${companyName} isn't a priority right now—which is completely fine.

I will close your file for now so I don't crowd your inbox.

If you ever decide to revisit streamlining ${primaryOpeningAngle}, feel free to reach back out anytime.

Wishing ${companyName} continued growth!

Best regards,
SoleTrust Client Partnerships`,
  };

  // WhatsApp Scripts
  const whatsAppVoiceNote = {
    durationEst: "28 seconds",
    script: `"Hey ${firstName || "there"}, this is [Your Name] from SoleTrust. I was taking a look at ${companyName} in ${city}—really love what you've built. I noticed a quick mobile conversion friction point on your storefront that's likely costing you checkout orders each week. Put together a quick 90-second video walkthrough showing how to fix it. Let me know if you want me to drop the link here!"`,
    quickTwoLineOpener: firstName
      ? `Hi ${firstName}, noticed ${companyName}'s strong standing in ${city}. Put together a quick 2-min teardown on optimizing your mobile conversion flow. Open to checking it out?`
      : `Hello team at ${companyName}, put together a brief 2-min video on mobile inquiry optimization for ${city} businesses. Open to taking a quick look?`,
  };

  // Instagram DM Script
  const instagramDmScript = {
    referenceHook: `Loved your recent post showcasing ${companyName}'s collection.`,
    dmMessage: firstName
      ? `Hey ${firstName}! Love what you're doing with ${companyName}. Quick question—are you guys running custom headless checkout or standard Shopify? Noticed a 2-second lag on mobile checkout that might be leaking conversions. Put together a 90-second teardown for you if you're open to seeing it!`
      : `Hey team! Big fans of ${companyName}. Noticed an opportunity to speed up your mobile checkout flow by over 50%. Happy to send over a 2-minute visual breakdown if helpful!`,
  };

  // LinkedIn Notes
  const linkedinOutreach = {
    connectionNote: firstName
      ? `Hi ${firstName}, loved seeing your leadership at ${companyName}. Noticed an opportunity to optimize your customer conversion flow in ${city}. Would welcome connecting!`
      : `Hello team at ${companyName}, connecting regarding customer acquisition and modern booking workflows in ${city}.`,
    followupMessage: firstName
      ? `Thanks for connecting, ${firstName}! We recently reviewed ${companyName}'s digital touchpoints and put together a few concrete recommendations to streamline mobile inquiries. Happy to share a quick 2-page brief if helpful.`
      : `Thanks for connecting! We have prepared a tailored brief on customer inquiry optimization for ${companyName}. Would you like us to send it over?`,
  };

  // Phone Battlecard
  const phoneBattlecard = {
    opener: firstName
      ? `Good day, may I speak with ${firstName}? My name is [Your Name] calling regarding customer inquiry flow for ${companyName}.`
      : `Good day, I'm calling for the general manager or business owner at ${companyName} regarding your customer inquiry workflow.`,
    hook: `We recently evaluated local customer search patterns in ${city} and noticed your business has strong local demand, but the digital inquiry flow could be capturing significantly more direct bookings.`,
    qualifyingQuestions: [
      `How are you currently handling after-hours inquiry requests from mobile visitors?`,
      `Are inquiries mainly routed through phone calls, or do you have an automated scheduling engine?`,
      `Is expanding high-value customer acquisition a priority this quarter?`,
    ],
    objectionHandlers: {
      "Already have a provider or agency": `Totally respect that—most established businesses do. We don't ask you to replace them; we specialize in deep technical conversion architecture and sub-second performance audits that work alongside your current team.`,
      "No budget or not right now": `Completely understand. Timing is everything. We aren't asking for an engagement today—just sharing our 2-minute market teardown so your team has the data when planning upcoming quarters.`,
      "Just send an email": `Will do right away. What is your direct email address so I ensure the 2-minute walkthrough reaches your personal inbox rather than a spam filter?`,
    },
    callToAction: `I'd like to email a 2-minute video walkthrough comparing your current mobile flow with top performers in your market. What is the best direct email address for you?`,
  };

  return {
    leadId: lead?.id || business.id,
    businessName: companyName,
    decisionMakerName: dmName,
    decisionMakerRole: dmRole,
    audit: {
      whyToReachOut: whyReasons,
      concreteFindings: findings,
      primaryOpeningAngle,
    },
    timing,
    rankedChannels,
    primaryChannel,
    emailSequence: { touch1, touch2, touch3 },
    whatsAppVoiceNote,
    instagramDmScript,
    linkedinOutreach,
    phoneBattlecard,
  };
}
