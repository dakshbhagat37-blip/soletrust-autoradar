export type ServiceTrack = "creative+technical" | "technical" | "creative" | string;

export interface UserBusinessProfile {
  businessName?: string;
  skills: string[];
  serviceOrProductDescription: string;
  pricingModel?: string;
  targetGeography?: string;
  capacityPerMonth?: number;
  idealClientTypes?: string[];
}

export interface IdealCustomerProfile {
  id: string;
  rank: number;
  title: string;
  industry: string;
  subNiche: string;
  targetGeography: string;
  companySize: string;
  decisionMakerTitles: string[];
  primaryPainPoints: string[];
  buyingTriggers: string[];
  estimatedDealSize: string;
  conversionProbability: number; // 0-100%
  serviceTrack: ServiceTrack;
  searchQueryPrompt: string;
  openingAngle: string;
}

export interface BusinessStrategyAnalysis {
  businessName: string;
  positioning: string;
  coreOfferStructure: {
    primaryOffer: string;
    deliverables: string[];
    suggestedPricing: string;
    marginTier: "High Margin (70-90%)" | "Scale Margin (50-70%)" | "Volume Margin (30-50%)";
    valueProposition: string;
  };
  icps: [IdealCustomerProfile, IdealCustomerProfile, IdealCustomerProfile];
  generatedAt: string;
}

/**
 * In-House Business & ICP Strategist Engine
 * Analyzes raw business input and generates positioning, high-margin service packaging,
 * and 3 prioritized Ideal Customer Profiles with 1-click AutoRadar search queries.
 */
