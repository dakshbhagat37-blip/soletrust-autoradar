// ============================================================
// 1. ACTIVITIES & TIMELINE
// ============================================================
export type ActivityType =
  | "lead_created"
  | "stage_changed"
  | "note_added"
  | "tag_added"
  | "tag_removed"
  | "assigned"
  | "priority_changed"
  | "lead_qualified"
  | "lead_disqualified"
  | "business_discovered"
  | "business_verified"
  | "industry_verified"
  | "website_checked"
  | "location_checked"
  | "contact_found"
  | "decision_maker_identified"
  | "person_verified"
  | "message_drafted"
  | "message_approved"
  | "message_sent"
  | "delivery_confirmed"
  | "reply_received"
  | "reply_logged"
  | "call_recorded"
  | "meeting_scheduled"
  | "meeting_completed"
  | "pitch_sent"
  | "proposal_sent"
  | "contract_sent"
  | "deal_created"
  | "deal_updated"
  | "follow_up_scheduled"
  | "follow_up_completed"
  | "task_created"
  | "task_completed"
  | "won"
  | "lost"
  | "reopened"
  | "custom";

export interface Activity {
  id: string;
  leadId: string;
  userId?: string | null;
  activityType: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

// ============================================================
// 2. OUTREACH & MESSAGES
// ============================================================
export type OutreachChannel = "email" | "linkedin" | "phone" | "whatsapp" | "manual" | "other";

export type OutreachStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "sent"
  | "delivered"
  | "bounced"
  | "replied"
  | "no_reply"
  | "failed"
  | "cancelled";

export interface OutreachActivity {
  id: string;
  leadId: string;
  contactId?: string | null;
  userId?: string | null;
  channel: OutreachChannel;
  messageSubject?: string | null;
  messageBody?: string | null;
  status: OutreachStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  repliedAt?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReplyClassification =
  | "positive"
  | "neutral"
  | "negative"
  | "out_of_office"
  | "unsubscribe"
  | "needs_review";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  outreachId?: string | null;
  direction: "outbound" | "inbound";
  senderName?: string | null;
  senderEmail?: string | null;
  body: string;
  replyClassification?: ReplyClassification | null;
  isManual: boolean;
  providerMessageId?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  contactId?: string | null;
  channel: OutreachChannel;
  subject?: string | null;
  threadId?: string | null;
  status: "active" | "waiting_reply" | "replied" | "closed" | "snoozed";
  lastMessageAt?: string | null;
  messages?: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 3. FOLLOW-UPS
// ============================================================
export type FollowUpStatus = "pending" | "due" | "overdue" | "completed" | "cancelled" | "paused";

export interface FollowUp {
  id: string;
  leadId: string;
  userId?: string | null;
  reason: string;
  dueAt: string;
  status: FollowUpStatus;
  completedAt?: string | null;
  pausedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 4. TASKS
// ============================================================
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  leadId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string | null;
  completedAt?: string | null;
  reminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 5. MEETINGS
// ============================================================
export type MeetingStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Meeting {
  id: string;
  leadId?: string | null;
  organizedBy?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  timezone: string;
  status: MeetingStatus;
  attendees: Array<{ name: string; email?: string; role?: string }>;
  agenda?: string | null;
  notes?: string | null;
  outcome?: string | null;
  nextActions?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 6. DEALS
// ============================================================
export type DealStage = "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  serviceOffered?: string | null;
  amount: number | null;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  competitors?: string | null;
  businessNeed?: string | null;
  proposalUrl?: string | null;
  lostReason?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 7. CUSTOMERS
// ============================================================
export type CustomerStatus = "active" | "inactive" | "churned";

export interface Customer {
  id: string;
  leadId?: string | null;
  businessId?: string | null;
  dealId?: string | null;
  companyName: string;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  industry?: string | null;
  city?: string | null;
  country?: string | null;
  totalRevenue: number;
  currency: string;
  servicesSold: string[];
  status: CustomerStatus;
  acquiredAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 8. AI SALES STRATEGY
// ============================================================
export interface AiSalesStrategy {
  leadId: string;
  generatedAt: string;
  whyContact: {
    summary: string;
    industryFit: string;
    locationRelevance: string;
    opportunityIdentified: string;
    supportingEvidence: string[];
    commercialRationale: string;
  };
  whoContact: {
    recommendedPerson: string | null;
    role: string | null;
    relevanceReason: string;
    confidence: number;
    availableChannels: string[];
    missingInformation?: string | null;
  };
  whatOffer: {
    primaryService: string;
    valueProposition: string;
    openingAngle: string;
    suggestedNextStep: string;
  };
  howApproach: {
    emailDraft: {
      subject: string;
      body: string;
    };
    sequence?: {
      touchNumber: number;
      dayOffset: number;
      label: string;
      subject: string;
      body: string;
    }[];
    linkedinDraft: {
      connectionNote: string;
      followupMessage: string;
    };
    phoneScript: {
      opener: string;
      hook: string;
      qualifyingQuestions: string[];
      objectionHandlers?: Record<string, string>;
      callToAction: string;
    };
    whatsappDraft?: string;
    recommendedChannel: OutreachChannel;
  };
  brainSuite?: import("../intelligence/outreach-brain.ts").MultichannelOutreachSuite;
}

// ============================================================
// 9. ANALYTICS & DASHBOARD METRICS
// ============================================================
export interface CrmDashboardMetrics {
  totalDiscovered: number;
  totalVerified: number;
  totalQualified: number;
  leadsReadyForOutreach: number;
  contactedLeads: number;
  messagesSent: number;
  messagesDelivered: number;
  actualReplies: number;
  positiveReplies: number;
  neutralReplies: number;
  negativeReplies: number;
  noResponseLeads: number;
  followUpsDue: number;
  followUpsOverdue: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  proposalsSent: number;
  negotiatingDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  actualRevenue: number;
  currency: string;
  conversionRates: {
    discoveryToVerification: number;
    verificationToQualification: number;
    qualificationToOutreach: number;
    outreachToReply: number;
    replyToMeeting: number;
    meetingToProposal: number;
    proposalToWon: number;
  };
}
