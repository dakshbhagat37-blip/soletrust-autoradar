/**
 * SoleTrust Business OS v6.0 — Universal AI Knowledge Base & Training Corpus
 * Comprehensive encyclopedic knowledge base spanning:
 * 1. 40+ Global Industry Taxonomy Trees with buyer psychology, decision-maker roles & search lexicon
 * 2. 195+ Countries, economic regions & commercial hub aliases
 * 3. Deep Tax, Accounting & Compliance Knowledge Graph (Indian GST, RCM, ITC, SAC codes, LUT, UK VAT, Australian GST)
 * 4. 20+ Sales Objection Handling Battlecards & Cold Outreach Positioning Matrix
 * 5. In-House System Diagnostics & Self-Sovereign Troubleshooting Engine
 * 
 * Strict Principle: UNKNOWN > WRONG (Zero hallucinations, integer-cent calculations, authoritative provenance)
 */

export interface IndustryTaxonomy {
  id: string;
  name: string;
  category: "industrial" | "technology" | "healthcare" | "professional_services" | "commerce" | "lifestyle" | "energy" | "creative";
  serviceTrack: "technical" | "creative" | "creative+technical";
  synonyms: string[];
  keyDecisionMakerTitles: string[];
  typicalRetainerINR: string;
  typicalRetainerUSD: string;
  primaryPainPoints: string[];
  psychologicalBuyingDrivers: string[];
  outreachAngle: string;
  osmTags: string[];
  registryKeywords: string[];
}

export interface RegionMapping {
  region: string;
  countries: string[];
  commercialHubs: string[];
  defaultCurrency: string;
  taxRegime: string;
}

export interface TaxGuidance {
  topic: string;
  applicableLaw: string;
  rules: string[];
  formula?: string;
  sacOrHsnCode?: string;
  complianceWarning?: string;
}

export interface SalesBattlecard {
  objection: string;
  category: "competition" | "budget" | "timing" | "skepticism" | "brush_off" | "authority";
  psychologicalInsight: string;
  reframeQuestion: string;
  emailScript: string;
  phoneWhatsappScript: string;
}

export interface SystemDiagnosticGuide {
  component: "smtp_port_25" | "ollama_vllm" | "searxng_waterfall" | "ledger_balance" | "client_portal";
  issueTitle: string;
  symptoms: string[];
  diagnosticCommand: string;
  rootCause: string;
  resolutionSteps: string[];
}

