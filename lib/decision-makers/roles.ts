import type { AuthorityType, DecisionMakerRole, RoleDefinition } from "./types.ts";

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  // 1. Executive Roles
  {
    role: "founder",
    label: "Founder",
    patterns: [
      /\b(?:co[-\s]?founder|founder|founded by)\b/i,
    ],
    priority: 100,
    category: "executive",
  },
  {
    role: "owner",
    label: "Owner / Proprietor",
    patterns: [
      /\b(?:owner|proprietor|principal)\b/i,
    ],
    priority: 98,
    category: "executive",
  },
  {
    role: "co_founder",
    label: "Co-Founder",
    patterns: [
      /\b(?:co[-\s]founder)\b/i,
    ],
    priority: 97,
    category: "executive",
  },
  {
    role: "medical_director",
    label: "Medical Director",
    patterns: [
      /\bmedical director\b/i,
      /\bchief medical officer\b/i,
      /\bdirector & (?:chief|senior|consultant)?\s*dermatologist\b/i,
    ],
    priority: 96,
    category: "clinical",
  },
  {
    role: "managing_director",
    label: "Managing Director",
    patterns: [
      /\bmanaging director\b/i,
      /\bM\.?D\.?\b/i,
    ],
    priority: 95,
    category: "executive",
  },
  {
    role: "managing_partner",
    label: "Managing Partner",
    patterns: [
      /\bmanaging partner\b/i,
    ],
    priority: 94,
    category: "executive",
  },
  {
    role: "clinic_director",
    label: "Clinic Director / Chief Dermatologist",
    patterns: [
      /\bclinic director\b/i,
      /\bhead of clinic\b/i,
      /\bchief dermatologist\b/i,
      /\bhead dermatologist\b/i,
      /\bsenior consultant dermatologist\b/i,
      /\bchief consultant dermatologist\b/i,
      /\blead dermatologist\b/i,
      /\bcosmetologist & dermatologist\b/i,
    ],
    priority: 92,
    category: "clinical",
  },
  {
    role: "clinical_director",
    label: "Clinical Director",
    patterns: [
      /\bclinical director\b/i,
    ],
    priority: 91,
    category: "clinical",
  },
  {
    role: "partner",
    label: "Partner",
    patterns: [
      /\bsenior partner\b/i,
      /\bpartner\b/i,
    ],
    priority: 90,
    category: "executive",
  },
  {
    role: "director",
    label: "Director",
    patterns: [
      /\bmanaging director\b/i,
      /\bexecutive director\b/i,
      /\bclinic director\b/i,
      /\bdirector\b/i,
    ],
    priority: 89,
    category: "executive",
  },
  {
    role: "purchasing_head",
    label: "Purchasing Head / Head of Procurement",
    patterns: [
      /\bpurchasing head\b/i,
      /\bhead of purchasing\b/i,
      /\bhead of procurement\b/i,
      /\bpurchase manager\b/i,
      /\bhead of supply chain\b/i,
    ],
    priority: 85,
    category: "management",
  },
  {
    role: "procurement_manager",
    label: "Procurement Manager",
    patterns: [
      /\bprocurement manager\b/i,
      /\bprocurement officer\b/i,
      /\bmaterials manager\b/i,
    ],
    priority: 83,
    category: "management",
  },
  {
    role: "ceo",
    label: "Chief Executive Officer",
    patterns: [
      /\bchief executive officer\b/i,
      /\bCEO\b/i,
    ],
    priority: 88,
    category: "executive",
  },

  // Technical Track Roles
  {
    role: "cto",
    label: "Chief Technology Officer",
    patterns: [
      /\bchief technology officer\b/i,
      /\bCTO\b/i,
    ],
    priority: 87,
    category: "management",
  },
  {
    role: "technical_director",
    label: "Technical Director",
    patterns: [
      /\btechnical director\b/i,
      /\bdirector of technology\b/i,
      /\bdirector of engineering\b/i,
    ],
    priority: 86,
    category: "management",
  },
  {
    role: "it_head",
    label: "IT Head / Head of Technology",
    patterns: [
      /\bit head\b/i,
      /\bhead of it\b/i,
      /\bhead of technology\b/i,
      /\bhead of engineering\b/i,
    ],
    priority: 84,
    category: "management",
  },
  {
    role: "technology_manager",
    label: "Technology Manager",
    patterns: [
      /\btechnology manager\b/i,
      /\bit manager\b/i,
      /\bengineering manager\b/i,
    ],
    priority: 82,
    category: "management",
  },
  {
    role: "operations_director",
    label: "Operations Director",
    patterns: [
      /\boperations director\b/i,
      /\bdirector of operations\b/i,
    ],
    priority: 81,
    category: "management",
  },

  // Creative / Marketing Track Roles
  {
    role: "marketing_director",
    label: "Marketing Director",
    patterns: [
      /\bmarketing director\b/i,
      /\bdirector of marketing\b/i,
    ],
    priority: 85,
    category: "management",
  },
  {
    role: "operations_head",
    label: "Operations Head",
    patterns: [
      /\bchief operating officer\b/i,
      /\bCOO\b/i,
      /\bhead of operations\b/i,
      /\boperations head\b/i,
      /\bclinic administrator\b/i,
    ],
    priority: 80,
    category: "management",
  },
  {
    role: "marketing_head",
    label: "Marketing Head",
    patterns: [
      /\bchief marketing officer\b/i,
      /\bCMO\b/i,
      /\bhead of marketing\b/i,
      /\bmarketing head\b/i,
    ],
    priority: 78,
    category: "management",
  },
  {
    role: "marketing_manager",
    label: "Marketing Manager",
    patterns: [
      /\bmarketing manager\b/i,
      /\bsenior marketing manager\b/i,
    ],
    priority: 77,
    category: "management",
  },
  {
    role: "brand_manager",
    label: "Brand Manager",
    patterns: [
      /\bbrand manager\b/i,
      /\bhead of brand\b/i,
      /\bbrand director\b/i,
    ],
    priority: 76,
    category: "management",
  },
  {
    role: "department_head",
    label: "Head of Department",
    patterns: [
      /\bhead of department\b/i,
      /\bH\.?O\.?D\.?\b/i,
      /\bhead of dermatology\b/i,
    ],
    priority: 75,
    category: "clinical",
  },

  // Clinical Practitioners (Clinical Authority ONLY - not automatic purchasing authority)
  {
    role: "clinician_doctor",
    label: "Consultant Dermatologist / Physician",
    patterns: [
      /\bsenior consultant dermatologist\b/i,
      /\bconsultant dermatologist\b/i,
      /\bsenior dermatologist\b/i,
      /\bdermatologist\b/i,
      /\bphysician\b/i,
      /\bdoctor\b/i,
    ],
    priority: 60,
    category: "clinical",
  },
];

