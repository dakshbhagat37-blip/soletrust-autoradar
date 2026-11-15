// ============================================================
// CRM Lead — Full sales lifecycle entity
// ============================================================

export type LeadStage =
  | "new"
  | "researched"
  | "qualified"
  | "ready_for_outreach"
  | "contacted"
  | "engaged"
  | "follow_up_required"
  | "meeting_scheduled"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost"
  | "disqualified"
  | "on_hold";

export type LeadPriority = "critical" | "high" | "medium" | "low";

export interface CrmLead {
  id: string;
  businessId: string;
  orgId?: string | null;

  // Identity snapshot
  companyName: string;
  industry: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  contacts?: import("./contact.ts").Contact[];

  // CRM fields
  stage: LeadStage;
  priority: LeadPriority;
  assignedTo: string | null;
  qualificationScore: number;
  serviceFitScore: number;

  // Deal info
  estimatedDealValue: number | null;
  currency: string;

  // Metadata
  tags: string[];
  notes: string | null;
  lostReason: string | null;
  nextAction: string | null;
  nextFollowUpAt: string | null;

  // Source
  discoverySource: string | null;
  serviceTrack: string | null;

  // Timestamps
  firstContactedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const LEAD_STAGE_ORDER: LeadStage[] = [
  "new",
  "researched",
  "qualified",
  "ready_for_outreach",
  "contacted",
  "engaged",
  "follow_up_required",
  "meeting_scheduled",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "disqualified",
  "on_hold",
];

export const PIPELINE_STAGES: LeadStage[] = [
  "new",
  "qualified",
  "ready_for_outreach",
  "contacted",
  "engaged",
  "meeting_scheduled",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  researched: "Researched",
  qualified: "Qualified",
  ready_for_outreach: "Ready for Outreach",
  contacted: "Contacted",
  engaged: "Engaged",
  follow_up_required: "Follow-up Required",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  disqualified: "Disqualified",
  on_hold: "On Hold",
};