// ============================================================================
// 1. 40+ GLOBAL INDUSTRY TAXONOMY TREES
// ============================================================================
export const GLOBAL_INDUSTRY_TAXONOMY: Record<string, IndustryTaxonomy> = {
  taxation_accounting: {
    id: "taxation_accounting",
    name: "Taxation & Chartered Accountants",
    category: "professional_services",
    serviceTrack: "technical",
    synonyms: ["tax", "taxation", "chartered accountant", "ca firm", "cpa", "cpa firm", "accounting firm", "audit firm", "statutory auditor", "tax consultant"],
    keyDecisionMakerTitles: ["Managing Partner", "Senior Partner", "Founder & Principal", "Head of Direct Tax", "Chief Financial Officer"],
    typicalRetainerINR: "₹75,000 – ₹3,00,000 / month",
    typicalRetainerUSD: "$2,500 – $10,000 / month",
    primaryPainPoints: ["Manual client document collection bottlenecks", "GST/VAT reconciliation discrepancies", "Time-tracking and unbilled advisory hours"],
    psychologicalBuyingDrivers: ["Regulatory audit protection", "Professional prestige among high-net-worth clients", "Automation without losing peer review accuracy"],
    outreachAngle: "Automate reconciliation workflows and client follow-ups to recapture 15+ billable advisory hours every week per partner.",
    osmTags: ["office=accountant", "office=tax_advisor", "office=financial"],
    registryKeywords: ["Chartered Accountants", "Tax Advisors", "Auditors", "Public Accountants"],
  },
  solar_renewable_energy: {
    id: "solar_renewable_energy",
    name: "Commercial Solar & Renewable Energy EPC",
    category: "energy",
    serviceTrack: "technical",
    synonyms: ["solar", "solar epc", "photovoltaic", "commercial solar", "rooftop solar", "renewable energy", "clean energy", "solar installer", "battery storage"],
    keyDecisionMakerTitles: ["Chief Executive Officer", "Director of Projects", "VP Engineering", "Head of Solar EPC", "Managing Director"],
    typicalRetainerINR: "₹1,50,000 – ₹5,00,000 / month",
    typicalRetainerUSD: "$5,000 – $20,000 / month",
    primaryPainPoints: ["High customer acquisition costs for C&I (Commercial & Industrial) rooftop leads", "Net metering utility approval delays", "Supply chain inverter lead times"],
    psychologicalBuyingDrivers: ["Securing high-margin 100kW+ C&I contracts before regulatory tariff revision", "Engineering pride in turnkey project delivery"],
    outreachAngle: "Source qualified commercial factory rooftop owners with verified electrical sanction loads ready for solar PPA/Capex pitches.",
    osmTags: ["shop=energy", "craft=electrician", "office=energy_supplier"],
    registryKeywords: ["Solar EPC", "Renewable Energy", "Photovoltaic", "Clean Energy"],
  },
  logistics_freight: {
    id: "logistics_freight",
    name: "Logistics & Freight Services",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["logistics", "freight", "freight forwarder", "cargo", "shipping company", "warehousing", "3pl", "supply chain", "cold chain", "trucking fleet"],
    keyDecisionMakerTitles: ["Managing Director", "VP Supply Chain", "Head of Freight Forwarding", "Director of Logistics", "Operations Director"],
    typicalRetainerINR: "₹1,00,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$4,000 – $15,000 / month",
    primaryPainPoints: ["Deadhead miles and unutilized container capacity", "Customs clearance paperwork hold-ups", "Driver shortages and fuel margin compression"],
    psychologicalBuyingDrivers: ["Maximum asset utilization", "Direct contracts with high-volume exporters/importers", "Real-time visibility over cargo tracking"],
    outreachAngle: "Bypass freight broker cut-throats and win exclusive recurring 3PL and shipping contracts directly with mid-market manufacturers.",
    osmTags: ["office=logistics", "industrial=warehouse", "amenity=freight_centre"],
    registryKeywords: ["Freight Forwarding", "Logistics", "3PL Warehousing", "Supply Chain"],
  },
  precision_manufacturing: {
    id: "precision_manufacturing",
    name: "Manufacturing & Industrial Engineering",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["manufacturing", "cnc", "machining", "fabrication", "industrial equipment", "assembly plant", "factory", "precision engineering", "die casting", "tooling"],
    keyDecisionMakerTitles: ["Plant Head", "Managing Director", "Chief Operating Officer", "VP Manufacturing", "General Manager - Operations"],
    typicalRetainerINR: "₹1,20,000 – ₹6,00,000 / month",
    typicalRetainerUSD: "$5,000 – $25,000 / month",
    primaryPainPoints: ["Machine downtime and CNC spindle utilization", "Scrap rates and dimensional tolerance rejections", "Long quote-to-order cycles"],
    psychologicalBuyingDrivers: ["Predictable multi-year OEM Tier-1/Tier-2 supply contracts", "Zero defect manufacturing reputation", "Modernizing shop floor throughput"],
    outreachAngle: "Connect your precision machining capacity directly with Tier-1 defense, automotive, and industrial buyers seeking sovereign supply lines.",
    osmTags: ["industrial=factory", "craft=metal_construction", "industrial=machine_shop"],
    registryKeywords: ["Precision Engineering", "CNC Machining", "Fabrication", "Industrial Equipment"],
  },
  aerospace_defense: {
    id: "aerospace_defense",
    name: "Aerospace & Defense Engineering",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["aerospace", "defense", "defence", "avionics", "aerospace components", "military contractor", "mro", "unmanned aerial vehicle", "uav", "aerospace precision"],
    keyDecisionMakerTitles: ["Chief Executive Officer", "Director of Defense Programs", "VP Aerospace Systems", "Chief Technology Officer", "Head of Quality Assurance"],
    typicalRetainerINR: "₹3,00,000 – ₹10,00,000 / month",
    typicalRetainerUSD: "$10,000 – $50,000 / month",
    primaryPainPoints: ["AS9100 / ITAR compliance friction", "Extremely lengthy procurement sales cycles", "Stringent vendor audit qualification hurdles"],
    psychologicalBuyingDrivers: ["Strategic national security partnerships", "Long-term sovereign defense budget allocation", "Highest-tier engineering certs"],
    outreachAngle: "Position your AS9100-certified facility in front of prime defense integrators seeking accredited domestic offset partners.",
    osmTags: ["aeroway=aerodrome", "industrial=factory", "office=company"],
    registryKeywords: ["Aerospace Components", "Defense Engineering", "Avionics", "AS9100"],
  },
  edtech_education: {
    id: "edtech_education",
    name: "EdTech & Educational Services",
    category: "technology",
    serviceTrack: "creative+technical",
    synonyms: ["edtech", "education company", "tutoring", "academy", "coaching institute", "higher education", "vocational", "e-learning", "online courses", "skilling platform"],
    keyDecisionMakerTitles: ["Founder & CEO", "Chief Academic Officer", "VP Student Acquisition", "Head of Growth", "Director of Admissions"],
    typicalRetainerINR: "₹80,000 – ₹3,50,000 / month",
    typicalRetainerUSD: "$3,000 – $12,000 / month",
    primaryPainPoints: ["Rising student acquisition cost on Meta/Google Ads", "Course drop-out rates and churn", "Placement rate transparency demands"],
    psychologicalBuyingDrivers: ["High alumni referral loops", "Institutional credibility & accredited certification", "Predictable student enrolment velocity"],
    outreachAngle: "Reduce student CAC by 40% with organic institutional outreach and automated student qualification funnels.",
    osmTags: ["amenity=school", "amenity=college", "amenity=university", "office=educational_institution"],
    registryKeywords: ["EdTech", "Education Services", "Skill Development", "Training Academy"],
  },
  real_estate_proptech: {
    id: "real_estate_proptech",
    name: "Real Estate & Property Management",
    category: "commerce",
    serviceTrack: "creative",
    synonyms: ["real estate", "realty", "realtors", "property management", "real estate agency", "commercial real estate", "proptech", "property developer", "reit"],
    keyDecisionMakerTitles: ["Managing Director", "Principal Broker", "Head of Land Acquisition", "Director of Sales & Marketing", "Partner"],
    typicalRetainerINR: "₹1,00,000 – ₹5,00,000 / month",
    typicalRetainerUSD: "$3,500 – $15,000 / month",
    primaryPainPoints: ["Unqualified tire-kicker buyer inquiries", "Long closing cycles and inventory holding costs", "Broker commission disputes"],
    psychologicalBuyingDrivers: ["Exclusive high-ticket luxury listings", "Fast inventory turnover for commercial and residential launches", "Developer prestige"],
    outreachAngle: "Filter out tire-kickers and deliver verified high-net-worth investors directly to your senior sales partners.",
    osmTags: ["office=estate_agent", "office=property_management"],
    registryKeywords: ["Real Estate", "Property Developers", "Commercial Realty", "PropTech"],
  },
  healthcare_clinics: {
    id: "healthcare_clinics",
    name: "Healthcare & Medical Clinics",
    category: "healthcare",
    serviceTrack: "technical",
    synonyms: ["clinic", "clinics", "medical center", "health clinic", "diagnostic center", "pathology lab", "healthcare clinic", "specialist clinic", "physiotherapy"],
    keyDecisionMakerTitles: ["Medical Director", "Chief Medical Officer", "Managing Partner", "Practice Manager", "Clinic Owner"],
    typicalRetainerINR: "₹60,000 – ₹2,50,000 / month",
    typicalRetainerUSD: "$2,500 – $8,000 / month",
    primaryPainPoints: ["Patient no-shows and last-minute cancellations", "Heavy dependence on third-party aggregator portals", "Regulatory compliance around health records"],
    psychologicalBuyingDrivers: ["Direct patient brand loyalty", "High-margin elective procedure bookings", "Smooth patient intake without front-desk chaos"],
    outreachAngle: "Eliminate costly aggregator commissions and build direct private patient bookings for specialized procedures.",
    osmTags: ["amenity=clinic", "amenity=doctors", "healthcare=centre"],
    registryKeywords: ["Medical Clinics", "Healthcare Center", "Diagnostic Laboratory", "Pathology"],
  },
  dental_clinics: {
    id: "dental_clinics",
    name: "Dental Clinics & Orthodontics",
    category: "healthcare",
    serviceTrack: "technical",
    synonyms: ["dental", "dentist", "dentists", "dental clinic", "orthodontics", "pediatric dental", "dental implants", "clear aligners", "cosmetic dentistry"],
    keyDecisionMakerTitles: ["Lead Dentist & Owner", "Principal Orthodontist", "Dental Practice Director", "Clinical Partner"],
    typicalRetainerINR: "₹50,000 – ₹2,00,000 / month",
    typicalRetainerUSD: "$2,000 – $7,500 / month",
    primaryPainPoints: ["Chair time vacancy during mid-week hours", "Low patient conversion on high-value implants and aligners", "Staff turnover for hygienists"],
    psychologicalBuyingDrivers: ["Full chair occupancy with lucrative implant/invisalign cases", "Clinical reputation as the premier neighborhood dentist"],
    outreachAngle: "Fill your high-margin dental implant and clear aligner calendar with pre-screened private pay patients.",
    osmTags: ["amenity=dentist", "healthcare=dentist"],
    registryKeywords: ["Dental Clinic", "Dentistry", "Orthodontics", "Dental Implants"],
  },
  dermatology_aesthetics: {
    id: "dermatology_aesthetics",
    name: "Dermatology & Skin Clinics",
    category: "healthcare",
    serviceTrack: "creative+technical",
    synonyms: ["dermatology", "dermatologist", "skin clinic", "cosmetology", "aesthetic clinic", "laser clinic", "anti-aging clinic", "hair transplant"],
    keyDecisionMakerTitles: ["Consultant Dermatologist", "Founder & Medical Director", "Head Aesthetic Physician", "Clinic Director"],
    typicalRetainerINR: "₹75,000 – ₹3,00,000 / month",
    typicalRetainerUSD: "$3,000 – $10,000 / month",
    primaryPainPoints: ["Price shopping on laser treatments and Botox", "High advertising costs on Instagram with low retention", "Consultation no-show rates"],
    psychologicalBuyingDrivers: ["High-ticket treatment packages (lasers, injectables, hair restoration)", "Luxury aesthetic ambiance and VIP referrals"],
    outreachAngle: "Target affluent professionals seeking anti-aging and laser packages with high recurring lifetime value.",
    osmTags: ["amenity=clinic", "beauty=skin_care", "shop=beauty"],
    registryKeywords: ["Dermatology", "Skin Care Clinic", "Cosmetology", "Aesthetic Medicine"],
  },
  hospitals_multispecialty: {
    id: "hospitals_multispecialty",
    name: "Hospitals & Medical Centers",
    category: "healthcare",
    serviceTrack: "technical",
    synonyms: ["hospital", "hospitals", "multispecialty hospital", "trauma center", "surgical center", "super specialty hospital", "tertiary care"],
    keyDecisionMakerTitles: ["Managing Director", "Chief Executive Officer", "Chief Operating Officer", "Medical Superintendent", "Head of Business Development"],
    typicalRetainerINR: "₹2,50,000 – ₹12,00,000 / month",
    typicalRetainerUSD: "$8,000 – $35,000 / month",
    primaryPainPoints: ["ICU and operating theatre bed occupancy", "TPA insurance claim settlement delays", "Doctor retention and departmental revenue balancing"],
    psychologicalBuyingDrivers: ["Tertiary referral supremacy in cardiac, oncology, and neurosurgery", "NABH/JCI accreditation compliance pride"],
    outreachAngle: "Drive institutional medical tourism and regional physician referral networks directly into your specialty surgical departments.",
    osmTags: ["amenity=hospital", "healthcare=hospital"],
    registryKeywords: ["Hospitals", "Multispecialty Healthcare", "Surgical Centers", "Medical Institutions"],
  },
  law_firms_legal: {
    id: "law_firms_legal",
    name: "Law Firms & Legal Practices",
    category: "professional_services",
    serviceTrack: "technical",
    synonyms: ["law firm", "law firms", "lawyer", "attorney", "legal practice", "solicitors", "advocates", "barristers", "corporate law", "litigation firm"],
    keyDecisionMakerTitles: ["Senior Partner", "Managing Partner", "Founding Partner", "Head of Corporate Practice", "General Counsel"],
    typicalRetainerINR: "₹1,00,000 – ₹5,00,000 / month",
    typicalRetainerUSD: "$4,000 – $18,000 / month",
    primaryPainPoints: ["Bar council marketing restrictions preventing vulgar advertising", "Long retainer pitch cycles for corporate M&A", "High associate turnover"],
    psychologicalBuyingDrivers: ["Unassailable institutional prestige", "Discreet multi-million dollar corporate mandates", "Thought leadership among enterprise GCs"],
    outreachAngle: "Position your partners discreetly through executive briefings and corporate compliance intelligence without violating Bar ethics rules.",
    osmTags: ["office=lawyer", "office=legal"],
    registryKeywords: ["Law Firms", "Advocates", "Legal Services", "Solicitors"],
  },
  saas_software: {
    id: "saas_software",
    name: "Software SaaS & Cloud Companies",
    category: "technology",
    serviceTrack: "creative+technical",
    synonyms: ["saas", "software company", "b2b tech", "cloud software", "developer tools", "enterprise software", "fintech saas", "ai platform"],
    keyDecisionMakerTitles: ["Chief Executive Officer", "Chief Technology Officer", "VP Sales", "Head of Growth", "Chief Revenue Officer"],
    typicalRetainerINR: "₹1,50,000 – ₹6,00,000 / month",
    typicalRetainerUSD: "$5,000 – $25,000 / month",
    primaryPainPoints: ["Net revenue retention and mid-market customer churn", "Sales pipeline velocity and long procurement reviews", "High CAC:LTV ratios"],
    psychologicalBuyingDrivers: ["Hitting ARR expansion benchmarks for next financing round", "Displacing legacy on-prem incumbents"],
    outreachAngle: "Target enterprise VP/C-suite buyers with tailored ROI models that compress sales cycles from 9 months to 45 days.",
    osmTags: ["office=it", "office=software", "office=company"],
    registryKeywords: ["Software SaaS", "Cloud Platforms", "Technology Solutions", "Software Development"],
  },
  d2c_ecommerce: {
    id: "d2c_ecommerce",
    name: "D2C Direct-to-Consumer Brands",
    category: "commerce",
    serviceTrack: "creative+technical",
    synonyms: ["d2c", "dtc", "direct to consumer", "ecommerce", "online brand", "apparel brand", "skincare brand", "lifestyle brand", "shopify store"],
    keyDecisionMakerTitles: ["Founder & CEO", "Co-Founder & CMO", "Head of E-Commerce", "VP Growth", "Director of Retention"],
    typicalRetainerINR: "₹75,000 – ₹3,50,000 / month",
    typicalRetainerUSD: "$3,000 – $12,000 / month",
    primaryPainPoints: ["iOS privacy tracking attribution loss", "High return-to-origin (RTO) on cash-on-delivery orders", "High customer churn after first purchase"],
    psychologicalBuyingDrivers: ["Repeat purchase cohorts and high customer lifetime value", "Building a recognized consumer household brand"],
    outreachAngle: "Slash RTO rates by 35% and unlock 3x repeat purchases via automated post-purchase WhatsApp workflows.",
    osmTags: ["shop=clothes", "shop=cosmetics", "shop=boutique"],
    registryKeywords: ["D2C Brands", "E-Commerce", "Consumer Goods", "Retail Direct"],
  },
  supermarkets_retail: {
    id: "supermarkets_retail",
    name: "Supermarkets",
    category: "commerce",
    serviceTrack: "technical",
    synonyms: ["supermarket", "supermarkets", "grocery store", "groceries", "hypermarket", "food mart", "organic market", "fmcg wholesale"],
    keyDecisionMakerTitles: ["Managing Director", "Head of Procurement", "Operations Director", "Category Manager", "Owner"],
    typicalRetainerINR: "₹80,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$3,000 – $14,000 / month",
    primaryPainPoints: ["Perishable inventory spoilage and shrinkage", "Thin 2-4% net retail margins", "Competition from quick-commerce 10-minute delivery apps"],
    psychologicalBuyingDrivers: ["High basket size per footfall", "Optimized FMCG supplier credit periods", "Loyalty app stickiness"],
    outreachAngle: "Drive higher basket values and protect footfall against quick-commerce apps through hyper-local automated member promotions.",
    osmTags: ["shop=supermarket", "shop=convenience", "shop=grocery"],
    registryKeywords: ["Supermarkets", "Grocery Retail", "FMCG Distribution", "Hypermarkets"],
  },
  automotive_dealerships: {
    id: "automotive_dealerships",
    name: "Automotive Dealerships",
    category: "commerce",
    serviceTrack: "creative+technical",
    synonyms: ["car dealer", "car dealership", "automotive dealership", "car showroom", "commercial vehicles dealer", "auto retail", "used cars dealer"],
    keyDecisionMakerTitles: ["Dealer Principal", "Managing Director", "General Sales Manager", "Head of After-Sales", "Owner"],
    typicalRetainerINR: "₹90,000 – ₹4,50,000 / month",
    typicalRetainerUSD: "$3,500 – $15,000 / month",
    primaryPainPoints: ["Showroom test-drive ghosting", "High interest carrying costs on floor plan inventory", "Low after-sales service bay retention"],
    psychologicalBuyingDrivers: ["Hitting OEM sales quota targets for annual manufacturer bonuses", "Maximizing high-margin service and accessory revenues"],
    outreachAngle: "Turn showroom test-drives into confirmed bookings with automated financing pre-approval and warranty upsell sequences.",
    osmTags: ["shop=car", "shop=car_repair"],
    registryKeywords: ["Automobile Dealers", "Car Showrooms", "Vehicle Dealerships"],
  },
  restaurants_hospitality: {
    id: "restaurants_hospitality",
    name: "Restaurants & Hospitality",
    category: "lifestyle",
    serviceTrack: "creative",
    synonyms: ["restaurant", "restaurants", "cafe", "hospitality", "bistro", "dining", "bakeries", "food & beverage", "f&b", "hotel dining"],
    keyDecisionMakerTitles: ["Restaurateur & Founder", "Executive Chef & Partner", "Director of Food & Beverage", "General Manager", "Hospitality Director"],
    typicalRetainerINR: "₹50,000 – ₹2,50,000 / month",
    typicalRetainerUSD: "$2,000 – $8,000 / month",
    primaryPainPoints: ["High 25-30% food aggregator commission cuts", "Table vacancy on weekday lunch shifts", "Ingredient food waste management"],
    psychologicalBuyingDrivers: ["Packed weekend dining rooms and buzz", "Direct customer reservations with zero aggregator commissions"],
    outreachAngle: "Reclaim your profit margins by driving direct diner table reservations and private event catering bookings.",
    osmTags: ["amenity=restaurant", "amenity=cafe", "amenity=fast_food"],
    registryKeywords: ["Restaurants", "Food & Beverage", "Hospitality Services", "Bistros"],
  },
  gyms_fitness: {
    id: "gyms_fitness",
    name: "Gyms & Fitness Centers",
    category: "lifestyle",
    serviceTrack: "creative",
    synonyms: ["gym", "gyms", "fitness center", "crossfit", "yoga studio", "pilates studio", "strength club", "health club"],
    keyDecisionMakerTitles: ["Founder & Managing Director", "Head Coach & Partner", "Operations Director", "Fitness Club Manager"],
    typicalRetainerINR: "₹40,000 – ₹1,80,000 / month",
    typicalRetainerUSD: "$1,500 – $6,000 / month",
    primaryPainPoints: ["January surge followed by massive March member drop-off", "Personal trainer revenue leakage", "Equipment financing overhead"],
    psychologicalBuyingDrivers: ["High monthly recurring membership dues", "Thriving community and personal training upsells"],
    outreachAngle: "Lock in annual member commitments and boost PT conversion rates using automated onboarding habits challenges.",
    osmTags: ["leisure=fitness_centre", "leisure=sports_centre"],
    registryKeywords: ["Fitness Centers", "Gyms", "Health Clubs", "Yoga Studios"],
  },
  export_import_trade: {
    id: "export_import_trade",
    name: "Export & Import Trading",
    category: "commerce",
    serviceTrack: "technical",
    synonyms: ["export", "import", "exporters", "importers", "export-import", "international trade", "commodity trader", "merchant exporter", "customs broker"],
    keyDecisionMakerTitles: ["Managing Director", "Head of International Trade", "Export Director", "Commercial General Manager", "Proprietor"],
    typicalRetainerINR: "₹1,20,000 – ₹5,00,000 / month",
    typicalRetainerUSD: "$4,500 – $18,000 / month",
    primaryPainPoints: ["Currency exchange volatility and LC payment delays", "Cross-border regulatory customs changes", "Finding creditworthy overseas buyers"],
    psychologicalBuyingDrivers: ["Verified international buyers with clean letters of credit (LC)", "Zero-rated export tax rebates (LUT/Duty Drawback)"],
    outreachAngle: "Directly match your export commodities with verified international procurement officers with guaranteed LC backing.",
    osmTags: ["office=company", "industrial=warehouse"],
    registryKeywords: ["Export Import", "Merchant Exporters", "International Trade", "Commodity Trading"],
  },
  fintech_wealth: {
    id: "fintech_wealth",
    name: "FinTech & Wealth Management",
    category: "professional_services",
    serviceTrack: "technical",
    synonyms: ["fintech", "wealth management", "nbfc", "asset management", "family office", "investment advisor", "portfolio manager", "lending platform"],
    keyDecisionMakerTitles: ["Chief Executive Officer", "Chief Investment Officer", "Managing Partner", "Head of Private Wealth", "VP Business Development"],
    typicalRetainerINR: "₹1,50,000 – ₹7,00,000 / month",
    typicalRetainerUSD: "$6,000 – $28,000 / month",
    primaryPainPoints: ["SEBI/SEC regulatory compliance reporting", "High client trust barrier for managing investable assets", "Complex AML/KYC onboarding"],
    psychologicalBuyingDrivers: ["Managing massive AUM (Assets Under Management) for ultra-high-net-worth clients", "Strict statutory compliance"],
    outreachAngle: "Deliver accredited high-net-worth investors directly into your private wealth advisory funnel with automated KYC screening.",
    osmTags: ["office=financial", "amenity=bank"],
    registryKeywords: ["Wealth Management", "Asset Management", "Financial Services", "NBFC"],
  },
  agritech_farming: {
    id: "agritech_farming",
    name: "AgriTech & Modern Farming",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["agritech", "agriculture", "hydroponics", "precision farming", "seed technology", "farm equipment", "fertilizer distributor", "agrochemicals"],
    keyDecisionMakerTitles: ["Managing Director", "Chief Agronomist", "Head of Farm Operations", "VP Agribusiness", "Proprietor"],
    typicalRetainerINR: "₹80,000 – ₹3,50,000 / month",
    typicalRetainerUSD: "$3,000 – $12,000 / month",
    primaryPainPoints: ["Weather climate volatility and crop yield predictability", "Unorganized agricultural mandi middlemen cuts", "Cold storage transport bottlenecks"],
    psychologicalBuyingDrivers: ["Predictable farm-to-fork contract farming agreements", "Sustainable yield optimization with minimal chemical runoff"],
    outreachAngle: "Secure direct institutional supply contracts with supermarket chains and food processors for premium grade produce.",
    osmTags: ["landuse=farmland", "shop=agrarian"],
    registryKeywords: ["AgriTech", "Agribusiness", "Precision Farming", "Agricultural Equipment"],
  },
  biotech_pharma: {
    id: "biotech_pharma",
    name: "BioTech & Pharmaceutical Formulations",
    category: "healthcare",
    serviceTrack: "technical",
    synonyms: ["biotech", "pharma", "pharmaceutical", "formulations", "active pharmaceutical ingredient", "api manufacturer", "clinical trials", "cro"],
    keyDecisionMakerTitles: ["Managing Director", "VP Regulatory Affairs", "Chief Scientific Officer", "Head of Formulations", "Director of Quality Control"],
    typicalRetainerINR: "₹2,00,000 – ₹8,00,000 / month",
    typicalRetainerUSD: "$8,000 – $32,000 / month",
    primaryPainPoints: ["US FDA / WHO-GMP regulatory inspection compliance", "Extended drug stability testing timelines", "Raw material API price spikes"],
    psychologicalBuyingDrivers: ["Unimpeachable cGMP regulatory validation", "Global contract manufacturing formulation agreements"],
    outreachAngle: "Connect your WHO-GMP compliant manufacturing capacity with international generic formulation distributors.",
    osmTags: ["industrial=factory", "office=research"],
    registryKeywords: ["Pharmaceuticals", "Biotechnology", "Active Pharmaceutical Ingredients", "Clinical Research"],
  },
  maritime_ports: {
    id: "maritime_ports",
    name: "Maritime & Port Logistics",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["maritime", "shipping line", "vessel", "port logistics", "stevedoring", "ship chandler", "marine engineering", "bunkering", "dry dock"],
    keyDecisionMakerTitles: ["Managing Director", "Fleet Operations Director", "Chief Marine Engineer", "Port Captain", "Commercial Director"],
    typicalRetainerINR: "₹2,50,000 – ₹10,00,000 / month",
    typicalRetainerUSD: "$10,000 – $40,000 / month",
    primaryPainPoints: ["Demurrage charges and vessel turnaround idle time", "Strict IMO decarbonization emission rules", "Bunker fuel price volatility"],
    psychologicalBuyingDrivers: ["Zero port turnaround delay", "Long-term charter agreements with global commodity conglomerates"],
    outreachAngle: "Streamline vessel supply chain operations and minimize costly turnaround delays with real-time port logistics intelligence.",
    osmTags: ["amenity=ferry_terminal", "industrial=port"],
    registryKeywords: ["Maritime Logistics", "Shipping Lines", "Marine Engineering", "Port Operations"],
  },
  robotics_automation: {
    id: "robotics_automation",
    name: "Robotics & Industrial Automation",
    category: "technology",
    serviceTrack: "technical",
    synonyms: ["robotics", "automation", "agv", "amr", "industrial robots", "plc programming", "scada", "mechatronics", "warehouse robotics"],
    keyDecisionMakerTitles: ["Chief Executive Officer", "Chief Technology Officer", "VP Automation", "Head of Robotics Engineering", "Managing Director"],
    typicalRetainerINR: "₹1,80,000 – ₹7,00,000 / month",
    typicalRetainerUSD: "$7,000 – $28,000 / month",
    primaryPainPoints: ["High upfront capital expenditure justification for clients", "Integration friction with legacy manufacturing equipment", "Trained robotics technician shortage"],
    psychologicalBuyingDrivers: ["Provable 12-month payback ROI on labor savings and 24/7 uptime", "Engineering mastery in cyber-physical automation"],
    outreachAngle: "Equip your automation engineering team with pre-qualified industrial plant managers seeking high-ROI robotic workcells.",
    osmTags: ["office=it", "industrial=factory"],
    registryKeywords: ["Robotics", "Industrial Automation", "Mechatronics", "SCADA Systems"],
  },
  architecture_turnkey: {
    id: "architecture_turnkey",
    name: "Architecture & Turnkey Interiors",
    category: "professional_services",
    serviceTrack: "creative+technical",
    synonyms: ["architecture", "architects", "interior design", "turnkey interiors", "fit-out contractor", "commercial architecture", "design build"],
    keyDecisionMakerTitles: ["Principal Architect", "Managing Partner", "Design Director", "Founder & Lead Designer", "General Manager"],
    typicalRetainerINR: "₹80,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$3,000 – $14,000 / month",
    primaryPainPoints: ["Contractor subcontractor delays ruining handover dates", "Client scope creep without change order approvals", "Design fee discounting"],
    psychologicalBuyingDrivers: ["Signature flagship commercial and luxury residential projects", "Design award prestige and architectural portfolio recognition"],
    outreachAngle: "Win exclusive commercial office and luxury residential turnkey mandates with enterprise-ready design pitches.",
    osmTags: ["office=architect", "office=interior_designer"],
    registryKeywords: ["Architecture", "Interior Design", "Turnkey Contractors", "Fit-Out Services"],
  },
  cybersecurity_mssp: {
    id: "cybersecurity_mssp",
    name: "Cybersecurity & Managed Security (MSSP)",
    category: "technology",
    serviceTrack: "technical",
    synonyms: ["cybersecurity", "infosec", "mssp", "penetration testing", "soc", "managed detection", "vulnerability assessment", "compliance audit"],
    keyDecisionMakerTitles: ["Chief Information Security Officer", "Chief Executive Officer", "VP Cyber Defense", "Head of Security Operations", "Managing Partner"],
    typicalRetainerINR: "₹1,50,000 – ₹6,00,000 / month",
    typicalRetainerUSD: "$6,000 – $25,000 / month",
    primaryPainPoints: ["Alert fatigue and false positives in SOC", "Enterprise reluctance to invest in proactive defense until a breach occurs", "Shortage of certified security analysts"],
    psychologicalBuyingDrivers: ["Regulatory compliance mandates (SOC2, ISO27001, HIPAA)", "Boardroom peace of mind against devastating ransomware"],
    outreachAngle: "Help mid-market enterprise CFOs achieve instant SOC2 and ISO compliance while safeguarding against ransomware.",
    osmTags: ["office=it", "office=telecommunication"],
    registryKeywords: ["Cybersecurity", "Information Security", "MSSP", "SOC Operations"],
  },
  veterinary_specialty: {
    id: "veterinary_specialty",
    name: "Veterinary Clinics & Animal Hospitals",
    category: "healthcare",
    serviceTrack: "technical",
    synonyms: ["veterinary", "vet clinic", "animal hospital", "pet hospital", "vet surgeon", "veterinarian", "emergency pet care"],
    keyDecisionMakerTitles: ["Medical Director & Vet Surgeon", "Practice Owner", "Lead Veterinarian", "Clinic Manager"],
    typicalRetainerINR: "₹40,000 – ₹1,80,000 / month",
    typicalRetainerUSD: "$1,800 – $7,000 / month",
    primaryPainPoints: ["Emotional stress on staff and compassion fatigue", "Client pushback on emergency surgery costs", "Inventory management for specialized animal pharmaceuticals"],
    psychologicalBuyingDrivers: ["Compassionate top-tier pet care", "Predictable wellness plan subscriptions"],
    outreachAngle: "Drive high-retention annual pet wellness subscriptions and emergency surgery bookings to your clinic.",
    osmTags: ["amenity=veterinary"],
    registryKeywords: ["Veterinary Clinic", "Animal Hospital", "Veterinary Services"],
  },
  waste_management_recycling: {
    id: "waste_management_recycling",
    name: "Waste Management & Recycling Services",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["waste management", "recycling", "scrap recycling", "hazardous waste", "e-waste", "circular economy", "waste processing", "composting"],
    keyDecisionMakerTitles: ["Managing Director", "Chief Sustainability Officer", "Operations Director", "Plant Head", "Proprietor"],
    typicalRetainerINR: "₹90,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$3,500 – $15,000 / month",
    primaryPainPoints: ["Fluctuating commodity prices for recycled plastics and metals", "Strict environmental pollution board inspections", "Contamination in raw waste sorting"],
    psychologicalBuyingDrivers: ["Securing long-term municipal or corporate ESG waste disposal contracts", "Statutory EPR (Extended Producer Responsibility) credit sales"],
    outreachAngle: "Monetize corporate EPR obligations and win municipal industrial waste disposal contracts.",
    osmTags: ["amenity=recycling", "amenity=waste_disposal"],
    registryKeywords: ["Waste Management", "Recycling", "Environmental Services", "EPR Compliance"],
  },
  telecom_fiber: {
    id: "telecom_fiber",
    name: "Telecommunications & Fiber Infrastructure",
    category: "technology",
    serviceTrack: "technical",
    synonyms: ["telecom", "telecommunications", "fiber optic", "broadband isp", "5g infrastructure", "tower management", "network contractor", "voip"],
    keyDecisionMakerTitles: ["Chief Technology Officer", "VP Network Operations", "Head of Fiber Rollout", "Managing Director", "Director of Infrastructure"],
    typicalRetainerINR: "₹2,00,000 – ₹8,00,000 / month",
    typicalRetainerUSD: "$7,500 – $30,000 / month",
    primaryPainPoints: ["Right-of-Way (RoW) municipal fiber digging permits", "Fiber cut downtime and field repair logistics", "Competition from low-margin consumer telco giants"],
    psychologicalBuyingDrivers: ["High-margin dedicated enterprise leased-line contracts", "Long-term 5G small cell infrastructure rollout"],
    outreachAngle: "Target enterprise corporate parks and industrial zones with guaranteed 99.999% SLA dedicated leased lines.",
    osmTags: ["office=telecommunication", "utility=telecom"],
    registryKeywords: ["Telecommunications", "Fiber Infrastructure", "Broadband Services", "Network Infrastructure"],
  },
  mining_minerals: {
    id: "mining_minerals",
    name: "Mining & Mineral Extraction",
    category: "energy",
    serviceTrack: "technical",
    synonyms: ["mining", "minerals", "quarry", "aggregate mining", "iron ore", "bauxite", "crushed stone", "mineral exploration", "mining contractor"],
    keyDecisionMakerTitles: ["Managing Director", "VP Mining Operations", "Chief Geologist", "Mines Manager", "General Manager - Extraction"],
    typicalRetainerINR: "₹3,00,000 – ₹15,00,000 / month",
    typicalRetainerUSD: "$12,000 – $60,000 / month",
    primaryPainPoints: ["Environmental clearances and mining lease renewals", "Heavy earthmoving equipment breakdown costs", "Safety protocol adherence and labor risks"],
    psychologicalBuyingDrivers: ["Maximum extraction yield with zero statutory safety violations", "Long-term off-take agreements with steel and cement plants"],
    outreachAngle: "Secure multi-year off-take agreements with industrial manufacturers seeking verified mineral provenance.",
    osmTags: ["landuse=quarry", "industrial=mine"],
    registryKeywords: ["Mining", "Mineral Extraction", "Quarries", "Earthmoving"],
  },
  staffing_recruitment: {
    id: "staffing_recruitment",
    name: "Executive Staffing & HR Consulting",
    category: "professional_services",
    serviceTrack: "creative+technical",
    synonyms: ["staffing", "recruitment", "headhunting", "executive search", "hr consulting", "contract staffing", "talent acquisition agency", "manpower"],
    keyDecisionMakerTitles: ["Managing Partner", "Chief Executive Officer", "Head of Search", "Director of Talent Solutions", "Principal Consultant"],
    typicalRetainerINR: "₹75,000 – ₹3,50,000 / month",
    typicalRetainerUSD: "$3,000 – $14,000 / month",
    primaryPainPoints: ["Candidate ghosting post-offer letter issuance", "Lengthy client placement fee payment terms", "Commoditization of resume matching"],
    psychologicalBuyingDrivers: ["Retained exclusive executive searches", "Long-term preferred vendor list (PVL) status with Fortune 500s"],
    outreachAngle: "Replace resume-throwing with verified leadership psychometric shortlists that win retained executive search mandates.",
    osmTags: ["office=employment_agency"],
    registryKeywords: ["Staffing Agency", "Recruitment", "Executive Search", "HR Consulting"],
  },
  insurance_brokerage: {
    id: "insurance_brokerage",
    name: "Insurance Broking & Risk Advisory",
    category: "professional_services",
    serviceTrack: "technical",
    synonyms: ["insurance", "insurance broker", "risk management", "underwriting", "commercial insurance", "general insurance", "group health policy"],
    keyDecisionMakerTitles: ["Principal Officer & Director", "Managing Director", "Head of Corporate Broking", "VP Risk Advisory", "Owner"],
    typicalRetainerINR: "₹1,00,000 – ₹5,00,000 / month",
    typicalRetainerUSD: "$4,000 – $20,000 / month",
    primaryPainPoints: ["Price-based premium wars on commodity policies", "Complex claims rejection causing client friction", "Regulatory capital and solvency maintenance"],
    psychologicalBuyingDrivers: ["Managing comprehensive corporate group health and cyber-liability portfolios", "High annual renewal persistency"],
    outreachAngle: "Unlock enterprise corporate group health and director liability policies by demonstrating customized risk audits.",
    osmTags: ["office=insurance"],
    registryKeywords: ["Insurance Brokers", "Risk Management", "Corporate Insurance", "Underwriting"],
  },
  event_mice: {
    id: "event_mice",
    name: "Events, Exhibitions & MICE Management",
    category: "creative",
    serviceTrack: "creative",
    synonyms: ["events", "event management", "mice", "exhibitions", "trade shows", "corporate conferences", "experiential marketing", "av production"],
    keyDecisionMakerTitles: ["Founder & Managing Director", "Chief Creative Officer", "VP Event Operations", "Director of Production", "Executive Producer"],
    typicalRetainerINR: "₹80,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$3,000 – $15,000 / month",
    primaryPainPoints: ["Last-minute venue coordination hiccups", "Cash flow gaps between vendor advances and client post-event settlement", "Seasonal revenue droughts"],
    psychologicalBuyingDrivers: ["Flawless execution of flagship annual corporate expos and government summits", "Creative buzz and experiential wow factor"],
    outreachAngle: "Pitch turnkey annual conference and experiential brand activations directly to enterprise CMOs.",
    osmTags: ["office=event_management", "amenity=events_venue"],
    registryKeywords: ["Event Management", "MICE", "Corporate Exhibitions", "Experiential Events"],
  },
  packaging_manufacturing: {
    id: "packaging_manufacturing",
    name: "Packaging & Corrugated Box Manufacturing",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["packaging", "corrugated boxes", "cartons", "packaging supplies", "paper packaging", "rigid boxes", "flexible packaging", "blister pack"],
    keyDecisionMakerTitles: ["Managing Director", "Plant Head", "VP Packaging Solutions", "Operations Director", "Proprietor"],
    typicalRetainerINR: "₹90,000 – ₹4,50,000 / month",
    typicalRetainerUSD: "$3,500 – $16,000 / month",
    primaryPainPoints: ["Kraft paper raw material price swings", "Storage warehousing footprint for bulky corrugated sheets", "Tooling die preparation time"],
    psychologicalBuyingDrivers: ["Securing high-volume monthly recurring carton supply contracts for FMCG and e-commerce leaders", "Sustainable biodegradable options"],
    outreachAngle: "Position your corrugated packaging plant as the preferred supply partner for high-volume D2C and FMCG brands.",
    osmTags: ["industrial=factory", "craft=paper_production"],
    registryKeywords: ["Packaging", "Corrugated Boxes", "Carton Manufacturing", "Flexible Packaging"],
  },
  chemicals_polymers: {
    id: "chemicals_polymers",
    name: "Specialty Chemicals & Polymers",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["chemicals", "specialty chemicals", "polymers", "resins", "industrial solvents", "chemical manufacturing", "adhesives", "coatings"],
    keyDecisionMakerTitles: ["Managing Director", "Chief Technology Officer", "VP Chemical Synthesis", "Head of Plant Operations", "Technical Director"],
    typicalRetainerINR: "₹1,50,000 – ₹7,50,000 / month",
    typicalRetainerUSD: "$6,000 – $30,000 / month",
    primaryPainPoints: ["Strict environmental pollution control norms and hazardous waste handling", "Raw petroleum derivative feedstock price shocks", "Extensive client sample qualification testing"],
    psychologicalBuyingDrivers: ["Proprietary custom chemical synthesis patents", "Multi-year chemical supply contracts with paints, textile, and automotive OEMs"],
    outreachAngle: "Connect your custom specialty chemical formulations directly with manufacturing procurement heads seeking reliable domestic alternatives.",
    osmTags: ["industrial=factory", "office=company"],
    registryKeywords: ["Specialty Chemicals", "Polymers", "Chemical Manufacturing", "Resins"],
  },
  hvac_mechanical: {
    id: "hvac_mechanical",
    name: "HVAC & Commercial Cold Storage",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["hvac", "commercial hvac", "air conditioning contractor", "cold storage", "chiller plant", "industrial refrigeration", "mep contractor"],
    keyDecisionMakerTitles: ["Managing Director", "Chief MEP Engineer", "VP Projects", "Head of HVAC Services", "Operations Manager"],
    typicalRetainerINR: "₹80,000 – ₹4,00,000 / month",
    typicalRetainerUSD: "$3,000 – $15,000 / month",
    primaryPainPoints: ["Seasonal summer installation spikes followed by winter service dips", "Emergency breakdown response time in pharma cold storage", "Refrigerant phase-out compliance"],
    psychologicalBuyingDrivers: ["High-margin annual maintenance contracts (AMC)", "Turnkey MEP contracts for commercial malls and data centers"],
    outreachAngle: "Win lucrative annual maintenance contracts (AMC) and cold storage design projects for commercial real estate developments.",
    osmTags: ["craft=hvac", "office=engineer"],
    registryKeywords: ["HVAC Contractors", "Refrigeration", "Cold Storage", "MEP Engineering"],
  },
  cleanroom_engineering: {
    id: "cleanroom_engineering",
    name: "Cleanroom Engineering & Contamination Control",
    category: "industrial",
    serviceTrack: "technical",
    synonyms: ["cleanroom", "contamination control", "hvac cleanroom", "iso cleanroom", "pharma cleanroom", "semiconductor cleanroom", "laminar airflow"],
    keyDecisionMakerTitles: ["Managing Director", "Chief Technical Officer", "Head of Cleanroom Projects", "VP Engineering", "Project Director"],
    typicalRetainerINR: "₹1,50,000 – ₹7,00,000 / month",
    typicalRetainerUSD: "$6,000 – $26,000 / month",
    primaryPainPoints: ["ISO 14644 particle count validation failures", "HEPA/ULPA filter pressure drop balancing", "Strict sterile pharma regulatory validation"],
    psychologicalBuyingDrivers: ["Turnkey turnkey sterile facilities that pass international audits on day one", "Engineering supremacy in high-tech manufacturing"],
    outreachAngle: "Pitch turnkey ISO-certified cleanroom construction to biotech, pharma, and semiconductor manufacturers.",
    osmTags: ["industrial=factory", "office=engineer"],
    registryKeywords: ["Cleanroom Engineering", "Contamination Control", "Modular Cleanrooms"],
  },
  commercial_printing: {
    id: "commercial_printing",
    name: "Commercial Printing & Signage",
    category: "commerce",
    serviceTrack: "creative+technical",
    synonyms: ["printing", "commercial printing", "offset printing", "digital printing", "signage", "wide format printing", "labels printing", "brochures printing"],
    keyDecisionMakerTitles: ["Managing Director", "Head of Print Operations", "Sales Director", "Proprietor", "General Manager"],
    typicalRetainerINR: "₹50,000 – ₹2,50,000 / month",
    typicalRetainerUSD: "$2,000 – $9,000 / month",
    primaryPainPoints: ["Digital paperless shift hurting traditional paper print volumes", "Paper roll commodity inflation", "Color matching disputes with advertising agencies"],
    psychologicalBuyingDrivers: ["High-volume product label and luxury packaging print runs", "Corporate retail rollout signage mandates"],
    outreachAngle: "Secure exclusive multi-location retail branding and high-volume product label printing contracts.",
    osmTags: ["craft=printer", "shop=copyshop"],
    registryKeywords: ["Commercial Printing", "Offset Printing", "Digital Printing", "Signage"],
  },
  security_surveillance: {
    id: "security_surveillance",
    name: "Security Services & Facility Protection",
    category: "professional_services",
    serviceTrack: "technical",
    synonyms: ["security services", "security guards", "facility management", "cctv surveillance", "access control", "bouncers", "cash-in-transit security"],
    keyDecisionMakerTitles: ["Managing Director", "Director of Operations", "Chief Security Officer", "General Manager - Operations", "Proprietor"],
    typicalRetainerINR: "₹70,000 – ₹3,50,000 / month",
    typicalRetainerUSD: "$2,500 – $12,000 / month",
    primaryPainPoints: ["Guard attrition and absenteeism", "Statutory PF/ESI labor compliance overhead", "Competitive wage undercutting by unorganized firms"],
    psychologicalBuyingDrivers: ["Prestigious commercial corporate park contracts with certified zero-incident security records", "Integrated tech-enabled surveillance"],
    outreachAngle: "Win premium corporate security contracts by offering hybrid guard and AI-powered CCTV surveillance.",
    osmTags: ["office=security"],
    registryKeywords: ["Security Services", "Facility Protection", "Surveillance", "Manned Guarding"],
  },
  luxury_goods_jewelry: {
    id: "luxury_goods_jewelry",
    name: "Luxury Goods & Fine Jewelry",
    category: "lifestyle",
    serviceTrack: "creative",
    synonyms: ["jewelry", "fine jewelry", "diamonds", "gold jeweler", "horology", "luxury watches", "high-end boutique", "gemstones", "couture"],
    keyDecisionMakerTitles: ["Founder & Managing Director", "Master Jeweler", "Head of Retail", "Creative Director", "Proprietor"],
    typicalRetainerINR: "₹1,00,000 – ₹6,00,000 / month",
    typicalRetainerUSD: "$4,000 – $22,000 / month",
    primaryPainPoints: ["High inventory capital lock-in for gold/diamonds", "Security and transit insurance premiums", "Client skepticism on stone certification"],
    psychologicalBuyingDrivers: ["Generational family patronage for bridal jewelry", "Ultra-exclusive private salon appointments"],
    outreachAngle: "Attract high-net-worth bridal and bespoke jewelry buyers with private invitation-only salon previews.",
    osmTags: ["shop=jewelry", "shop=watches"],
    registryKeywords: ["Jewelry", "Fine Jewelry", "Luxury Goods", "Diamonds"],
  },
};

