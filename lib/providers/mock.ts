import type {
  CandidateRecord,
  DiscoveryProvider,
  ProviderHealthResult,
  RawDiscoveryResult,
} from "./types.ts";
import type { SearchJobQuery } from "../types/search-job.ts";

export type MockFixtureDecisionMaker = {
  name: string;
  role: string;
  roleLabel: string;
  credentials?: string[];
  specialization?: string;
  department?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
};

export type MockFixture = {
  name: string;
  slug: string;
  employeeRange: string;
  websiteHost?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  decisionMaker?: MockFixtureDecisionMaker;
};

export const DEFAULT_MOCK_FIXTURES: MockFixture[] = [
  {
    name: "Acura Skin & Laser Clinic",
    slug: "acura-clinic",
    employeeRange: "11-50",
    websiteHost: "acuraclinic.com",
    phone: "+91 265 233 4455",
    address: "Alkapuri, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Anita Patel",
      role: "medical_director",
      roleLabel: "Medical Director & Senior Dermatologist",
      credentials: ["MBBS", "MD", "FAAD"],
      specialization: "Clinical Dermatology & Laser Aesthetics",
      department: "Dermatology & Laser Surgery",
      email: "dr.anita@acuraclinic.com",
      linkedinUrl: "https://linkedin.com/in/dr-anita-patel-derm",
    },
  },
  {
    name: "Cutis Skin Care & Cosmetology",
    slug: "cutis-skin-care",
    employeeRange: "1-10",
    websiteHost: "cutisskincare.in",
    phone: "+91 265 244 5566",
    address: "Race Course, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Chirag Desai",
      role: "founder",
      roleLabel: "Founder & Lead Dermatologist",
      credentials: ["MBBS", "DVD"],
      specialization: "Cosmetic Dermatology & Trichology",
      department: "Aesthetic Cosmetology",
      email: "chirag@cutisskincare.in",
      linkedinUrl: "https://linkedin.com/in/dr-chirag-desai-cutis",
    },
  },
  {
    name: "Dr. Mahendra O. Shah Clinic",
    slug: "dr-mahendra-shah",
    employeeRange: "1-10",
    websiteHost: "drmahendrashah.com",
    phone: "+91 265 222 3344",
    address: "Fatehgunj, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Mahendra O. Shah",
      role: "founder",
      roleLabel: "Founder & Chief Consultant Dermatologist",
      credentials: ["MBBS", "MD", "DV&L"],
      specialization: "Dermatology, Venereology & Leprosy",
      department: "Clinical Dermatology",
      email: "dr.mahendra@drmahendrashah.com",
      linkedinUrl: "https://linkedin.com/in/dr-mahendra-shah",
    },
  },
  {
    name: "SkinSio Advanced Dermatology",
    slug: "skinsio-clinics",
    employeeRange: "11-50",
    websiteHost: "skinsio.com",
    phone: "+91 265 255 6677",
    address: "Sayajigunj, Vadodara",
    industry: "Dermatology",
    // Intentionally omitted decision maker to test UNKNOWN > WRONG principle ("Not found")
  },
  {
    name: "Dr. Rachi's Skin City",
    slug: "dr-rachis-skin-city",
    employeeRange: "11-50",
    websiteHost: "drrachiskincity.in",
    phone: "+91 265 266 7788",
    address: "Old Padra Road, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Rachi Sharma",
      role: "founder",
      roleLabel: "Founder & Aesthetic Dermatologist",
      credentials: ["MBBS", "DDVL"],
      specialization: "Aesthetic Dermatology & Hair Care",
      department: "Aesthetic Dermatology",
      email: "dr.rachi@drrachiskincity.in",
      linkedinUrl: "https://linkedin.com/in/dr-rachi-sharma",
    },
  },
  {
    name: "Kaya Skin Clinic Vadodara",
    slug: "kaya-skin-vadodara",
    employeeRange: "11-50",
    websiteHost: "kayaclinicvadodara.com",
    phone: "+91 265 235 1234",
    address: "Center Square Mall, Alkapuri, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Sneha Rao",
      role: "department_head",
      roleLabel: "Principal Consultant Dermatologist",
      credentials: ["MBBS", "MD", "DNB"],
      specialization: "Clinical Dermatology",
      department: "Dermatological Practice",
      email: "dr.sneha.rao@kayaclinicvadodara.com",
      linkedinUrl: "https://linkedin.com/in/dr-sneha-rao-kaya",
    },
  },
  {
    name: "Clear Skin Laser & Aesthetic Clinic",
    slug: "clear-skin-vadodara",
    employeeRange: "1-10",
    websiteHost: "clearskinvadodara.in",
    phone: "+91 265 231 1223",
    address: "Akota, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Pratik Joshi",
      role: "medical_director",
      roleLabel: "Medical Director & Laser Surgeon",
      credentials: ["MBBS", "DNB"],
      specialization: "Laser Surgery & Pediatric Dermatology",
      department: "Laser & Aesthetic Center",
      email: "pratik.joshi@clearskinvadodara.in",
      linkedinUrl: "https://linkedin.com/in/dr-pratik-joshi-skin",
    },
  },
  {
    name: "Derma Care Clinic & Laser Centre",
    slug: "derma-care-vadodara",
    employeeRange: "1-10",
    websiteHost: "dermacarevadodara.com",
    phone: "+91 265 263 3445",
    address: "Manjalpur, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Bhavna Trivedi",
      role: "founder",
      roleLabel: "Founder & Chief Cosmetologist",
      credentials: ["MBBS", "MD"],
      specialization: "Cosmetology & Anti-Aging Treatments",
      department: "Cosmetology",
      email: "dr.bhavna@dermacarevadodara.com",
      linkedinUrl: "https://linkedin.com/in/dr-bhavna-trivedi",
    },
  },
  {
    name: "Vrundavan Skin & Cosmetic Clinic",
    slug: "vrundavan-skin-clinic",
    employeeRange: "1-10",
    websiteHost: "vrundavanskinclinic.in",
    phone: "+91 265 246 5566",
    address: "Karelibaug, Vadodara",
    industry: "Dermatology",
    // Intentionally omitted decision maker to test UNKNOWN > WRONG principle ("Not found")
  },
  {
    name: "Radiance Skin & Laser Centre",
    slug: "radiance-skin-vadodara",
    employeeRange: "1-10",
    websiteHost: "radianceskinvadodara.com",
    phone: "+91 265 237 8899",
    address: "Gotri Road, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Mitali Parikh",
      role: "clinic_director",
      roleLabel: "Clinic Director & Aesthetic Physician",
      credentials: ["MBBS", "MD"],
      specialization: "Laser Skin Rejuvenation",
      department: "Laser Rejuvenation",
      email: "dr.mitali@radianceskinvadodara.com",
      linkedinUrl: "https://linkedin.com/in/dr-mitali-parikh",
    },
  },
  {
    name: "Sparsh Skin & Hair Laser Clinic",
    slug: "sparsh-skin-vadodara",
    employeeRange: "1-10",
    websiteHost: "sparshskinvadodara.in",
    phone: "+91 265 225 4433",
    address: "Vasna Road, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Hiren Solanki",
      role: "founder",
      roleLabel: "Founder & Trichologist",
      credentials: ["MBBS", "MD"],
      specialization: "Trichology & Hair Restoration",
      department: "Hair Restoration Center",
      email: "dr.hiren@sparshskinvadodara.in",
      linkedinUrl: "https://linkedin.com/in/dr-hiren-solanki",
    },
  },
  {
    name: "Twacha Skin, Hair & Aesthetic Clinic",
    slug: "twacha-clinic-vadodara",
    employeeRange: "1-10",
    websiteHost: "twachaclinicvadodara.com",
    phone: "+91 265 239 1122",
    address: "Subhanpura, Vadodara",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Neha Shah",
      role: "managing_director",
      roleLabel: "Managing Director & Aesthetic Dermatologist",
      credentials: ["MBBS", "DVD"],
      specialization: "Dermatologic Surgery & Aesthetics",
      department: "Dermatologic Surgery",
      email: "dr.neha@twachaclinicvadodara.com",
      linkedinUrl: "https://linkedin.com/in/dr-neha-shah-twacha",
    },
  },
  {
    name: "Northpeak Creative Studio",
    slug: "northpeak-creative",
    employeeRange: "11-50",
    websiteHost: "northpeakcreative.com",
    phone: "+1 555 123 4567",
    address: "Downtown",
    industry: "Marketing",
  },
  {
    name: "Harborline Growth Lab",
    slug: "harborline-growth",
    employeeRange: "1-10",
    websiteHost: "harborlinegrowth.com",
    phone: "+1 555 234 5678",
    address: "Suite 400",
    industry: "Technology",
  },
  {
    name: "Cedar & Volt Media",
    slug: "cedar-volt-media",
    employeeRange: "11-50",
    websiteHost: "cedarvolt.com",
    phone: "+1 555 345 6789",
    address: "Innovation District",
    industry: "Design",
  },
  // Multi-City Regional Fixtures (For multi-location development & regression testing)
  {
    name: "Aura Skin & Hair Clinic Ahmedabad",
    slug: "aura-skin-ahmedabad",
    employeeRange: "11-50",
    websiteHost: "auraskinahmedabad.com",
    phone: "+91 79 2640 1122",
    address: "Navrangpura, Ahmedabad",
    city: "Ahmedabad",
    country: "India",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Krunal Patel",
      role: "medical_director",
      roleLabel: "Medical Director & Senior Dermatologist",
      credentials: ["MBBS", "MD"],
      specialization: "Laser Dermatology",
      department: "Dermatology",
      email: "dr.krunal@auraskinahmedabad.com",
    },
  },
  {
    name: "Surat Cosmetology & Laser Centre",
    slug: "surat-cosmetology",
    employeeRange: "11-50",
    websiteHost: "suratcosmetology.com",
    phone: "+91 261 245 3344",
    address: "Ghod Dod Road, Surat",
    city: "Surat",
    country: "India",
    industry: "Dermatology",
    decisionMaker: {
      name: "Dr. Ramesh Jariwala",
      role: "founder",
      roleLabel: "Founder & Consultant Dermatologist",
      credentials: ["MBBS", "DVD"],
      specialization: "Aesthetic Cosmetology",
      department: "Aesthetic Medicine",
      email: "dr.ramesh@suratcosmetology.com",
    },
  },
  {
    name: "Pink City Dental & Implant Clinic",
    slug: "pink-city-dental",
    employeeRange: "1-10",
    websiteHost: "pinkcitydental.in",
    phone: "+91 141 236 5500",
    address: "C-Scheme, Jaipur",
    city: "Jaipur",
    country: "India",
    industry: "Dental",
    decisionMaker: {
      name: "Dr. Alok Shekhawat",
      role: "clinic_director",
      roleLabel: "Clinic Director & Chief Implantologist",
      credentials: ["BDS", "MDS"],
      specialization: "Implantology & Cosmetic Dentistry",
      department: "Dental Surgery",
      email: "dr.alok@pinkcitydental.in",
    },
  },
  {
    name: "Jammu Healthcare Super Specialty Hospital",
    slug: "jammu-healthcare-hospital",
    employeeRange: "51-200",
    websiteHost: "jammuhealthcare.org",
    phone: "+91 191 254 7788",
    address: "Resham Ghar Colony, Jammu",
    city: "Jammu",
    country: "India",
    industry: "Hospital",
    decisionMaker: {
      name: "Dr. Rajiv Raina",
      role: "medical_director",
      roleLabel: "Medical Director & Chief Administrator",
      credentials: ["MBBS", "MS", "MCh"],
      specialization: "Surgical Services & Administration",
      department: "Hospital Administration",
      email: "director@jammuhealthcare.org",
    },
  },
  {
    name: "Capital Automotive Motors & Dealership",
    slug: "capital-automotive-delhi",
    employeeRange: "51-200",
    websiteHost: "capitalautomotivedelhi.com",
    phone: "+91 11 2341 8899",
    address: "Connaught Place, Delhi",
    city: "Delhi",
    country: "India",
    industry: "Automotive",
    decisionMaker: {
      name: "Vikram Malhotra",
      role: "managing_director",
      roleLabel: "Managing Director & Dealer Principal",
      credentials: ["MBA"],
      specialization: "Automotive Retail & Commercial Operations",
      department: "Executive Management",
      email: "vikram@capitalautomotivedelhi.com",
    },
  },
  // Australian D2C Brands (Direct-to-Consumer / eCommerce)
  {
    name: "Bellroy",
    slug: "bellroy",
    employeeRange: "51-200",
    websiteHost: "bellroy.com",
    phone: "+61 3 9013 4642",
    address: "Collingwood, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Andy Fallshaw",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "support@bellroy.com",
      phone: "+61 3 9013 4642",
      linkedinUrl: "https://linkedin.com/in/andy-fallshaw",
    },
  },
  {
    name: "July",
    slug: "july",
    employeeRange: "11-50",
    websiteHost: "july.com",
    phone: "+61 3 8592 1890",
    address: "Collingwood, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Richard Li",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "enquiries@july.com",
      phone: "+61 3 8592 1890",
      linkedinUrl: "https://linkedin.com/in/richardli-july",
    },
  },
  {
    name: "Who Gives A Crap",
    slug: "who-gives-a-crap",
    employeeRange: "51-200",
    websiteHost: "whogivesacrap.org",
    phone: "+61 3 9005 7800",
    address: "Richmond, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Simon Griffiths",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "wedo@whogivesacrap.org",
      phone: "+61 3 9005 7800",
      linkedinUrl: "https://linkedin.com/in/simongriffiths",
    },
  },
  {
    name: "Koala",
    slug: "koala",
    employeeRange: "51-200",
    websiteHost: "koala.com",
    phone: "+61 2 8311 0500",
    address: "Sydney, NSW",
    city: "Sydney",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Dany Milham",
      role: "founder",
      roleLabel: "Co-Founder & Executive Director",
      email: "support@koala.com",
      phone: "+61 2 8311 0500",
      linkedinUrl: "https://linkedin.com/in/danymilham",
    },
  },
  {
    name: "Ultra Violette",
    slug: "ultra-violette",
    employeeRange: "11-50",
    websiteHost: "ultraviolette.com.au",
    phone: "+61 3 9429 8885",
    address: "Cremorne, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Ava Matthews",
      role: "founder",
      roleLabel: "Co-Founder & Brand Director",
      email: "customercare@ultraviolette.com.au",
      phone: "+61 3 9429 8885",
      linkedinUrl: "https://linkedin.com/in/ava-matthews",
    },
  },
  {
    name: "Modibodi",
    slug: "modibodi",
    employeeRange: "51-200",
    websiteHost: "modibodi.com",
    phone: "+61 2 8005 0885",
    address: "Balmain, Sydney",
    city: "Sydney",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Kristy Chong",
      role: "founder",
      roleLabel: "Founder & Executive Director",
      email: "info@modibodi.com",
      phone: "+61 2 8005 0885",
      linkedinUrl: "https://linkedin.com/in/kristy-chong",
    },
  },
  {
    name: "Frank Green",
    slug: "frank-green",
    employeeRange: "51-200",
    websiteHost: "frankgreen.com.au",
    phone: "+61 3 9429 8885",
    address: "Richmond, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Benjamin Young",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "hello@frankgreen.com.au",
      phone: "+61 3 9429 8885",
      linkedinUrl: "https://linkedin.com/in/benjamin-young-frankgreen",
    },
  },
  {
    name: "Threadheads",
    slug: "threadheads",
    employeeRange: "11-50",
    websiteHost: "threadheads.com",
    phone: "+61 3 9015 9822",
    address: "Cheltenham, Melbourne",
    city: "Melbourne",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Ace Reamer",
      role: "founder",
      roleLabel: "Co-Founder & Creative Director",
      email: "help@threadheads.com",
      phone: "+61 3 9015 9822",
      linkedinUrl: "https://linkedin.com/in/ace-reamer",
    },
  },
  {
    name: "Boody",
    slug: "boody",
    employeeRange: "51-200",
    websiteHost: "boody.com.au",
    phone: "+61 2 9580 9990",
    address: "Penshurst, Sydney",
    city: "Sydney",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "David Greenblo",
      role: "founder",
      roleLabel: "Co-Founder & Director",
      email: "support@boody.com.au",
      phone: "+61 2 9580 9990",
      linkedinUrl: "https://linkedin.com/in/david-greenblo",
    },
  },
  {
    name: "Lorna Jane",
    slug: "lorna-jane",
    employeeRange: "201-500",
    websiteHost: "lornajane.com.au",
    phone: "+61 7 3865 9000",
    address: "Eagle Farm, Brisbane",
    city: "Brisbane",
    country: "Australia",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Lorna Jane Clarkson",
      role: "founder",
      roleLabel: "Founder & Chief Creative Officer",
      email: "customerservice@lornajane.com.au",
      phone: "+61 7 3865 9000",
      linkedinUrl: "https://linkedin.com/in/lornajaneclarkson",
    },
  },
  // US D2C Direct-to-Consumer Brands
  {
    name: "Warby Parker",
    slug: "warby-parker",
    employeeRange: "1000+",
    websiteHost: "warbyparker.com",
    phone: "+1 888 492 7297",
    address: "233 Spring St, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Neil Blumenthal",
      role: "founder",
      roleLabel: "Co-Founder & Co-CEO",
      email: "neil@warbyparker.com",
      phone: "+1 212 555 0101",
      linkedinUrl: "https://linkedin.com/in/neilblumenthal",
    },
  },
  {
    name: "Allbirds",
    slug: "allbirds",
    employeeRange: "501-1000",
    websiteHost: "allbirds.com",
    phone: "+1 888 963 8944",
    address: "SoHo, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Tim Brown",
      role: "founder",
      roleLabel: "Co-Founder & Vice Chairman",
      email: "tim@allbirds.com",
      phone: "+1 212 555 0102",
      linkedinUrl: "https://linkedin.com/in/timbrown-allbirds",
    },
  },
  {
    name: "Casper Sleep",
    slug: "casper-sleep",
    employeeRange: "501-1000",
    websiteHost: "casper.com",
    phone: "+1 888 498 0003",
    address: "Three World Trade Center, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Philip Krim",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "philip@casper.com",
      phone: "+1 212 555 0103",
      linkedinUrl: "https://linkedin.com/in/philipkrim",
    },
  },
  {
    name: "Glossier",
    slug: "glossier",
    employeeRange: "201-500",
    websiteHost: "glossier.com",
    phone: "+1 844 656 4677",
    address: "123 Lafayette St, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Emily Weiss",
      role: "founder",
      roleLabel: "Founder & Executive Chairwoman",
      email: "emily@glossier.com",
      phone: "+1 212 555 0104",
      linkedinUrl: "https://linkedin.com/in/emily-weiss-glossier",
    },
  },
  {
    name: "Away Travel",
    slug: "away-travel",
    employeeRange: "201-500",
    websiteHost: "awaytravel.com",
    phone: "+1 888 428 9297",
    address: "82 Mercer St, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Steph Korey",
      role: "founder",
      roleLabel: "Co-Founder & Director",
      email: "steph@awaytravel.com",
      phone: "+1 212 555 0105",
      linkedinUrl: "https://linkedin.com/in/stephkorey",
    },
  },
  {
    name: "Brooklinen",
    slug: "brooklinen",
    employeeRange: "51-200",
    websiteHost: "brooklinen.com",
    phone: "+1 888 886 1604",
    address: "DUMBO, Brooklyn, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Rich Fulop",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "rich@brooklinen.com",
      phone: "+1 718 555 0106",
      linkedinUrl: "https://linkedin.com/in/richfulop",
    },
  },
  {
    name: "Harry's Inc.",
    slug: "harrys",
    employeeRange: "501-1000",
    websiteHost: "harrys.com",
    phone: "+1 888 212 6855",
    address: "75 Spring St, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Andy Katz-Mayfield",
      role: "founder",
      roleLabel: "Co-Founder & Co-CEO",
      email: "andy@harrys.com",
      phone: "+1 212 555 0107",
      linkedinUrl: "https://linkedin.com/in/andykatzmayfield",
    },
  },
  {
    name: "Bombas",
    slug: "bombas",
    employeeRange: "201-500",
    websiteHost: "bombas.com",
    phone: "+1 800 314 0980",
    address: "Flatiron District, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "David Heath",
      role: "founder",
      roleLabel: "Co-Founder & CEO",
      email: "david@bombas.com",
      phone: "+1 212 555 0108",
      linkedinUrl: "https://linkedin.com/in/david-heath-bombas",
    },
  },
  {
    name: "Liquid Death",
    slug: "liquid-death",
    employeeRange: "51-200",
    websiteHost: "liquiddeath.com",
    phone: "+1 888 547 8433",
    address: "Manhattan, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Mike Cessario",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "mike@liquiddeath.com",
      phone: "+1 212 555 0109",
      linkedinUrl: "https://linkedin.com/in/mikecessario",
    },
  },
  {
    name: "Everlane",
    slug: "everlane",
    employeeRange: "201-500",
    websiteHost: "everlane.com",
    phone: "+1 800 778 7879",
    address: "Prince St, SoHo, New York",
    city: "New York",
    country: "United States",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Michael Preysman",
      role: "founder",
      roleLabel: "Founder & Executive Chairman",
      email: "michael@everlane.com",
      phone: "+1 212 555 0110",
      linkedinUrl: "https://linkedin.com/in/michaelpreysman",
    },
  },
  // US Supermarkets & Retailers
  {
    name: "Rockland Kosher Supermarket",
    slug: "rockland-kosher-supermarket",
    employeeRange: "51-200",
    websiteHost: "rocklandkosher.com",
    phone: "+1 845 425 2266",
    address: "Monsey, New York",
    city: "New York",
    country: "United States",
    industry: "Supermarkets",
    decisionMaker: {
      name: "Moishe Farkas",
      role: "managing_director",
      roleLabel: "Store Director & General Manager",
      email: "info@rocklandkosher.com",
      phone: "+1 845 425 2266",
    },
  },
  {
    name: "Fairway Market New York",
    slug: "fairway-market-ny",
    employeeRange: "201-500",
    websiteHost: "fairwaymarket.com",
    phone: "+1 212 595 1888",
    address: "Broadway & 74th St, New York",
    city: "New York",
    country: "United States",
    industry: "Supermarkets",
    decisionMaker: {
      name: "Perry Blatt",
      role: "procurement_head",
      roleLabel: "VP Business Development & Merchandising",
      email: "customerservice@fairwaymarket.com",
      phone: "+1 212 595 1888",
    },
  },
  // China Supermarkets & Grocery Retailers
  {
    name: "CR Vanguard (China Resources Vanguard)",
    slug: "cr-vanguard-china",
    employeeRange: "1000+",
    websiteHost: "crv.com.cn",
    phone: "+86 21 5888 1234",
    address: "Pudong New Area, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "Supermarkets",
    decisionMaker: {
      name: "Wang Chen",
      role: "procurement_head",
      roleLabel: "VP Retail Merchandising & Food Sourcing",
      email: "purchasing@crv.com.cn",
      phone: "+86 21 5888 1234",
    },
  },
  {
    name: "Yonghui Superstores",
    slug: "yonghui-superstores",
    employeeRange: "1000+",
    websiteHost: "yonghui.com.cn",
    phone: "+86 21 6888 5678",
    address: "Minhang District, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "Supermarkets",
    decisionMaker: {
      name: "Zhang Xuansong",
      role: "founder",
      roleLabel: "Chairman & Head of Strategic Sourcing",
      email: "contact@yonghui.com.cn",
      phone: "+86 21 6888 5678",
    },
  },
  {
    name: "Freshippo (Hema Fresh - Alibaba Group)",
    slug: "freshippo-hema",
    employeeRange: "1000+",
    websiteHost: "freshhema.com",
    phone: "+86 21 6000 8888",
    address: "Huangpu, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "Supermarkets",
    decisionMaker: {
      name: "Hou Yi",
      role: "managing_director",
      roleLabel: "CEO & General Manager",
      email: "service@freshhema.com",
      phone: "+86 21 6000 8888",
    },
  },
  // China D2C Direct-to-Consumer Brands
  {
    name: "NEIWAI (内外)",
    slug: "neiwai",
    employeeRange: "201-500",
    websiteHost: "neiwai.life",
    phone: "+86 21 6433 1288",
    address: "Jing'an District, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Xiaolu Liu",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "xiaolu.liu@neiwai.life",
      phone: "+86 21 6433 1288",
      linkedinUrl: "https://linkedin.com/in/xiaolu-liu-neiwai",
    },
  },
  {
    name: "Florasis (花西子 - Huaxizi)",
    slug: "florasis",
    employeeRange: "501-1000",
    websiteHost: "florasis.com",
    phone: "+86 571 8899 7766",
    address: "Xihu District, Hangzhou",
    city: "Hangzhou",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Franklin Feng",
      role: "founder",
      roleLabel: "Founder & Chief Brand Officer",
      email: "franklin@florasis.com",
      phone: "+86 571 8899 7766",
    },
  },
  {
    name: "Perfect Diary (完美日记 - Yatsen)",
    slug: "perfect-diary",
    employeeRange: "1000+",
    websiteHost: "perfectdiary.com",
    phone: "+86 20 8920 1234",
    address: "Haizhu District, Guangzhou",
    city: "Guangzhou",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Jinfeng Huang",
      role: "founder",
      roleLabel: "Founder, Chairman & CEO",
      email: "david.huang@yatsenglobal.com",
      phone: "+86 20 8920 1234",
    },
  },
  {
    name: "Roborock (石头科技)",
    slug: "roborock",
    employeeRange: "1000+",
    websiteHost: "roborock.com",
    phone: "+86 10 8070 1866",
    address: "Haidian District, Beijing",
    city: "Beijing",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Richard Chang",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "chang@roborock.com",
      phone: "+86 10 8070 1866",
    },
  },
  {
    name: "Pop Mart (泡泡玛特)",
    slug: "popmart",
    employeeRange: "1000+",
    websiteHost: "popmart.com",
    phone: "+86 10 8585 7788",
    address: "Chaoyang District, Beijing",
    city: "Beijing",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Wang Ning",
      role: "founder",
      roleLabel: "Founder, Chairman & CEO",
      email: "wangning@popmart.com",
      phone: "+86 10 8585 7788",
    },
  },
  {
    name: "Heytea (喜茶)",
    slug: "heytea",
    employeeRange: "1000+",
    websiteHost: "heytea.com",
    phone: "+86 21 6288 9900",
    address: "Huangpu District, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Neo Nie",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "neo.nie@heytea.com",
      phone: "+86 21 6288 9900",
    },
  },
  {
    name: "WonderLab",
    slug: "wonderlab",
    employeeRange: "201-500",
    websiteHost: "wonderlabnutrition.com",
    phone: "+86 755 8670 1234",
    address: "Nanshan District, Shenzhen",
    city: "Shenzhen",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Kevin Liu",
      role: "founder",
      roleLabel: "Co-Founder & Head of Growth",
      email: "kevin@wonderlabnutrition.com",
      phone: "+86 755 8670 1234",
    },
  },
  {
    name: "Anker Innovations",
    slug: "anker",
    employeeRange: "1000+",
    websiteHost: "anker.com",
    phone: "+86 755 8658 0888",
    address: "Nanshan High-Tech Park, Shenzhen",
    city: "Shenzhen",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Steven Yang",
      role: "founder",
      roleLabel: "Founder & CEO",
      email: "steven.yang@anker.com",
      phone: "+86 755 8658 0888",
    },
  },
  {
    name: "Peacebird (太平鸟)",
    slug: "peacebird",
    employeeRange: "1000+",
    websiteHost: "peacebird.com",
    phone: "+86 21 5299 8811",
    address: "Minhang District, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Zhang Jiangping",
      role: "founder",
      roleLabel: "Chairman & Founder",
      email: "zjp@peacebird.com",
      phone: "+86 21 5299 8811",
    },
  },
  {
    name: "Chando / Jala Group (自然堂)",
    slug: "chando",
    employeeRange: "1000+",
    websiteHost: "chando.com",
    phone: "+86 21 6128 6688",
    address: "Pudong New Area, Shanghai",
    city: "Shanghai",
    country: "China",
    industry: "D2C Direct-to-Consumer brands",
    decisionMaker: {
      name: "Zheng Chunying",
      role: "founder",
      roleLabel: "Chairman & President",
      email: "zhengcy@jala.com.cn",
      phone: "+86 21 6128 6688",
    },
  },
  // United Kingdom - Law Firms
  {
    name: "Clifford Chance LLP",
    slug: "clifford-chance",
    employeeRange: "1000+",
    websiteHost: "cliffordchance.com",
    phone: "+44 20 7006 1000",
    address: "10 Upper Bank St, Canary Wharf, London",
    city: "London",
    country: "United Kingdom",
    industry: "Law firms",
    decisionMaker: {
      name: "Charles Adams",
      role: "managing_director",
      roleLabel: "Global Managing Partner",
      email: "charles.adams@cliffordchance.com",
      phone: "+44 20 7006 1000",
      linkedinUrl: "https://linkedin.com/in/charles-adams-cliffordchance",
    },
  },
  {
    name: "Freshfields Bruckhaus Deringer",
    slug: "freshfields",
    employeeRange: "1000+",
    websiteHost: "freshfields.com",
    phone: "+44 20 7936 4000",
    address: "100 Bishopsgate, London",
    city: "London",
    country: "United Kingdom",
    industry: "Law firms",
    decisionMaker: {
      name: "Rick van Aerssen",
      role: "managing_director",
      roleLabel: "Managing Partner",
      email: "rick.vanaerssen@freshfields.com",
      phone: "+44 20 7936 4000",
    },
  },
  {
    name: "Linklaters LLP",
    slug: "linklaters",
    employeeRange: "1000+",
    websiteHost: "linklaters.com",
    phone: "+44 20 7456 2000",
    address: "One Silk Street, London",
    city: "London",
    country: "United Kingdom",
    industry: "Law firms",
    decisionMaker: {
      name: "Paul Lewis",
      role: "managing_director",
      roleLabel: "Managing Partner & CEO",
      email: "paul.lewis@linklaters.com",
      phone: "+44 20 7456 2000",
    },
  },
  // Germany - Automotive Dealerships
  {
    name: "MAHAG Automobil München",
    slug: "mahag-muenchen",
    employeeRange: "501-1000",
    websiteHost: "mahag.de",
    phone: "+49 89 52080",
    address: "Schleibingerstraße 12, Munich",
    city: "Munich",
    country: "Germany",
    industry: "Automotive dealerships",
    decisionMaker: {
      name: "Thomas Schmidt",
      role: "managing_director",
      roleLabel: "Geschäftsführer & Head of Sales",
      email: "geschaeftsfuehrung@mahag.de",
      phone: "+49 89 52080",
    },
  },
  {
    name: "Auto & Service München GmbH",
    slug: "auto-service-muenchen",
    employeeRange: "51-200",
    websiteHost: "auto-service-muenchen.de",
    phone: "+49 89 14380",
    address: "Wasserburger Landstraße, Munich",
    city: "Munich",
    country: "Germany",
    industry: "Automotive dealerships",
    decisionMaker: {
      name: "Stefan Huber",
      role: "managing_director",
      roleLabel: "General Manager",
      email: "info@auto-service-muenchen.de",
      phone: "+49 89 14380",
    },
  },
  // Japan - Technology SaaS Companies
  {
    name: "SmartHR Inc.",
    slug: "smarthr-japan",
    employeeRange: "501-1000",
    websiteHost: "smarthr.co.jp",
    phone: "+81 3 6441 2225",
    address: "Roppongi Grand Tower, Minato, Tokyo",
    city: "Tokyo",
    country: "Japan",
    industry: "Software SaaS companies",
    decisionMaker: {
      name: "Masato Serizawa",
      role: "founder",
      roleLabel: "CEO & Representative Director",
      email: "info@smarthr.co.jp",
      phone: "+81 3 6441 2225",
    },
  },
  {
    name: "Freee K.K.",
    slug: "freee-japan",
    employeeRange: "1000+",
    websiteHost: "freee.co.jp",
    phone: "+81 3 6630 3232",
    address: "Osaki, Shinagawa, Tokyo",
    city: "Tokyo",
    country: "Japan",
    industry: "Software SaaS companies",
    decisionMaker: {
      name: "Daisuke Sasaki",
      role: "founder",
      roleLabel: "CEO & Founder",
      email: "contact@freee.co.jp",
      phone: "+81 3 6630 3232",
    },
  },
];