/**
 * Service-Track Specific Decision-Maker Role Ranking Table.
 */
export const SERVICE_TRACK_RANKINGS: Record<string, Record<DecisionMakerRole, number>> = {
  creative: {
    owner: 100,
    founder: 99,
    co_founder: 98,
    ceo: 97,
    managing_director: 96,
    marketing_director: 95,
    marketing_head: 94,
    cmo: 94,
    marketing_manager: 93,
    brand_manager: 92,
    brand_head: 91,
    operations_head: 90,
    operations_director: 88,
    partner: 85,
    managing_partner: 85,
    cto: 75,
    technical_director: 72,
    it_head: 70,
    technology_manager: 65,
    medical_director: 60,
    clinic_director: 60,
    clinical_director: 58,
    department_head: 55,
    director: 89,
    purchasing_head: 85,
    procurement_manager: 83,
    clinician_doctor: 40,
    other: 30,
  },
  technical: {
    owner: 100,
    founder: 99,
    co_founder: 98,
    ceo: 97,
    cto: 96,
    technical_director: 95,
    it_head: 94,
    technology_manager: 93,
    operations_director: 92,
    operations_head: 90,
    managing_director: 88,
    partner: 85,
    managing_partner: 85,
    marketing_director: 75,
    marketing_head: 72,
    cmo: 72,
    marketing_manager: 68,
    brand_manager: 65,
    brand_head: 65,
    medical_director: 60,
    clinic_director: 60,
    clinical_director: 58,
    department_head: 55,
    director: 89,
    purchasing_head: 85,
    procurement_manager: 83,
    clinician_doctor: 40,
    other: 30,
  },
  medical: {
    medical_director: 100,
    clinic_director: 98,
    managing_partner: 96,
    clinical_director: 94,
    owner: 92,
    founder: 91,
    co_founder: 90,
    managing_director: 89,
    ceo: 88,
    partner: 85,
    operations_head: 80,
    operations_director: 78,
    marketing_director: 75,
    marketing_head: 74,
    cmo: 74,
    marketing_manager: 70,
    brand_manager: 68,
    brand_head: 68,
    department_head: 70,
    cto: 65,
    technical_director: 62,
    it_head: 60,
    technology_manager: 55,
    director: 88,
    purchasing_head: 82,
    procurement_manager: 80,
    clinician_doctor: 50,
    other: 30,
  },
  general: {
    founder: 100,
    owner: 98,
    co_founder: 97,
    medical_director: 96,
    managing_director: 95,
    clinic_director: 92,
    clinical_director: 91,
    partner: 90,
    director: 89,
    managing_partner: 89,
    ceo: 88,
    cto: 87,
    marketing_director: 85,
    purchasing_head: 85,
    technical_director: 84,
    procurement_manager: 83,
    it_head: 82,
    operations_head: 80,
    marketing_head: 78,
    marketing_manager: 77,
    brand_manager: 76,
    technology_manager: 75,
    department_head: 75,
    operations_director: 74,
    cmo: 78,
    brand_head: 76,
    clinician_doctor: 60,
    other: 30,
  },
};