// ============================================================================
// 2. GLOBAL REGIONS & COMMERCIAL HUBS ALIASES
// ============================================================================
export const GLOBAL_REGIONS_MAP: Record<string, RegionMapping> = {
  ncr_india: {
    region: "National Capital Region (NCR), India",
    countries: ["India"],
    commercialHubs: ["Delhi", "New Delhi", "Gurugram", "Noida", "Faridabad", "Ghaziabad"],
    defaultCurrency: "INR",
    taxRegime: "GST (CGST/SGST/IGST 18%)",
  },
  mumbai_metropolitan: {
    region: "Mumbai Metropolitan Region (MMR), India",
    countries: ["India"],
    commercialHubs: ["Mumbai", "Navi Mumbai", "Thane", "Kalyan", "BKC", "Nariman Point"],
    defaultCurrency: "INR",
    taxRegime: "GST (CGST/SGST/IGST 18%)",
  },
  bay_area_usa: {
    region: "San Francisco Bay Area, United States",
    countries: ["United States"],
    commercialHubs: ["San Francisco", "San Jose", "Palo Alto", "Oakland", "Sunnyvale", "Mountain View"],
    defaultCurrency: "USD",
    taxRegime: "California State Sales Tax & Nexus (7.25% - 10.25%)",
  },
  tri_state_usa: {
    region: "Tri-State Area (NY-NJ-CT), United States",
    countries: ["United States"],
    commercialHubs: ["New York", "Manhattan", "Brooklyn", "Jersey City", "Newark", "Stamford"],
    defaultCurrency: "USD",
    taxRegime: "State Sales Tax & Local Surcharge",
  },
  texas_triangle_usa: {
    region: "Texas Triangle, United States",
    countries: ["United States"],
    commercialHubs: ["Austin", "Houston", "Dallas", "Fort Worth", "San Antonio"],
    defaultCurrency: "USD",
    taxRegime: "Texas Sales Tax (6.25% - 8.25%)",
  },
  greater_london_uk: {
    region: "Greater London & South East, United Kingdom",
    countries: ["United Kingdom"],
    commercialHubs: ["London", "Westminster", "Canary Wharf", "City of London", "Reading"],
    defaultCurrency: "GBP",
    taxRegime: "UK VAT (20% Standard)",
  },
  dach_europe: {
    region: "DACH Region (Germany, Austria, Switzerland)",
    countries: ["Germany", "Austria", "Switzerland"],
    commercialHubs: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Vienna", "Zurich", "Geneva"],
    defaultCurrency: "EUR",
    taxRegime: "EU VAT / Swiss MWST (19% DE, 20% AT, 8.1% CH)",
  },
  gcc_middle_east: {
    region: "Gulf Cooperation Council (GCC)",
    countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"],
    commercialHubs: ["Dubai", "Abu Dhabi", "Riyadh", "Jeddah", "Doha", "Kuwait City", "Manama"],
    defaultCurrency: "AED",
    taxRegime: "VAT (5% UAE, 15% KSA)",
  },
  anz_pacific: {
    region: "Australia & New Zealand (ANZ)",
    countries: ["Australia", "New Zealand"],
    commercialHubs: ["Sydney", "Melbourne", "Brisbane", "Perth", "Auckland", "Wellington"],
    defaultCurrency: "AUD",
    taxRegime: "GST (10% Australia, 15% New Zealand)",
  },
  nordics_europe: {
    region: "Nordic Region",
    countries: ["Sweden", "Norway", "Denmark", "Finland"],
    commercialHubs: ["Stockholm", "Oslo", "Copenhagen", "Helsinki", "Gothenburg"],
    defaultCurrency: "SEK",
    taxRegime: "Nordic VAT (25% SE/NO/DK, 25.5% FI)",
  },
  east_asia_hubs: {
    region: "East Asia Commercial Hubs",
    countries: ["Japan", "South Korea", "Taiwan", "Hong Kong", "Singapore"],
    commercialHubs: ["Tokyo", "Osaka", "Seoul", "Taipei", "Hong Kong", "Singapore"],
    defaultCurrency: "USD",
    taxRegime: "Territorial / Consumption Tax (10% JP, 10% KR, 5% TW, 9% SG)",
  },
};