export function analyzeBusinessAndGenerateIcps(profile: UserBusinessProfile): BusinessStrategyAnalysis {
  const desc = (profile.serviceOrProductDescription || "").toLowerCase();
  const skillsStr = (profile.skills || []).join(" ").toLowerCase();
  const combined = `${desc} ${skillsStr}`;
  const geo = profile.targetGeography?.trim() || "United States";
  const bName = profile.businessName?.trim() || "SoleTrust Partner";

  const isStudioCreative = /creative|design|studio|branding|ui|ux|development|technical studio|web|shopify|headless/i.test(combined);
  const isFoodBeverage = /food|beverage|f&b|snack|drink|supermarket|grocery|distribution|cpg|wholesale/i.test(combined);
  const isAutomotive = /auto|car|dealership|fleet|vehicle|motor|mechanic/i.test(combined);
  const isLegal = /law|legal|attorney|lawyer|chambers|counsel/i.test(combined);
  const isHealthMedical = /health|medical|clinic|doctor|dermatolog|dental|dentist|patient/i.test(combined);
  const isTechSaaS = /saas|software|platform|b2b tech|cloud|developer tool/i.test(combined);

  if (isFoodBeverage) {
    return {
      businessName: bName,
      positioning: "High-Velocity Specialty Food & Beverage Wholesale & DSD Distribution Partner",
      coreOfferStructure: {
        primaryOffer: "Exclusive Regional Retail Shelf Distribution & High-Margin Wholesale Placement",
        deliverables: [
          "Direct-Store-Delivery (DSD) guaranteed stock fulfillment",
          "30%+ gross margin wholesale rate cards for regional buyers",
          "Custom in-store endcap displays and tasting launch promotion kits",
          "Automated electronic data interchange (EDI) restock replenishment",
        ],
        suggestedPricing: profile.pricingModel || "$1,500 - $8,000 initial stocking order + reorders",
        marginTier: "High Margin (70-90%)",
        valueProposition: "Deliver fast-turning, high-margin gourmet, specialty, and functional food lines that drive repeat basket sizes with zero distributor stockouts.",
      },
      icps: [
        {
          id: "icp-1-supermarket-chains",
          rank: 1,
          title: "Independent & Regional Supermarket Groups",
          industry: "Supermarkets & Grocery Retail",
          subNiche: "Multi-Location Regional Grocers & Gourmet Markets",
          targetGeography: geo,
          companySize: "10-250 employees / 2-20 locations",
          decisionMakerTitles: ["Store Director", "Purchasing Manager", "Category Buyer (Beverage & Snacks)", "Owner"],
          primaryPainPoints: [
            "Low retail margins on legacy brand name groceries",
            "Frequent stockouts from national broadline distributors",
            "Slow adoption of trending high-margin functional beverages",
          ],
          buyingTriggers: [
            "Quarterly aisle resets looking for differentiated local products",
            "High customer demand for premium / organic / artisanal goods",
          ],
          estimatedDealSize: "$4,000 - $15,000 / month recurring inventory",
          conversionProbability: 88,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find supermarket and grocery store owners in ${geo} for retail food distribution`,
          openingAngle: "introducing high-velocity 30%+ margin specialty food lines with guaranteed direct-store delivery",
        },
        {
          id: "icp-2-specialty-organic-markets",
          rank: 2,
          title: "Premium Specialty & Organic Food Emps",
          industry: "Specialty Food Retail",
          subNiche: "Artisanal Delis, Natural Foods, & Health Grocers",
          targetGeography: geo,
          companySize: "5-30 employees / 1-3 flagship stores",
          decisionMakerTitles: ["Store Owner", "General Manager", "Head Buyer"],
          primaryPainPoints: [
            "Need for unique craft products unavailable in big-box retail",
            "High minimum order quantities (MOQs) from giant wholesale houses",
          ],
          buyingTriggers: [
            "Expanding specialty shelf space for local craft food products",
          ],
          estimatedDealSize: "$2,500 - $6,000 / month",
          conversionProbability: 82,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find specialty food market and organic grocery owners in ${geo} for product placement`,
          openingAngle: "supplying low-MOQ premium craft products tailored to health-conscious local shoppers",
        },
        {
          id: "icp-3-convenience-high-footfall",
          rank: 3,
          title: "Urban Convenience & High-Footfall Retailers",
          industry: "Convenience Retail",
          subNiche: "Boutique Convenience & Express Marts",
          targetGeography: geo,
          companySize: "5-50 employees / multiple urban transit hubs",
          decisionMakerTitles: ["Operations Director", "Purchasing Manager", "Proprietor"],
          primaryPainPoints: [
            "Maximum revenue per square foot constraint",
            "Impulse grab-and-go grab rate optimization",
          ],
          buyingTriggers: [
            "Replacing underperforming conventional beverage cooler lines",
          ],
          estimatedDealSize: "$3,000 - $10,000 / month",
          conversionProbability: 76,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find convenience and express store owners in ${geo} for beverage and snack retail distribution`,
          openingAngle: "optimizing grab-and-go cooler margins with rapid-turnover functional beverages",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  if (isStudioCreative) {
    return {
      businessName: bName,
      positioning: "Elite Creative & Technical Commerce Studio for High-Growth Consumer Flagships",
      coreOfferStructure: {
        primaryOffer: "Flagship eCommerce Storefront Architecture & Sub-Second Conversion Engine",
        deliverables: [
          "Bespoke Headless / Shopify Plus visual storefront redesign",
          "Sub-second Core Web Vitals optimization slashing mobile bounce rates",
          "Interactive 3D product visualizer & editorial visual storytelling",
          "Conversion-rate-optimized (CRO) single-page checkout funnel",
        ],
        suggestedPricing: profile.pricingModel || "$8,000 - $25,000 project + $3,500/mo growth retainer",
        marginTier: "High Margin (70-90%)",
        valueProposition: "Transform high-friction consumer storefronts into sub-second, editorial digital experiences that lift mobile checkout conversion by 25-40%.",
      },
      icps: [
        {
          id: "icp-1-dtc-lifestyle-apparel",
          rank: 1,
          title: "Scaling D2C Lifestyle, Fashion & Apparel Brands",
          industry: "Direct-to-Consumer (D2C) Retail",
          subNiche: "Premium Apparel, Activewear & Luxury Accessories",
          targetGeography: geo,
          companySize: "10-60 employees / $3M-$20M annual eCommerce GMV",
          decisionMakerTitles: ["Founder & CEO", "Head of eCommerce", "Chief Marketing Officer"],
          primaryPainPoints: [
            "Rising Meta/Google ad customer acquisition costs (CAC)",
            "Sluggish mobile storefront speed causing high cart abandonment",
            "Generic out-of-the-box Shopify theme that diminishes brand prestige",
          ],
          buyingTriggers: [
            "Scaling past $5M GMV and outgrowing off-the-shelf theme templates",
            "Preparing for peak seasonal retail campaigns or international expansion",
          ],
          estimatedDealSize: "$12,000 - $35,000 project + retainer",
          conversionProbability: 89,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find d2c lifestyle and apparel brands in ${geo} for creative and technical studio services`,
          openingAngle: "upgrading mobile storefront speed and interactive editorial UX to reduce CAC and lift checkout conversion",
        },
        {
          id: "icp-2-beauty-skincare-cpg",
          rank: 2,
          title: "D2C Clean Beauty & Clinical Skincare Brands",
          industry: "Beauty & Wellness eCommerce",
          subNiche: "Organic Cosmetics, Clean Skincare & Nutracuticals",
          targetGeography: geo,
          companySize: "8-40 employees / $2M-$12M annual GMV",
          decisionMakerTitles: ["Founder", "Co-Founder & Brand Director", "Head of Growth"],
          primaryPainPoints: [
            "Need for high-trust visual proof and ingredient storytelling",
            "Subscription churn and low repeat purchase lifetime value (LTV)",
          ],
          buyingTriggers: [
            "Launching new product lines requiring custom visual landing pages",
            "Migration from monolithic platforms to modern high-speed tech stacks",
          ],
          estimatedDealSize: "$10,000 - $25,000",
          conversionProbability: 84,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find d2c beauty and skincare brands in ${geo} for custom ecommerce development`,
          openingAngle: "implementing interactive shade-matching / routine visualizers to boost average order value (AOV)",
        },
        {
          id: "icp-3-modern-home-design",
          rank: 3,
          title: "Design-Led Home Decor & Furniture D2C",
          industry: "Home Furnishings & Architectural Living",
          subNiche: "Modern Furniture, Lighting & Home Goods",
          targetGeography: geo,
          companySize: "10-50 employees / $4M-$18M annual GMV",
          decisionMakerTitles: ["Founder / Managing Director", "eCommerce Director"],
          primaryPainPoints: [
            "High return rates due to customers misjudging spatial dimensions",
            "Heavy unoptimized product photography dragging down mobile Core Web Vitals",
          ],
          buyingTriggers: [
            "Demand for augmented reality (AR) or 3D product visualizers",
          ],
          estimatedDealSize: "$15,000 - $40,000",
          conversionProbability: 79,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find modern furniture and home goods d2c brands in ${geo} for storefront optimization`,
          openingAngle: "deploying interactive 3D product visualizers that boost buyer confidence and decrease returns",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  if (isAutomotive) {
    return {
      businessName: bName,
      positioning: "Digital Showroom Acceleration & Test-Drive Lead Velocity Partner",
      coreOfferStructure: {
        primaryOffer: "Sub-Second Inbound Lead Capture & WhatsApp Test-Drive Booking Engine",
        deliverables: [
          "Vehicle detail page (VDP) under-60-second test-drive reservation widget",
          "Automated WhatsApp & SMS calendar confirmations for shoppers",
          "After-hours lead recapture flow to eliminate churn to rival dealers",
          "Local inventory Google Vehicle Listing automation",
        ],
        suggestedPricing: profile.pricingModel || "$3,000 setup + $1,500/mo management",
        marginTier: "High Margin (70-90%)",
        valueProposition: "Turn digital showroom traffic into verified test-drive appointments with under-60-second mobile engagement.",
      },
      icps: [
        {
          id: "icp-1-franchised-dealers",
          rank: 1,
          title: "Independent & Multi-Location Auto Dealerships",
          industry: "Automotive Retail",
          subNiche: "Pre-Owned Luxury & Certified Franchise Dealerships",
          targetGeography: geo,
          companySize: "15-80 employees / 50-300 vehicle inventory",
          decisionMakerTitles: ["General Manager", "General Sales Manager", "Marketing Director", "Dealer Principal"],
          primaryPainPoints: [
            "Slow response times to third-party website leads causing buyer attrition",
            "Low appointment show-up rate from generic email auto-responders",
          ],
          buyingTriggers: [
            "Increasing monthly inventory turn velocity",
          ],
          estimatedDealSize: "$3,500 - $8,000 / month",
          conversionProbability: 86,
          serviceTrack: "technical",
          searchQueryPrompt: `find automotive dealerships in ${geo} for showroom sales lead acceleration`,
          openingAngle: "automating sub-60-second test-drive scheduling directly into your sales team calendars",
        },
        {
          id: "icp-2-commercial-fleet",
          rank: 2,
          title: "Commercial Truck & Commercial Fleet Dealers",
          industry: "Commercial Fleet Retail",
          subNiche: "Work Trucks, Vans, & Equipment Leasing",
          targetGeography: geo,
          companySize: "10-50 employees",
          decisionMakerTitles: ["Fleet Sales Manager", "Managing Partner"],
          primaryPainPoints: ["Complex B2B quotes causing deals to stall"],
          buyingTriggers: ["Expanding regional corporate account outreach"],
          estimatedDealSize: "$5,000 - $12,000 / month",
          conversionProbability: 80,
          serviceTrack: "technical",
          searchQueryPrompt: `find commercial truck and fleet dealerships in ${geo} for lead automation`,
          openingAngle: "streamlining corporate fleet leasing qualification and instant quote requests",
        },
        {
          id: "icp-3-exotic-luxury",
          rank: 3,
          title: "Exotic & Performance Vehicle Showrooms",
          industry: "Luxury Automotive",
          subNiche: "Supercars & Rare Collector Vehicles",
          targetGeography: geo,
          companySize: "5-25 employees",
          decisionMakerTitles: ["Owner", "Principal Director"],
          primaryPainPoints: ["Screening tire-kickers from high-net-worth buyers"],
          buyingTriggers: ["Modernizing digital VIP presentation standards"],
          estimatedDealSize: "$6,000 - $15,000",
          conversionProbability: 75,
          serviceTrack: "creative+technical",
          searchQueryPrompt: `find luxury and exotic car dealerships in ${geo} for digital showroom architecture`,
          openingAngle: "building high-prestige private viewing consultation flows for verified collectors",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  // Default / Cross-Industry High-Value Strategic Engine
  return {
    businessName: bName,
    positioning: isLegal
      ? "Client Intake Modernization & Practice Retention Infrastructure"
      : isHealthMedical
      ? "Patient Acquisition Velocity & Direct Digital Consultation Systems"
      : isTechSaaS
      ? "Enterprise Trial Acceleration & Pipeline Conversion Architecture"
      : "Autonomous Digital Infrastructure & Conversion Engineering Systems",
    coreOfferStructure: {
      primaryOffer: "Turnkey Inbound Acquisition & Automated Client Onboarding Architecture",
      deliverables: [
        "24/7 Intelligent client intake and automated qualification engine",
        "Sub-second mobile conversion architecture with zero inquiry drop-off",
        "Direct CRM scheduling and instant multichannel follow-up pipeline",
        "Executive analytics and lead attribution dashboard",
      ],
      suggestedPricing: profile.pricingModel || "$4,500 - $12,000 implementation + performance retainer",
      marginTier: "High Margin (70-90%)",
      valueProposition: "Eliminate administrative booking bottlenecks and capture high-intent prospective clients before they turn to competitors.",
    },
    icps: [
      {
        id: "icp-1-primary-vertical",
        rank: 1,
        title: `Leading ${profile.skills[0] || "High-Value"} Commercial Operators`,
        industry: profile.idealClientTypes?.[0] || "Professional Services & Healthcare",
        subNiche: "Established Independent Practices & Mid-Market Firms",
        targetGeography: geo,
        companySize: "10-100 employees / Established local presence",
        decisionMakerTitles: ["Founder & CEO", "Managing Partner", "Practice Director", "Operating Officer"],
        primaryPainPoints: [
          "Leaking prospective leads due to slow manual response times",
          "Inefficient after-hours inquiry capture",
          "Outdated digital credibility compared to venture-backed entrants",
        ],
        buyingTriggers: [
          "Investing in technology to reduce operational overhead",
          "Expanding into new geographic territories",
        ],
        estimatedDealSize: "$5,000 - $15,000",
        conversionProbability: 85,
        serviceTrack: "creative+technical",
        searchQueryPrompt: `find ${profile.skills[0] || "professional service"} businesses in ${geo} for digital client acquisition`,
        openingAngle: "implementing automated 24/7 client consultation intake and sub-second inquiry capture",
      },
      {
        id: "icp-2-specialty-firms",
        rank: 2,
        title: "Boutique Consultancies & High-Ticket Providers",
        industry: "Commercial Advisory & Specialized Services",
        subNiche: "High-Margin Advisory Practices",
        targetGeography: geo,
        companySize: "5-30 employees",
        decisionMakerTitles: ["Principal", "Managing Director", "Senior Partner"],
        primaryPainPoints: [
          "Manual scheduling back-and-forth frustrating high-value clients",
          "Lack of structured digital intake qualifying prospect budget early",
        ],
        buyingTriggers: [
          "Need to filter unqualified inquiries to protect partner billable hours",
        ],
        estimatedDealSize: "$4,000 - $10,000",
        conversionProbability: 81,
        serviceTrack: "creative+technical",
        searchQueryPrompt: `find boutique consulting and advisory firms in ${geo} for workflow modernization`,
        openingAngle: "automating partner calendar qualification to eliminate unqualified discovery calls",
      },
      {
        id: "icp-3-regional-leaders",
        rank: 3,
        title: "Fast-Growing Regional Multi-Location Businesses",
        industry: "Regional Commercial Services",
        subNiche: "Multi-Branch Service Providers",
        targetGeography: geo,
        companySize: "20-150 employees",
        decisionMakerTitles: ["Chief Executive Officer", "VP Growth / COO"],
        primaryPainPoints: [
          "Inconsistent customer inquiry handling across branches",
          "Disjointed lead routing",
        ],
        buyingTriggers: [
          "Standardizing technology infrastructure across multiple regional locations",
        ],
        estimatedDealSize: "$8,000 - $25,000",
        conversionProbability: 77,
        serviceTrack: "creative+technical",
        searchQueryPrompt: `find regional commercial service companies in ${geo} for automated client intake`,
        openingAngle: "deploying centralized multi-location lead routing and instant client intake",
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
