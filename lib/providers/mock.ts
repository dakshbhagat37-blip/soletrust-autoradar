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

    let matching = DEFAULT_MOCK_FIXTURES;

    // Filter by industry first
    if (query.industry) {
      const qInd = query.industry.toLowerCase();
      const filtered = matching.filter((f) => {
        const ind = (f.industry || "").toLowerCase();
        return ind.includes(qInd) || qInd.includes(ind) || (qInd.includes("d2c") && ind.includes("d2c"));
      });
      if (filtered.length > 0) {
        matching = filtered;
      }
    }

    // Filter by country if specified
    if (query.country) {
      const qCountry = query.country.toLowerCase().trim();
      const countryFiltered = matching.filter((f) => {
        const cCountry = (f.country || "").toLowerCase();
        return cCountry.includes(qCountry) || qCountry.includes(cCountry);
      });
      if (countryFiltered.length > 0) {
        matching = countryFiltered;
      }
    }

    // Filter by city if specified
    if (query.city) {
      const qCity = query.city.toLowerCase().trim();
      const cityFiltered = matching.filter((f) => {
        const cCity = (f.city || f.address || "").toLowerCase();
        return cCity.includes(qCity);
      });
      if (cityFiltered.length > 0) {
        matching = cityFiltered;
      }
    }

    const needed = Math.min(query.limit || 10, matching.length);
    const fixtures = matching.slice(0, needed);

    const candidates: CandidateRecord[] = fixtures.map((f) => {
      const host = f.websiteHost ?? `${f.slug}.com`;
      return {
        companyName: f.name,
        website: `https://www.${host}`,
        domain: host,
        phone: f.phone ?? null,
        address: f.address ?? null,
        city: f.city ?? query.city,
        country: f.country ?? query.country,
        industry: f.industry ?? query.industry,
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