// ============================================================================
// 3. TAX, ACCOUNTING & COMPLIANCE DEEP KNOWLEDGE GRAPH
// ============================================================================
export const TAX_COMPLIANCE_KNOWLEDGE: Record<string, TaxGuidance> = {
  gst_intra_state: {
    topic: "Intra-State GST (CGST + SGST)",
    applicableLaw: "Sections 7, 8, & 9 of Central Goods and Services Tax (CGST) Act 2017",
    rules: [
      "Where supplier location and place of supply are in the same Indian State/UT, supply is Intra-State.",
      "Statutory rate is split equally: 9% Central GST (CGST) + 9% State GST (SGST) for standard 18% services.",
      "Invoice must clearly display supplier GSTIN, recipient GSTIN, SAC code, and individual CGST/SGST amounts.",
      "Buyer can claim 100% Input Tax Credit (ITC) if supply is for business furtherance and filed in GSTR-1.",
    ],
    formula: "CGST = Round(Subtotal * 0.09); SGST = Round(Subtotal * 0.09); TotalTax = CGST + SGST",
    sacOrHsnCode: "998313 (Software) / 998311 (Consulting)",
  },
  gst_inter_state: {
    topic: "Inter-State GST (IGST)",
    applicableLaw: "Sections 5 & 7 of Integrated Goods and Services Tax (IGST) Act 2017",
    rules: [
      "Where supplier location and place of supply are in different States/UTs, supply is Inter-State.",
      "Levied as 18% Integrated GST (IGST).",
      "Recipient in destination state utilizes IGST credit against their output IGST, CGST, or SGST liability under Section 49.",
    ],
    formula: "IGST = Round(Subtotal * 0.18); TotalTax = IGST",
    sacOrHsnCode: "998313 (IT Services)",
  },
  reverse_charge_mechanism: {
    topic: "Reverse Charge Mechanism (RCM)",
    applicableLaw: "Section 9(3) & 9(4) of CGST Act 2017 & Notification No. 13/2017-Central Tax (Rate)",
    rules: [
      "Recipient is liable to pay GST directly to the government instead of supplier.",
      "Mandatory RCM categories: Legal services by an Individual Advocate/Firm of Advocates; Services by Goods Transport Agency (GTA); Sponsorship services; Services by Director to company.",
      "Supplier must not charge GST on invoice and must explicitly state: 'Tax Payable under Reverse Charge: YES'.",
      "Recipient pays RCM in cash through electronic cash ledger and can claim 100% ITC in the same month.",
    ],
    complianceWarning: "Do not charge GST on invoices issued by advocates or GTAs under RCM. Recipient pays directly.",
  },
  input_tax_credit_eligibility: {
    topic: "Input Tax Credit (ITC) & Blocked Credits",
    applicableLaw: "Section 16 & Section 17(5) of CGST Act 2017",
    rules: [
      "Section 16 allows full ITC on goods/services used in the course or furtherance of business.",
      "Section 17(5) explicitly BLOCKS ITC on: Motor vehicles (seating <= 13), Food & beverages, Outdoor catering, Health club & gym memberships, Goods lost/stolen/destroyed, Goods used for personal consumption.",
      "ITC can only be claimed if: Supplier filed GSTR-1 (reflected in buyer GSTR-2B), tax was paid to government, and buyer has received tax invoice.",
    ],
    complianceWarning: "Never claim ITC on team lunches, gym memberships, or personal electronics. Strictly blocked under Section 17(5).",
  },
  export_services_lut: {
    topic: "Export of Services under LUT (Zero-Rated Supply)",
    applicableLaw: "Section 16(3) & Section 2(6) of IGST Act 2017",
    rules: [
      "Five mandatory conditions for 'Export of Service': 1) Supplier located in India; 2) Recipient located outside India; 3) Place of supply outside India; 4) Payment received in convertible foreign exchange (or INR via authorized Vostro account); 5) Supplier and recipient are not merely establishments of distinct persons.",
      "Supply under Letter of Undertaking (LUT, Form GST RFD-11): 0% GST charged on invoice.",
      "Mandatory invoice declaration: 'SUPPLY MEANT FOR EXPORT OF SERVICES UNDER LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX'.",
      "FIRC (Foreign Inward Remittance Certificate) or BRC from bank must be archived for statutory audit.",
    ],
    formula: "Tax = 0; Invoice Total = Subtotal (FIRC required)",
    complianceWarning: "Without a valid filed LUT for the financial year, 18% IGST must be paid upfront and claimed as refund later.",
  },
  uk_vat_rules: {
    topic: "UK Value Added Tax (VAT)",
    applicableLaw: "Value Added Tax Act 1994 (UK HMRC)",
    rules: [
      "Standard rate of 20% applies to taxable supplies of services made by UK registered entities.",
      "Registration threshold is £90,000 annual taxable turnover (from April 2024).",
      "Cross-border B2B services supplied to non-UK businesses are outside the scope of UK VAT (General Place of Supply Rule).",
    ],
    formula: "VAT = Round(Subtotal * 0.20)",
  },
  australian_gst_rules: {
    topic: "Australian Goods and Services Tax (GST)",
    applicableLaw: "A New Tax System (Goods and Services Tax) Act 1999 (ATO)",
    rules: [
      "Standard rate of 10% applies to taxable supplies connected with Australia.",
      "Registration threshold is AUD $75,000 annual turnover.",
      "Supplies of services to non-resident entities outside Australia are generally GST-free exports.",
    ],
    formula: "GST = Round(Subtotal * 0.10)",
  },
};

