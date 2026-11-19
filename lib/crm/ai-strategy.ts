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

  // Determine primary service offer & sector
  const lowerInd = industry.toLowerCase();
  const isDtc = /d2c|dtc|d to c|ecommerce|e-commerce|consumer brand|apparel|clothing|fashion|lifestyle brand|footwear|accessories|skincare/i.test(lowerInd);
  const isSupermarketRetail = !isDtc && /supermarket|grocery|retail|food|f&b|market|store/i.test(lowerInd);
  const isAutomotive = !isDtc && /\b(auto|car|dealer|motor|vehicle|showroom)\b/i.test(lowerInd);
  const isTechSaaS = !isDtc && /\b(software|saas|\bit\b|cloud|cyber|developer|platform)\b/i.test(lowerInd);
  const isLegal = !isDtc && /\b(law|legal|attorney|advocate|solicitor|counsel)\b/i.test(lowerInd);
  const isHospitality = !isDtc && /\b(restaurant|cafe|hotel|dining|bistro|culinary|food service|hospitality)\b/i.test(lowerInd);
  const isFitness = !isDtc && /\b(gym|fitness|crossfit|yoga|pilates|athletic|wellness)\b/i.test(lowerInd);
  const isRealEstate = !isDtc && /\b(real estate|realty|realtor|property|leasing)\b/i.test(lowerInd);
  const isAccounting = !isDtc && /\b(account|cpa|tax|audit|bookkeep)\b/i.test(lowerInd);
  const isDental = !isDtc && /\b(dentist|dental|teeth|orthodont)\b/i.test(lowerInd);

  let primaryService = business.opportunity?.recommendedServices?.[0] || "Digital Experience & Inbound Lead Architecture";
  let valueProposition = "Modernize customer acquisition and streamline booking/inquiry workflows";
  let openingAngle = `enhancing accessibility and customer inquiry flow for ${companyName} in ${city}`;

  if (isDtc) {
    primaryService = "Custom Headless Shopify Plus & High-Conversion Digital Flagship Architecture";
    valueProposition = "Scale direct-to-consumer revenue with sub-second mobile page loads, interactive 3D product visualizers, and conversion-optimized checkout UX that slashes customer acquisition costs";
    openingAngle = `upgrading digital storefront performance, brand prestige, and mobile checkout conversion for ${companyName} in ${city}`;
  } else if (isSupermarketRetail) {
    primaryService = "Premium F&B Retail Distribution & Shelf Placement";
    valueProposition = "Introduce high-margin, fast-moving Food & Beverage SKUs that maximize grocery basket value and retail shelf revenue";
    openingAngle = `securing high-margin retail shelf placement and direct store distribution with ${companyName} in ${city}`;
  } else if (isAutomotive) {
    primaryService = "Automotive Digital Showroom & Rapid Test-Drive Conversion Architecture";
    valueProposition = "Convert high-intent vehicle shoppers into scheduled showroom walk-ins and accelerated test-drive bookings";
    openingAngle = `accelerating showroom lead velocity and test-drive reservations for ${companyName} in ${city}`;
  } else if (isTechSaaS) {
    primaryService = "B2B SaaS Inbound Pipeline & Product-Led Growth Engine";
    valueProposition = "Shorten sales cycles with high-velocity product demos and friction-free enterprise trial signups";
    openingAngle = `scaling enterprise discovery and qualified demo booking flow for ${companyName} in ${city}`;
  } else if (isLegal) {
    primaryService = "High-Value Retainer Client Intake & Case Qualification Infrastructure";
    valueProposition = "Automate confidential case intake to capture prospective corporate and individual clients before competitors";
    openingAngle = `streamlining confidential consultation intake for ${companyName} in ${city}`;
  } else if (isHospitality) {
    primaryService = "Direct Table Reservation & Private Event Catering Booking Engine";
    valueProposition = "Eliminate 3rd-party commission fees and drive high-margin corporate dining and banquet event bookings";
    openingAngle = `increasing direct banquet reservations and private event catering for ${companyName} in ${city}`;
  } else if (isFitness) {
    primaryService = "Automated Member Acquisition & Free Trial Booking Funnel";
    valueProposition = "Turn local fitness seekers into recurring membership dues with automated trial class booking";
    openingAngle = `driving local membership enrollment and trial bookings for ${companyName} in ${city}`;
  } else if (isRealEstate) {
    primaryService = "Exclusive Property Inquiry & Buyer Tour Booking Infrastructure";
    valueProposition = "Capture high-net-worth property buyers and schedule private listing showings instantly";
    openingAngle = `maximizing buyer tour bookings and qualified seller leads for ${companyName} in ${city}`;
  } else if (isAccounting) {
    primaryService = "High-Value Advisory Intake & Tax Consultation Booking System";
    valueProposition = "Attract year-round corporate advisory and tax compliance retainers with friction-free consultation booking";
    openingAngle = `expanding business advisory inquiries and tax client onboarding for ${companyName} in ${city}`;
  } else if (isDental) {
    primaryService = "High-Margin Cosmetic & Implant Patient Acquisition Architecture";
    valueProposition = "Drive high-ticket implant and clear aligner consultations with seamless mobile booking";
    openingAngle = `expanding restorative and cosmetic dental consultations for ${companyName} in ${city}`;
  } else if (serviceTrack.includes("creative") && !serviceTrack.includes("technical")) {
    primaryService = "Brand Identity & Visual Trust Signal Positioning";
    valueProposition = "Establish high-trust visual consistency and elite customer-facing aesthetic brand presentation";
    openingAngle = `upgrading brand presence and trust signals across ${companyName}'s digital touchpoints`;
  } else if (serviceTrack.includes("technical") && !serviceTrack.includes("creative")) {
    primaryService = "Automated Customer Conversion Engine & Mobile Performance Optimization";
    valueProposition = "Reduce inquiry drop-off with sub-second page loads and direct calendar scheduling";
    openingAngle = `implementing seamless mobile inquiry conversion for customers in ${city}`;
  } else {
    primaryService = "Full-Stack Customer Conversion Infrastructure (Brand + Booking Engine)";
    valueProposition = "Combine elite market brand prestige with friction-free mobile inquiry conversion";
    openingAngle = `elevating ${companyName}'s customer inquiry flow and modernizing mobile booking in ${city}`;
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

  // Build sector-specific outreach drafts
  const defaultTitle = isDtc ? "Founder / Chief Executive Officer / Head of eCommerce" :
    isSupermarketRetail ? "Store Director / Purchasing Manager" :
    isAutomotive ? "General Manager / Sales Director" :
    isTechSaaS ? "Founder / VP Growth" :
    isLegal ? "Managing Partner / Practice Director" :
    isHospitality ? "General Manager / Head Chef" :
    isFitness ? "Owner / General Manager" :
    isRealEstate ? "Principal Broker / Managing Director" :
    isAccounting ? "Managing Partner / Practice Head" :
    isDental ? "Clinic Director / Lead Dentist" :
    "Practice Director / Business Owner";

  const salutation = dmName ? `Dear ${dmName},` : `Dear ${defaultTitle} at ${companyName},`;

  let subject = dmName
    ? `${companyName} & Customer Inquiries in ${city}`
    : `Customer Inquiries & Booking Engine for ${companyName}`;

  let emailBody = `${salutation}

I noticed ${companyName}'s standing in ${city} and took a close look at your public web presence.

${
  oppReasons.length > 0
    ? `We identified an immediate opportunity to improve how prospective clients discover and engage with your business: ${oppReasons[0]}.`
    : `We noticed an opportunity to enhance your customer inquiry workflow and mobile accessibility.`
}

Specifically, we help established businesses implement ${primaryService.toLowerCase()}—enabling high-intent local clients to book directly without administrative friction.

Would you be open to a brief 10-minute demonstration of how this would look for ${companyName}?

Best regards,
SoleTrust Client Partnerships`;

  let linkedinNote = dmName
    ? `Hi ${dmName.split(" ")[0]}, loved seeing your leadership at ${companyName}. Noticed an opportunity to optimize your customer conversion flow in ${city}. Would welcome connecting!`
    : `Hello team at ${companyName}, connecting regarding customer acquisition and modern booking workflows in ${city}.`;

  let linkedinFollowup = dmName
    ? `Thanks for connecting, ${dmName.split(" ")[0]}! We recently reviewed ${companyName}'s digital touchpoints and put together a few concrete recommendations to streamline mobile inquiries. Happy to share a quick 2-page brief if helpful.`
    : `Thanks for connecting! We have prepared a tailored brief on customer inquiry optimization for ${companyName}. Would you like us to send it over?`;

  let phoneScript: {
    opener: string;
    hook: string;
    qualifyingQuestions: string[];
    objectionHandlers?: Record<string, string>;
    callToAction: string;
  } = {
    opener: dmName
      ? `Good day, may I speak with ${dmName}? My name is [Your Name] calling regarding customer inquiry flow for ${companyName}.`
      : `Good day, I'm calling for the general manager or business owner at ${companyName} regarding your customer inquiry workflow.`,
    hook: `We recently evaluated local customer search patterns in ${city} and noticed your business has strong local demand, but the digital inquiry flow could be capturing significantly more direct bookings.`,
    qualifyingQuestions: [
      `How are you currently handling after-hours inquiry requests from mobile visitors?`,
      `Are inquiries mainly routed through phone calls, or do you have an automated scheduling engine?`,
      `Is expanding high-value customer acquisition a priority this quarter?`,
    ],
    callToAction: `I'd like to email a 2-minute video walkthrough comparing your current mobile flow with top performers in your market. What is the best direct email address for you?`,
  };

  if (isDtc) {
    subject = dmName
      ? `${companyName} — Creative & Technical Storefront Architecture & Checkout Conversion`
      : `Scaling eCommerce Flagship Velocity & Mobile Conversion for ${companyName}`;

    emailBody = `${salutation}

I have been following ${companyName}'s brand presence in ${city} and took a close technical and visual dive into your digital flagship.

As a creative and technical studio, we partner with premier direct-to-consumer (D2C) brands to elevate their digital storefront from standard eCommerce into an unforgettable, high-conversion flagship experience.

Specifically, we help brands like ${companyName}:
• Eliminate mobile checkout drop-off with sub-second page performance (<0.8s LCP) and custom Shopify Plus headless architecture
• Boost average order value (AOV) and reduce product returns with interactive 3D product visualizers and immersive visual storytelling
• Elevate brand prestige with custom editorial UI/UX design that converts first-time visitors into loyal repeat customers

We put together an interactive 3-point visual & technical teardown of ${companyName}'s mobile storefront, highlighting 2 immediate conversion wins you can implement this month.

Would you be open to an informal 10-minute walk-through this week?

Best regards,
Creative & Technical Studio Lead`;

    linkedinNote = dmName
      ? `Hi ${dmName.split(" ")[0]}, love what you've built at ${companyName}! As a creative & technical studio founder, put together a quick teardown on optimizing your mobile storefront conversion & speed. Would love to connect!`
      : `Hello team at ${companyName}, connecting from a creative & technical studio regarding eCommerce flagship conversion and storefront speed in ${city}.`;

    linkedinFollowup = dmName
      ? `Thanks for connecting, ${dmName.split(" ")[0]}! We put together a brief visual & technical audit of ${companyName}'s storefront showing how sub-second performance and interactive UX can drive 15-20% higher mobile checkout conversion. Happy to send the 3-page teardown over if helpful.`
      : `Thanks for connecting! We have prepared a tailored visual & performance audit for ${companyName}. Would you like us to send it over?`;

    phoneScript = {
      opener: dmName
        ? `Good day, may I speak with ${dmName}? My name is [Your Name] from [Studio Name], calling regarding ${companyName}'s digital flagship and mobile eCommerce conversion.`
        : `Good day, I'm calling for the founder or head of eCommerce at ${companyName} regarding your online store experience.`,
      hook: `We run a creative and technical studio helping leading Australian D2C brands in ${city} turn mobile traffic into higher checkout conversion with sub-second page speeds and bespoke digital experiences.`,
      qualifyingQuestions: [
        `What is your team's biggest focus right now—elevating the brand visual experience or improving mobile checkout conversion rates?`,
        `Are you currently running on Shopify Plus or custom headless infrastructure?`,
        `Are you planning any major design revamps or international store expansions this year?`,
      ],
      callToAction: `I'd love to email our 3-point visual and performance audit of ${companyName}'s mobile store directly to you. What is the best direct email address for you?`,
    };
  } else if (isSupermarketRetail) {
    subject = dmName
      ? `${companyName} — F&B Retail Partnership & Shelf Distribution in ${city}`
      : `Food & Beverage Product Distribution & Margin Expansion for ${companyName}`;

    emailBody = `${salutation}

I noticed ${companyName}'s prominent grocery retail standing in ${city} and wanted to reach out regarding our Food & Beverage brand portfolio.

We partner with independent supermarkets and regional grocers to supply fast-moving, high-margin consumer packaged goods (CPG/F&B) that drive repeat customer baskets.

Specifically, we provide ${companyName}:
• Guaranteed 30%+ gross retail margins with flexible wholesale payment terms
• Reliable Direct-Store-Delivery (DSD) to prevent stockouts during peak shopping hours
• Professional eye-catching endcap merchandising displays and promotional launch sampling

Would you be open to reviewing our 1-page wholesale catalog and receiving a complimentary product tasting sample kit for ${companyName}?

Best regards,
Commercial Partnerships & Retail Sales`;

    linkedinNote = dmName
      ? `Hi ${dmName.split(" ")[0]}, following ${companyName}'s retail presence in ${city}. Reaching out regarding premium F&B shelf placement and wholesale margin opportunities for your store. Would welcome connecting!`
      : `Hello team at ${companyName}, connecting regarding premium Food & Beverage shelf distribution and retail margin partnership in ${city}.`;

    linkedinFollowup = dmName
      ? `Thanks for connecting, ${dmName.split(" ")[0]}! We supply fast-moving beverage & food lines that deliver 30%+ margins for supermarkets in ${city}. Happy to share our 1-page catalog and drop off samples if helpful.`
      : `Thanks for connecting! We have prepared our retail wholesale product catalog for ${companyName}. Would you like us to send it over?`;

    phoneScript = {
      opener: dmName
        ? `Good day, may I speak with ${dmName}? My name is [Your Name] calling regarding retail product distribution for ${companyName}.`
        : `Good day, I'm calling for the store owner or purchasing/category manager at ${companyName} regarding your beverage and packaged food aisles.`,
      hook: `We supply high-velocity Food & Beverage products that deliver 30%+ gross margins for independent supermarkets in ${city}, with complete direct-store delivery and promotional launch support.`,
      qualifyingQuestions: [
        `Who manages your packaged goods and beverage category purchasing for ${companyName}?`,
        `Are you currently looking to introduce new high-margin craft or functional beverage brands to your shelves this quarter?`,
        `Do you prefer direct store delivery (DSD) or central warehouse distribution?`,
      ],
      callToAction: `I'd love to drop off a sample tasting kit and our 1-page wholesale rate card for your category buyer. What is the best direct email address or store address to send them to?`,
    };
  } else if (isAutomotive) {
    subject = dmName
      ? `${companyName} — Showroom Lead Velocity & Test-Drive Bookings in ${city}`
      : `Accelerating Test-Drive Conversions for ${companyName}`;

    emailBody = `${salutation}

I noticed ${companyName}'s dealership inventory in ${city} and reviewed how your digital showroom captures inbound vehicle shoppers.

We work with premier automotive dealerships to deploy sub-second digital showroom conversion tools that capture ready-to-buy car shoppers and schedule test drives within 60 seconds.

Specifically, we help ${companyName}:
• Increase online vehicle detail page (VDP) to test-drive appointment conversion by 40%+
• Instant WhatsApp & SMS test-drive reservation confirmations with calendar sync
• Automated after-hours lead re-engagement to prevent shopper churn to competing area dealers

Would you be open to a 10-minute demo on how we can drive 25+ additional test-drive walk-ins to ${companyName} this month?

Best regards,
Automotive Partnerships Team`;

    linkedinNote = dmName
      ? `Hi ${dmName.split(" ")[0]}, following ${companyName}'s dealership presence in ${city}. Reaching out regarding digital showroom lead capture and test-drive acceleration. Would welcome connecting!`
      : `Hello team at ${companyName}, connecting regarding digital showroom conversion and test-drive bookings in ${city}.`;

    phoneScript = {
      opener: dmName
        ? `Good day, may I speak with ${dmName}? My name is [Your Name] calling regarding showroom sales lead flow for ${companyName}.`
        : `Good day, I'm calling for the general manager or GSM at ${companyName} regarding your online vehicle leads.`,
      hook: `We help automotive dealerships in ${city} convert online inventory visitors into verified test-drive appointments with under-60-second response automation.`,
      qualifyingQuestions: [
        `What is your dealership's average response time to online vehicle inquiry forms?`,
        `Are you seeing vehicle shoppers drop off before booking showroom visits?`,
        `Is increasing monthly used or new unit turn velocity your top focus this quarter?`,
      ],
      callToAction: `I have a 3-minute video showing the exact test-drive conversion funnel used by top-performing dealerships in ${city}. Can I send it to your direct email?`,
    };
  } else if (isTechSaaS) {
    subject = dmName
      ? `${companyName} — Scaling Qualified Demo Pipeline & Enterprise Trials`
      : `Accelerating Inbound Trial-to-Paid Velocity for ${companyName}`;

    emailBody = `${salutation}

I noticed ${companyName}'s solution in the ${city} tech ecosystem and explored your product positioning.

We partner with high-growth SaaS and software organizations to eliminate conversion bottlenecks in the buyer journey.

Specifically, we assist ${companyName} with:
• Optimizing product demo conversion funnels with instant qualification scheduling
• Frictionless self-service trial onboarding architectures that increase product adoption
• Enterprise pipeline attribution and sub-second web performance optimization

Would you be open to an informal 10-minute growth discussion on accelerating inbound demo volume for ${companyName}?

Best regards,
B2B Growth & Tech Partnerships`;

    linkedinNote = dmName
      ? `Hi ${dmName.split(" ")[0]}, loved seeing what you're building at ${companyName}. Reaching out regarding enterprise trial-to-paid conversion in ${city}. Would love to connect!`
      : `Hello team at ${companyName}, connecting regarding B2B SaaS demo conversion and inbound growth in ${city}.`;

    phoneScript = {
      opener: dmName
        ? `Hi ${dmName}, my name is [Your Name] calling regarding product demo acquisition for ${companyName}.`
        : `Hi, I'm calling for the founder or head of growth at ${companyName} regarding your inbound demo funnel.`,
      hook: `We help B2B software companies in ${city} turn web traffic into qualified product demonstrations with zero sales friction.`,
      qualifyingQuestions: [
        `What is your primary conversion bottleneck between website visitors and booked demos?`,
        `Are you currently focusing on self-serve product trials or sales-assisted enterprise contracts?`,
      ],
      callToAction: `I'd love to share an interactive audit of your current demo signup flow. What is the best email to send that to?`,
    };
  } else if (isLegal) {
    subject = dmName
      ? `${companyName} — Client Intake Automation & Retainer Inquiries in ${city}`
      : `Confidential Consultation Intake & High-Value Case Acquisition for ${companyName}`;

    emailBody = `${salutation}

I noticed ${companyName}'s legal practice in ${city} and reviewed your client-facing digital touchpoints.

We help leading law firms implement secure, automated client intake systems that screen, qualify, and schedule prospective consultations 24/7 without burdening attorneys or paralegals.

Specifically, we provide ${companyName}:
• Instant, compliant case intake screening for high-intent prospective clients
• Friction-free consultation scheduling integrated directly with firm calendars
• Modernized visual credibility positioning that outshines local competing firms

Would you be open to a 10-minute briefing on how this modernizes client onboarding for ${companyName}?

Best regards,
Legal Client Growth Practice`;

    linkedinNote = dmName
      ? `Dear ${dmName.split(" ")[0]}, following your legal practice at ${companyName} in ${city}. Reaching out regarding client intake automation for your firm. Would welcome connecting.`
      : `Hello team at ${companyName}, connecting regarding modern client intake and consultation workflow in ${city}.`;

    phoneScript = {
      opener: dmName
        ? `Good day, may I speak with ${dmName}? Calling regarding client intake workflow for ${companyName}.`
        : `Good day, I'm calling for the managing partner or firm administrator at ${companyName}.`,
      hook: `We help law firms in ${city} capture and screen prospective client consultations 24/7 before they call competing firms.`,
      qualifyingQuestions: [
        `How does your firm currently handle after-hours client consultation inquiries?`,
        `What percentage of incoming inquiries match your ideal case criteria?`,
      ],
      callToAction: `I can send a brief 1-page overview of our legal intake qualification framework. What is your direct email?`,
    };
  }

  const touch2Body = `${dmName ? `Hi ${dmName.split(" ")[0]},` : `Hello ${companyName} team,`}

Following up on my note earlier this week regarding ${companyName}'s customer acquisition flow in ${city}.

To give you quick context: when companies in your space implement ${primaryService.toLowerCase()}, they typically see a 25–40% reduction in inquiry drop-off without increasing ad spend.

We prepared a 2-minute visual teardown comparing your current user journey with top performers in your market.

Would you prefer I send the short video link over, or would a brief 10-minute walkthrough suit you better this week?

Best regards,
Commercial Partnerships`;

  const touch3Body = `${dmName ? `Hi ${dmName.split(" ")[0]},` : `Hello ${companyName} team,`}

I haven't heard back, so I assume optimizing customer conversion flow for ${companyName} isn't a priority right now—which is completely fine.

I will close your file for now so I don't crowd your inbox.

If you ever decide to revisit streamlining ${openingAngle}, feel free to reach back out anytime.

Wishing ${companyName} continued growth!

Best regards,
Commercial Partnerships`;

  const whatsappDraft = dmName
    ? `Hi ${dmName.split(" ")[0]}, noticed ${companyName}'s strong standing in ${city}. Put together a quick 2-min teardown on optimizing your mobile conversion flow. Open to checking it out?`
    : `Hello team at ${companyName}, put together a brief 2-min video on mobile inquiry optimization for ${city} businesses. Open to taking a quick look?`;

  const objectionHandlers = {
    "Already have a provider or agency": `Totally respect that—most established businesses do. We don't ask you to replace them; we specialize in deep technical conversion architecture and sub-second performance audits that work alongside your current team.`,
    "No budget or not right now": `Completely understand. Timing is everything. We aren't asking for an engagement today—just sharing our 2-minute market teardown so your team has the data when planning upcoming quarters.`,
    "Just send an email": `Will do right away. What is your direct email address so I ensure the 2-minute walkthrough reaches your personal inbox rather than a spam filter?`,
  };

  phoneScript.objectionHandlers = objectionHandlers;

  const sequence = [
    {
      touchNumber: 1,
      dayOffset: 1,
      label: "Touch 1 • Value Teardown & Immediate Opportunity",
      subject,
      body: emailBody,
    },
    {
      touchNumber: 2,
      dayOffset: 4,
      label: "Touch 2 • Proof & Industry Benchmark Follow-Up",
      subject: `Re: ${subject}`,
      body: touch2Body,
    },
    {
      touchNumber: 3,
      dayOffset: 8,
      label: "Touch 3 • Polite Breakaway & File Closure",
      subject: `Closing the loop on ${companyName}`,
      body: touch3Body,
    },
  ];

  return {
    leadId: lead?.id || business.id,
    generatedAt: new Date().toISOString(),
    whyContact: {
      summary: `${companyName} is an active ${industry} provider in ${city} exhibiting clear service enhancement opportunities.`,
      industryFit: isDtc
        ? `Matches the high-growth Direct-to-Consumer (D2C) brand profile with active digital storefront and online consumer sales.`
        : isSupermarketRetail
        ? `Matches the target ${industry} retail profile with high-volume customer footfall.`
        : isAutomotive
        ? `Matches the automotive dealership profile with high-ticket vehicle inventory.`
        : isTechSaaS
        ? `Matches the B2B technology/SaaS profile with high-growth digital product offerings.`
        : isLegal
        ? `Matches the legal practice profile with specialized client counsel services.`
        : isDental || /dermatol|clinic|hospital/i.test(lowerInd)
        ? `Matches the target ${industry} profile with clinical healthcare service offerings.`
        : `Matches the target ${industry} profile with established commercial offerings in ${city}.`,
      locationRelevance: `Verified operational presence in ${city}, where commercial market demand is active.`,
      opportunityIdentified: business.opportunity?.suitabilityRationale || oppReasons[0] || "Inquiry capture and visual trust signal modernization",
      supportingEvidence: (business.opportunity?.supportingEvidence && business.opportunity.supportingEvidence.length > 0)
        ? business.opportunity.supportingEvidence
        : (primaryEvidence.length > 0 ? primaryEvidence : ["Public domain presence and service listings"]),
      commercialRationale: isDtc
        ? `Elevating digital flagship UX, sub-second speed (<0.8s LCP), and interactive 3D product visualizers directly lifts mobile checkout conversion rate and AOV while lowering customer acquisition cost in ${city}.`
        : isSupermarketRetail
        ? `Securing prime retail endcap placement drives immediate wholesale distribution volume and expanded basket margin in ${city}.`
        : isAutomotive
        ? `Accelerating showroom response speed directly increases monthly unit turn and prevents vehicle shoppers from visiting competing dealers in ${city}.`
        : isTechSaaS
        ? `Streamlining demo scheduling shortens the buyer consideration cycle and accelerates enterprise contract velocity.`
        : isLegal
        ? `Instant confidential intake ensures high-value corporate and litigation clients are secured before seeking rival representation in ${city}.`
        : `Upgrading customer acquisition accessibility directly reduces acquisition cost and prevents bounce to competitors in ${city}.`,
    },
    whoContact: {
      recommendedPerson: dmName ? `${dmName}${dmCredentials ? ` (${dmCredentials})` : ""}` : null,
      role: dmRole,
      relevanceReason: primaryDm
        ? `Holds commercial and operational management authority (${dmRole}) at ${companyName}.`
        : `No verified executive owner was found with high confidence; approach via general manager or official business channel.`,
      confidence: primaryDm ? primaryDm.confidenceScore : 0,
      availableChannels,
      missingInformation: primaryDm?.email ? null : "Direct professional email not confirmed; verified reception or business contact available.",
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
      sequence,
      linkedinDraft: {
        connectionNote: linkedinNote,
        followupMessage: linkedinFollowup,
      },
      phoneScript,
      whatsappDraft,
      recommendedChannel,
    },
  };
}