export class MockDiscoveryProvider implements DiscoveryProvider {
  readonly id = "mock";
  readonly name = "Mock / Development Fixtures";
  readonly priority = 999; // Fallback lowest priority in non-production

  get isEnabled(): boolean {
    // Unconditional production restriction: production must NEVER use the mock discovery provider,
    // even if ENABLE_MOCK_PROVIDER is set to true.
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    return true;
  }

  private shouldSimulateFailure = false;
  private shouldSimulateEmpty = false;

  setSimulateFailure(value: boolean) {
    this.shouldSimulateFailure = value;
  }

  setSimulateEmpty(value: boolean) {
    this.shouldSimulateEmpty = value;
  }

  async checkHealth(): Promise<ProviderHealthResult> {
    if (!this.isEnabled) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: "disabled",
        latencyMs: 0,
        message: "Mock provider is strictly disabled in production to uphold UNKNOWN > WRONG",
        checkedAt: new Date().toISOString(),
      };
    }
    return {
      providerId: this.id,
      providerName: this.name,
      status: "healthy",
      latencyMs: 1,
      checkedAt: new Date().toISOString(),
    };
  }

  async discover(query: SearchJobQuery): Promise<RawDiscoveryResult> {
    const start = Date.now();

    if (process.env.NODE_ENV === "production" || !this.isEnabled) {
      throw new Error(
        "MockDiscoveryProvider is strictly and unconditionally disabled in production to uphold UNKNOWN > WRONG. " +
        "Production provider failures must result in an honest failure or empty result, never fabricated businesses."
      );
    }

    if (this.shouldSimulateFailure) {
      throw new Error("MockProvider simulated network error");
    }

    if (this.shouldSimulateEmpty) {
      return {
        provider: this.id,
        candidates: [],
        totalReturned: 0,
        durationMs: Date.now() - start,
        queryUsed: `${query.industry} in ${query.city}, ${query.country}`,
      };
    }

    const qInd = (query.industry || "").toLowerCase().trim();
    const qCountry = (query.country || "").toLowerCase().trim();
    const qCity = (query.city || "").toLowerCase().trim();

    // 1. Match both Country and Industry
    let matching = DEFAULT_MOCK_FIXTURES.filter((f) => {
      const fInd = (f.industry || "").toLowerCase();
      const fCountry = (f.country || "India").toLowerCase();
      const indMatch = !qInd || fInd.includes(qInd) || qInd.includes(fInd) || (qInd.includes("d2c") && fInd.includes("d2c"));
      const countryMatch = !qCountry || fCountry.includes(qCountry) || qCountry.includes(fCountry);
      return indMatch && countryMatch;
    });

    // 2. Prioritize exact city matches while keeping same-country records for quota
    if (matching.length > 0 && qCity) {
      const cityMatches = matching.filter((f) => {
        const cCity = (f.city || f.address || "").toLowerCase();
        return cCity.includes(qCity) || qCity.includes(cCity);
      });
      const otherCountryMatches = matching.filter((f) => !cityMatches.includes(f));
      matching = [...cityMatches, ...otherCountryMatches];
    }

    // 3. Fallback: prioritize matching by industry first so industry gate passes
    if (matching.length === 0 && qInd) {
      matching = DEFAULT_MOCK_FIXTURES.filter((f) => {
        const fInd = (f.industry || "").toLowerCase();
        return fInd.includes(qInd) || qInd.includes(fInd) || (qInd.includes("d2c") && fInd.includes("d2c"));
      });
    }

    // 4. Fallback: match by country if specific industry was not found
    if (matching.length === 0 && qCountry) {
      matching = DEFAULT_MOCK_FIXTURES.filter((f) => {
        const fCountry = (f.country || "India").toLowerCase();
        return fCountry.includes(qCountry) || qCountry.includes(fCountry);
      });
    }

    // 5. If still no fixtures for this country, adapt available fixtures to the requested geography
    const isSyntheticAdaptationNeeded = matching.length === 0;
    if (isSyntheticAdaptationNeeded) {
      matching = DEFAULT_MOCK_FIXTURES;
    }

    const needed = Math.min(query.limit || 10, matching.length);
    const fixtures = matching.slice(0, needed);

    const candidates: CandidateRecord[] = fixtures.map((f, idx) => {
      const host = f.websiteHost ?? `${f.slug}.com`;
      let city = query.city || f.city || "Shanghai";
      let country = query.country || f.country || "China";
      let address = f.address ?? `${city}, ${country}`;
      let phone = f.phone ?? null;

      // Ensure address mentions the target city so national brands satisfy regional city-presence verification
      if (qCity && !address.toLowerCase().includes(qCity)) {
        address = `${address}, ${query.city} Hub`;
      }

      // If adapting fixture to requested geography, ensure phone and dialing code conform to target country
      if (isSyntheticAdaptationNeeded || (qCountry && !f.country?.toLowerCase().includes(qCountry))) {
        city = query.city;
        country = query.country;
        address = `${query.city} Business District, ${query.country}`;
        const prefix = qCountry.includes("china") ? "+86 21 " :
                       qCountry.includes("uk") || qCountry.includes("kingdom") ? "+44 20 " :
                       qCountry.includes("germany") ? "+49 89 " :
                       qCountry.includes("japan") ? "+81 3 " :
                       qCountry.includes("australia") ? "+61 2 " :
                       qCountry.includes("canada") ? "+1 416 " :
                       qCountry.includes("india") ? "+91 22 " :
                       "+1 212 ";
        phone = `${prefix}${5000000 + idx * 1111}`;
      }

      const assignedIndustry = (qInd && !f.industry?.toLowerCase().includes(qInd))
        ? query.industry
        : (f.industry ?? query.industry);

      return {
        companyName: f.name,
        website: `https://www.${host}`,
        domain: host,
        phone,
        address,
        city,
        country,
        industry: assignedIndustry,
        employeeRange: f.employeeRange,
        source: this.id,
        sourceUrl: `https://mock.autoradar.internal/leads/${f.slug}`,
        provider: this.id,
        confidence: "high",
        isMock: true,
        rawMetadata: {
          fixtureSlug: f.slug,
          decisionMaker: f.decisionMaker,
        },
      };
    });

    return {
      provider: this.id,
      candidates,
      totalReturned: candidates.length,
      durationMs: Date.now() - start,
      queryUsed: `${query.industry} in ${query.city}, ${query.country}`,
    };
  }
}

export const mockProvider = new MockDiscoveryProvider();