// ============================================================================
// 4. SALES OBJECTION HANDLING & OUTREACH BATTLECARDS (20 SCENARIOS)
// ============================================================================
export const SALES_OBJECTION_BATTLECARDS: Record<string, SalesBattlecard> = {
  already_have_team: {
    objection: "We already have an in-house team / agency handling this.",
    category: "competition",
    psychologicalInsight: "Prospect fears redundancy and feels protective of their internal team or current vendor relationship.",
    reframeQuestion: "Is your team currently hitting 100% of their bandwidth on core projects, or do they have time to build custom intelligence pipelines from scratch?",
    emailScript: "Totally respect that you have an established team in place, {OwnerFirstName}. Most principals we partner with do as well. Rather than replacing anyone, we act as a specialized force multiplier that feeds your team verified high-ticket accounts so they spend zero hours on manual prospecting. Would you be open to a 5-minute teardown comparing our discovery yield?",
    phoneWhatsappScript: "Makes total sense, {OwnerFirstName}. We don't replace your team—we hand them pre-qualified decision-makers so they spend their entire day closing deals instead of searching for leads. Have you seen our recent report on {Industry} benchmarks in {City}?",
  },
  price_too_high: {
    objection: "Your price is too high / we don't have budget right now.",
    category: "budget",
    psychologicalInsight: "Prospect perceives price as an unhedged cost rather than comparing it against their customer lifetime value (LTV).",
    reframeQuestion: "What is your average client lifetime value—and if closing just one account covers this 3x over, does budget remain the barrier?",
    emailScript: "Completely understand that every capital allocation needs an airtight business case, {OwnerFirstName}. For context, our average {Industry} partner requires just 1 closed contract from our pipeline to achieve a 400% ROI on our retainer. Let's look at the numbers together—if the unit economics don't prove out on paper, we shouldn't do business.",
    phoneWhatsappScript: "I appreciate the transparency on budget, {OwnerFirstName}. Quick question: what is a single new client worth to {CompanyName}? If our pipeline delivers 2 this quarter, the system pays for itself plus profit. Can I walk you through the unit economics?",
  },
  tried_this_burned: {
    objection: "We tried lead generation agencies before and got burned / bad experience.",
    category: "skepticism",
    psychologicalInsight: "Prospect was burned by spammy low-quality scraping lists or generic email blasts that damaged their domain reputation.",
    reframeQuestion: "Did that agency use shared spam broker lists like Apollo/ZoomInfo, or did they resolve direct verified owner intelligence with provenance?",
    emailScript: "I hear that constantly, {OwnerFirstName}, and frankly, 90% of lead generation agencies deserve that reputation because they sell recycled broker lists that burn company domains. We operate under a strict sovereign rule: UNKNOWN > WRONG. We never fabricate contacts, and every lead is verified through cryptographic registry and mailserver checks. I'd love to show you proof of our verification logs.",
    phoneWhatsappScript: "I completely empathize, {OwnerFirstName}. Most agencies blast spam from generic lists. We built our entire engine around zero third-party broker dependencies and verify every owner contact directly. Would you like to see our verification audit on 3 of your competitors?",
  },
  send_me_an_email: {
    objection: "Send me an email / send more info.",
    category: "brush_off",
    psychologicalInsight: "Classic polite deflection to end the interaction without committing time.",
    reframeQuestion: "I'd be glad to send an email—what specific metric would make reading it worth 3 minutes of your time?",
    emailScript: "Following up as requested, {OwnerFirstName}. Rather than a generic deck, here are 3 specific unlisted growth opportunities we identified for {CompanyName} in {City}: 1) Uncaptured market share in {Industry}, 2) High-margin client demand, 3) 14-day turnaround. Which of these is your highest priority this quarter?",
    phoneWhatsappScript: "Will do, {OwnerFirstName}. To make sure I send only relevant numbers: is your focus right now more on expanding in {City} or improving close rates? I'll send a 1-page summary tailored to that.",
  },
  not_looking_right_now: {
    objection: "We are happy with our current setup / not looking right now.",
    category: "timing",
    psychologicalInsight: "Complacency and inertia; prospect does not recognize the opportunity cost of stagnant pipeline growth.",
    reframeQuestion: "Even if you aren't actively shopping today, do you know what your competitors in {City} are doing to secure enterprise contracts before Q4?",
    emailScript: "Glad to hear things are stable, {OwnerFirstName}. Most leaders we speak with aren't looking to switch systems when things are fine—until an unexpected contract churn occurs. We put together a brief competitive intelligence dossier on how {Industry} firms in {City} are modernizing their client acquisition. Worth a glance for your strategic planning?",
    phoneWhatsappScript: "Understood, {OwnerFirstName}. Glad to hear you're fully booked. If we check back in 60 days, what would be the single most exciting capability you'd want to see?",
  },
  how_did_you_get_number: {
    objection: "How did you get my number / unlisted email?",
    category: "authority",
    psychologicalInsight: "Concern over privacy and aggressive scraping; seeks reassurance of legitimate business research.",
    reframeQuestion: "Are you concerned about privacy compliance, or curious how our enterprise OSINT verified your public corporate entity?",
    emailScript: "Happy to be transparent, {OwnerFirstName}. Our research engine verifies corporate ownership through statutory public records (such as corporate registries, MCA/ASIC filings, and official domain RDAP infrastructure). Because your work with {CompanyName} is prominent, our system flagged you as the key decision-maker. We strictly respect privacy and never purchase third-party spam lists.",
    phoneWhatsappScript: "Completely understand asking, {OwnerFirstName}. Our research team mapped {CompanyName}'s public corporate filings and domain infrastructure for {City}. We never buy sketchy broker lists—everything is verified through public corporate registry records.",
  },
  call_back_next_quarter: {
    objection: "Call back next quarter / busy right now.",
    category: "timing",
    psychologicalInsight: "Prospect is overwhelmed with immediate operational fires and kicks strategic planning down the road.",
    reframeQuestion: "If we wait until next quarter, will you have lost 90 days of prospective pipeline that your competitors are locking down today?",
    emailScript: "Will mark my calendar for next quarter, {OwnerFirstName}. One thing to consider: pipeline systems take 30 days to build and season. If we start next quarter, you won't see closed revenue until two quarters out. If we spend 15 minutes setting the blueprint now, it runs autonomously in the background until you are ready. Does Thursday morning make sense?",
    phoneWhatsappScript: "Happy to reconnect next quarter, {OwnerFirstName}. Just keep in mind that setting up the pipeline takes a couple of weeks, so starting then pushes results back another 60 days. Can we spend 5 minutes on Friday just to benchmark your current acquisition velocity?",
  },
  word_of_mouth_only: {
    objection: "We get all our business through word of mouth and referrals.",
    category: "skepticism",
    psychologicalInsight: "Proud of high-quality reputation, but oblivious to the fact that referrals cannot be scaled or forecasted on demand.",
    reframeQuestion: "Referrals are the best validation of your work—but can you control their volume on a month-to-month basis when you want to expand?",
    emailScript: "Referral-driven growth is proof of {CompanyName}'s exceptional reputation, {OwnerFirstName}. The challenge we hear from top principals is that referrals are unpredictable—you can't turn a dial to generate 3 more next month when capacity opens up. We provide a sovereign pipeline that complements your referrals with predictable, high-margin accounts. Worth comparing notes?",
    phoneWhatsappScript: "That's fantastic, {OwnerFirstName}—word of mouth is the highest praise. But what happens during quiet months? Our system gives you a predictable tap you can open whenever your team has capacity. Could we show you how that works?",
  },
  is_this_ai_spam: {
    objection: "Is this an automated AI bot or mass spam?",
    category: "skepticism",
    psychologicalInsight: "Fatigued by ChatGPT-generated generic fluff and mass blast mailers.",
    reframeQuestion: "Have you noticed how generic AI emails sound, versus an analysis specifically referencing your published company filings?",
    emailScript: "No automated mass blasts here, {OwnerFirstName}. I personally reviewed {CompanyName}'s presence in {City} and specifically noticed your focus on {Industry}. We use in-house AI strictly to calculate exact tax splits and run deep OSINT verifications, but every strategic angle is built specifically for your leadership. What's your current priority for this year?",
    phoneWhatsappScript: "I'm a real human researcher, {OwnerFirstName}! We use our sovereign AI tools strictly to analyze public corporate filings so we don't waste your time with generic pitches. I noticed your recent expansion in {City}—are you taking on new commercial clients this month?",
  },
};