/**
 * Distinguishes commercial purchasing authority from clinical practitioner authority.
 */
export function getAuthorityClassification(
  role: DecisionMakerRole,
  roleLabel: string = ""
): { authorityType: AuthorityType; isPurchasingAuthority: boolean } {
  const commercialRoles: DecisionMakerRole[] = [
    "owner",
    "founder",
    "co_founder",
    "ceo",
    "managing_director",
    "managing_partner",
    "director",
    "purchasing_head",
    "procurement_manager",
    "medical_director",
    "clinic_director",
    "clinical_director",
    "partner",
    "cto",
    "cmo",
    "marketing_director",
    "marketing_head",
    "marketing_manager",
    "brand_manager",
    "brand_head",
    "technical_director",
    "it_head",
    "technology_manager",
    "operations_director",
    "operations_head",
  ];

  if (commercialRoles.includes(role)) {
    return {
      authorityType: "commercial_purchasing",
      isPurchasingAuthority: true,
    };
  }

  if (
    role === "clinician_doctor" ||
    /dermatologist|doctor|physician|surgeon|dentist|orthodontist|cosmetologist|consultant\s+doctor/i.test(roleLabel)
  ) {
    return {
      authorityType: "clinical_authority",
      isPurchasingAuthority: false,
    };
  }

  return {
    authorityType: "general",
    isPurchasingAuthority: false,
  };
}

/**
 * Matches a text string against defined decision-maker role patterns.
 */
export function matchRoleInText(
  text: string,
  serviceTrack?: string
): {
  role: DecisionMakerRole;
  label: string;
  priority: number;
  authorityType: AuthorityType;
  isPurchasingAuthority: boolean;
} | null {
  for (const def of ROLE_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) {
        let priority = def.priority;
        if (serviceTrack) {
          const trackKey = (serviceTrack.toLowerCase().includes("creative") || serviceTrack.toLowerCase().includes("marketing"))
            ? "creative"
            : serviceTrack.toLowerCase().includes("technical")
            ? "technical"
            : serviceTrack.toLowerCase().includes("medical")
            ? "medical"
            : "general";
          const rankings = SERVICE_TRACK_RANKINGS[trackKey] || SERVICE_TRACK_RANKINGS.general;
          priority = rankings[def.role] ?? def.priority;
        }

        const { authorityType, isPurchasingAuthority } = getAuthorityClassification(def.role, def.label);
        return {
          role: def.role,
          label: def.label,
          priority,
          authorityType,
          isPurchasingAuthority,
        };
      }
    }
  }

  return null;
}