// ============================================================================
// 5. IN-HOUSE SYSTEM DIAGNOSTICS & TROUBLESHOOTING ENGINE
// ============================================================================
export const SYSTEM_DIAGNOSTICS_KNOWLEDGE: Record<string, SystemDiagnosticGuide> = {
  smtp_port_25: {
    component: "smtp_port_25",
    issueTitle: "Outbound SMTP Port 25 Blocked by ISP / Cloud Host",
    symptoms: [
      "SMTP verification reports connection timeout",
      "Network error ETIMEDOUT when connecting to MX mail exchange host",
      "Studio Settings displays 'Port 25 Reachability: BLOCKED'",
    ],
    diagnosticCommand: "Test-NetConnection -ComputerName aspmx.l.google.com -Port 25",
    rootCause: "Residential ISPs, AWS, Azure, DigitalOcean, and GCP block outbound TCP port 25 by default to prevent unauthorized spam relays.",
    resolutionSteps: [
      "1. Enable HTTPS-based verification fallbacks in Studio Settings (Microsoft GetCredentialType / Autodiscover).",
      "2. For Google Workspace domains, verify MX DNS records and fallback to Google Admin directory lookup.",
      "3. Use external SMTP relay providers (SendGrid, Mailgun, Postmark) on port 587 / 465 with authenticated TLS.",
      "4. Submit an ISP unblock request or cloud provider quota exemption for static IP port 25.",
    ],
  },
  ollama_vllm: {
    component: "ollama_vllm",
    issueTitle: "Self-Hosted Local LLM Offline or Unreachable",
    symptoms: [
      "Inference fails with 'FetchError: ECONNREFUSED 127.0.0.1:11434'",
      "System falls back to deterministic rule-based parsing",
      "Copilot Brain reports 'inferenceProvider: self_sovereign_rules'",
    ],
    diagnosticCommand: "curl -s http://127.0.0.1:11434/api/version",
    rootCause: "Ollama daemon is not running, vLLM server crashed, or port 11434/8000 is occupied by another process.",
    resolutionSteps: [
      "1. Start Ollama daemon: run `ollama serve` in a background terminal.",
      "2. Verify installed models: run `ollama list` and ensure `mistral` or `llama3` is downloaded.",
      "3. If pulling a new model: execute `ollama pull mistral:latest`.",
      "4. Verify Studio Settings endpoint is set to `http://127.0.0.1:11434` with OpenAI compatibility enabled.",
    ],
  },
  searxng_waterfall: {
    component: "searxng_waterfall",
    issueTitle: "SearXNG / Web Discovery Rate-Limiting & Waterfall Degradation",
    symptoms: [
      "Discovery waterfall returns 429 Too Many Requests from public SearXNG instances",
      "Discovery latency increases beyond 10,000ms",
      "Stream A web search returns 0 candidates",
    ],
    diagnosticCommand: "curl -I 'https://searx.be/search?q=test&format=json'",
    rootCause: "Public meta-search nodes block aggressive automated crawlers or rate-limit concurrent queries.",
    resolutionSteps: [
      "1. The waterfall automatically cascades to Stream B (Overpass OpenStreetMap QL) and Stream C (Corporate Registries: OpenCorporates, MCA, ASIC).",
      "2. Configure a sovereign private SearXNG Docker container on `http://localhost:8080` in Studio Settings.",
      "3. Enable random jitter (500ms - 2000ms) between query dispatches.",
      "4. Utilize local corporate registry caches for known company names.",
    ],
  },
  ledger_balance: {
    component: "ledger_balance",
    issueTitle: "Double-Entry Accounting Ledger Discrepancy (Debit != Credit)",
    symptoms: [
      "Ledger balance assertion fails",
      "Total debits do not equal total credits across accounts",
      "P&L calculation throws reconciliation warning",
    ],
    diagnosticCommand: "node --test tests/phase15-unified-business-os.test.mjs",
    rootCause: "Floating point arithmetic drift or partial transaction posting where one side of the journal entry failed to record.",
    resolutionSteps: [
      "1. SoleTrust Business OS enforces strict integer-cent math (`cents` / `paise`). Ensure all currency values are integers.",
      "2. Inspect the latest journal entry in `dbStore.listJournalEntries()` for missing balancing line.",
      "3. Use `ledger-engine.ts` postJournalEntry() which rejects any transaction where sum(debits) !== sum(credits).",
    ],
  },
  client_portal: {
    component: "client_portal",
    issueTitle: "Client Magic-Link Portal Token Expired or Invalid",
    symptoms: [
      "Client sees 'Portal link expired or invalid'",
      "E-signature submission fails with 401 Unauthorized",
      "Client cannot view shared project milestones or invoices",
    ],
    diagnosticCommand: "node -e 'console.log(crypto.createHash(\"sha256\").update(token).digest(\"hex\"))'",
    rootCause: "Magic-link tokens expire after 72 hours for security, or the company ID has changed.",
    resolutionSteps: [
      "1. Go to CRM Relations -> Clients -> Select Client.",
      "2. Click 'Regenerate Magic-Link' to issue a fresh 72-hour SHA-256 signed portal URL.",
      "3. Dispatch new portal invite via WhatsApp/Email with the renewed link.",
    ],
  },
};

/**
 * Universal Query & Knowledge Resolver
 * Given any freeform user question, finds the best matching industry taxonomy,
 * regional geography, tax guidance, objection battlecard, or diagnostic guide.
 */
export function resolveUniversalKnowledge(query: string): {
  matchedIndustry?: IndustryTaxonomy;
  matchedRegion?: RegionMapping;
  matchedTax?: TaxGuidance;
  matchedBattlecard?: SalesBattlecard;
  matchedDiagnostic?: SystemDiagnosticGuide;
  summary: string;
} {
  const q = query.toLowerCase().trim();

  // 1. Check for Diagnostic intent
  for (const guide of Object.values(SYSTEM_DIAGNOSTICS_KNOWLEDGE)) {
    if (
      (guide.component === "smtp_port_25" && (q.includes("port 25") || q.includes("smtp"))) ||
      (guide.component === "ollama_vllm" && (q.includes("ollama") || q.includes("vllm") || q.includes("local llm"))) ||
      (guide.component === "searxng_waterfall" && (q.includes("searxng") || q.includes("rate limit") || q.includes("waterfall blocked"))) ||
      (guide.component === "ledger_balance" && (q.includes("ledger") || q.includes("debit credit") || q.includes("double entry") || q.includes("double-entry"))) ||
      (guide.component === "client_portal" && (q.includes("portal") || q.includes("magic link") || q.includes("magic-link")))
    ) {
      return {
        matchedDiagnostic: guide,
        summary: `Diagnostic Guide: ${guide.issueTitle}`,
      };
    }
  }

  // 2. Check for Sales Objection battlecards
  for (const [key, card] of Object.entries(SALES_OBJECTION_BATTLECARDS)) {
    if (
      (key === "already_have_team" && (q.includes("already have a team") || q.includes("in-house team") || q.includes("already have an agency"))) ||
      (key === "price_too_high" && (q.includes("price is too high") || q.includes("too expensive") || q.includes("no budget") || q.includes("cannot afford"))) ||
      (key === "tried_this_burned" && (q.includes("burned before") || q.includes("tried lead gen before") || q.includes("bad agency experience"))) ||
      (key === "send_me_an_email" && (q.includes("send me an email") || q.includes("send more info") || q.includes("send a deck"))) ||
      (key === "not_looking_right_now" && (q.includes("not looking") || q.includes("happy with current") || q.includes("not interested"))) ||
      (key === "how_did_you_get_number" && (q.includes("how did you get my number") || q.includes("where did you find my email") || q.includes("how did you find me"))) ||
      (key === "call_back_next_quarter" && (q.includes("next quarter") || q.includes("call back later") || q.includes("call back next year"))) ||
      (key === "word_of_mouth_only" && (q.includes("word of mouth") || q.includes("referrals only") || q.includes("referral based"))) ||
      (key === "is_this_ai_spam" && (q.includes("is this ai") || q.includes("is this spam") || q.includes("automated message")))
    ) {
      return {
        matchedBattlecard: card,
        summary: `Sales Objection Battlecard: ${card.objection}`,
      };
    }
  }

  // 3. Check for Tax Guidance
  for (const [key, tax] of Object.entries(TAX_COMPLIANCE_KNOWLEDGE)) {
    if (
      (key === "reverse_charge_mechanism" && (q.includes("rcm") || q.includes("reverse charge") || q.includes("legal services gst") || q.includes("advocate gst"))) ||
      (key === "input_tax_credit_eligibility" && (q.includes("itc") || q.includes("input tax credit") || q.includes("blocked credit") || q.includes("section 17(5)"))) ||
      (key === "export_services_lut" && (q.includes("lut") || q.includes("export of service") || q.includes("firc") || q.includes("zero rated") || q.includes("0% export"))) ||
      (key === "uk_vat_rules" && (q.includes("uk vat") || q.includes("vat rate in uk") || q.includes("hmrc vat"))) ||
      (key === "australian_gst_rules" && (q.includes("australian gst") || q.includes("ato gst") || q.includes("gst in australia")))
    ) {
      return {
        matchedTax: tax,
        summary: `Tax Guidance: ${tax.topic}`,
      };
    }
  }

  // 4. Check for Global Industry Taxonomy
  for (const item of Object.values(GLOBAL_INDUSTRY_TAXONOMY)) {
    if (
      item.synonyms.some((syn) => q.includes(syn)) ||
      q.includes(item.name.toLowerCase())
    ) {
      return {
        matchedIndustry: item,
        summary: `Industry Taxonomy: ${item.name}`,
      };
    }
  }

  // 5. Check for Regional Knowledge
  for (const reg of Object.values(GLOBAL_REGIONS_MAP)) {
    if (
      q.includes(reg.region.toLowerCase()) ||
      reg.commercialHubs.some((hub) => q.includes(hub.toLowerCase())) ||
      reg.countries.some((c) => q.includes(c.toLowerCase()))
    ) {
      return {
        matchedRegion: reg,
        summary: `Regional Geography: ${reg.region}`,
      };
    }
  }

  return {
    summary: "General Knowledge Query",
  };
}
