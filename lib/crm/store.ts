import type {
  CrmLead,
  LeadStage,
  LeadPriority,
} from "../types/lead.ts";
import type {
  Activity,
  ActivityType,
  OutreachActivity,
  OutreachChannel,
  Conversation,
  ConversationMessage,
  FollowUp,
  Task,
  Meeting,
  Deal,
  Customer,
  CrmDashboardMetrics,
} from "../types/crm.ts";
import type { Business } from "../types/business.ts";
import { isSupabaseServerConfigured, createSupabaseServerClient } from "../supabase/server.ts";
import { logger } from "../logging/logger.ts";
import { loadJsonFromFile, saveJsonToFile } from "../persistence/file-store.ts";

type PersistedCrmData = {
  crmLeads: Record<string, CrmLead>;
  activities: Record<string, Activity[]>;
  outreachList: Record<string, OutreachActivity>;
  conversations: Record<string, Conversation>;
  messages: Record<string, ConversationMessage[]>;
  followUps: Record<string, FollowUp>;
  tasks: Record<string, Task>;
  meetings: Record<string, Meeting>;
  deals: Record<string, Deal>;
  customers: Record<string, Customer>;
  suppressionList: string[];
};

const INITIAL_CRM_DATA: PersistedCrmData = {
  crmLeads: {},
  activities: {},
  outreachList: {},
  conversations: {},
  messages: {},
  followUps: {},
  tasks: {},
  meetings: {},
  deals: {},
  customers: {},
  suppressionList: [],
};

const loadedCrm = loadJsonFromFile<PersistedCrmData>("crm-store.json", INITIAL_CRM_DATA);

// ============================================================
// PERSISTENT CRM REPOSITORY (Survives server restarts; synchronizes to Supabase when configured)
// ============================================================
const crmLeads = new Map<string, CrmLead>(Object.entries(loadedCrm.crmLeads || {}));
const activities = new Map<string, Activity[]>(Object.entries(loadedCrm.activities || {}));
const outreachList = new Map<string, OutreachActivity>(Object.entries(loadedCrm.outreachList || {}));
const conversations = new Map<string, Conversation>(Object.entries(loadedCrm.conversations || {}));
const messages = new Map<string, ConversationMessage[]>(Object.entries(loadedCrm.messages || {}));
const followUps = new Map<string, FollowUp>(Object.entries(loadedCrm.followUps || {}));
const tasks = new Map<string, Task>(Object.entries(loadedCrm.tasks || {}));
const meetings = new Map<string, Meeting>(Object.entries(loadedCrm.meetings || {}));
const deals = new Map<string, Deal>(Object.entries(loadedCrm.deals || {}));
const customers = new Map<string, Customer>(Object.entries(loadedCrm.customers || {}));
const suppressionList = new Set<string>(loadedCrm.suppressionList || []);

export function resetCrmStoreForTesting() {
  crmLeads.clear();
  activities.clear();
  outreachList.clear();
  conversations.clear();
  messages.clear();
  followUps.clear();
  tasks.clear();
  meetings.clear();
  deals.clear();
  customers.clear();
  suppressionList.clear();
}

export function persistCrmData() {
  const data: PersistedCrmData = {
    crmLeads: Object.fromEntries(crmLeads.entries()),
    activities: Object.fromEntries(activities.entries()),
    outreachList: Object.fromEntries(outreachList.entries()),
    conversations: Object.fromEntries(conversations.entries()),
    messages: Object.fromEntries(messages.entries()),
    followUps: Object.fromEntries(followUps.entries()),
    tasks: Object.fromEntries(tasks.entries()),
    meetings: Object.fromEntries(meetings.entries()),
    deals: Object.fromEntries(deals.entries()),
    customers: Object.fromEntries(customers.entries()),
    suppressionList: Array.from(suppressionList.values()),
  };
  saveJsonToFile("crm-store.json", data);
}

// Helper to record activity
export function recordActivity(
  leadId: string,
  activityType: ActivityType,
  title: string,
  options?: {
    description?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    previousValue?: string;
    newValue?: string;
  }
): Activity {
  const activity: Activity = {
    id: crypto.randomUUID(),
    leadId,
    userId: options?.userId ?? null,
    activityType,
    title,
    description: options?.description ?? null,
    metadata: options?.metadata ?? {},
    previousValue: options?.previousValue ?? null,
    newValue: options?.newValue ?? null,
    createdAt: new Date().toISOString(),
  };

  const list = activities.get(leadId) || [];
  list.unshift(activity); // Newest first
  activities.set(leadId, list);

  // Update lead's lastActivityAt
  const lead = crmLeads.get(leadId);
  if (lead) {
    lead.lastActivityAt = activity.createdAt;
    lead.updatedAt = activity.createdAt;
  }

  persistCrmData();

  // Asynchronously mirror to Supabase if configured
  if (isSupabaseServerConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      supabase.from("activities").insert({
        id: activity.id,
        lead_id: activity.leadId,
        user_id: activity.userId,
        activity_type: activity.activityType,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata,
        previous_value: activity.previousValue,
        new_value: activity.newValue,
        created_at: activity.createdAt,
      }).then(({ error }) => {
        if (error) logger.warn("Failed to persist activity to Supabase", { error });
      });
    } catch (e) {
      logger.warn("Supabase activity insert exception", { error: e });
    }
  }

  return activity;
}

// ============================================================
// LEAD OPERATIONS
// ============================================================
export function createOrUpdateLeadFromBusiness(business: Business): CrmLead {
  // Check if lead already exists for this business
  const found = Array.from(crmLeads.values()).find((l) => l.businessId === business.id);

  const now = new Date().toISOString();
  const isQualified = business.status === "qualified" || (business.qualificationScore >= 60);
  const initialStage: LeadStage = isQualified ? "qualified" : "researched";

  if (!found) {
    const newLead: CrmLead = {
      id: crypto.randomUUID(),
      businessId: business.id,
      companyName: business.canonicalName,
      industry: business.industry,
      website: business.website,
      city: business.city,
      country: business.country,
      primaryEmail: business.contacts?.find((c) => c.contactType === "email")?.value || null,
      primaryPhone: business.contacts?.find((c) => c.contactType === "phone")?.value || null,
      contacts: business.contacts || [],
      stage: initialStage,
      priority: business.qualificationScore >= 80 ? "high" : "medium",
      assignedTo: null,
      qualificationScore: business.qualificationScore,
      serviceFitScore: business.qualification?.serviceFitScore || 0,
      estimatedDealValue: business.qualificationScore >= 80 ? 150000 : 75000,
      currency: "INR",
      tags: [business.serviceTrack || "creative+technical"].filter(Boolean) as string[],
      notes: null,
      lostReason: null,
      nextAction: isQualified ? "Review AI Sales Strategy & Draft Outreach" : "Needs further manual enrichment",
      nextFollowUpAt: null,
      discoverySource: business.sources?.[0]?.sourceType || "AutoRadar Discovery",
      serviceTrack: business.serviceTrack || null,
      firstContactedAt: null,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    };
    crmLeads.set(newLead.id, newLead);

    // Initial activities
    recordActivity(newLead.id, "lead_created", `Lead created for ${business.canonicalName}`);
    recordActivity(
      newLead.id,
      "business_discovered",
      `Discovered via ${business.sources?.[0]?.sourceType || "search"} in ${business.city || "Target Location"}`
    );
    if (business.identityStatus === "verified") {
      recordActivity(newLead.id, "business_verified", `Identity verified with score ${business.identityScore}`);
    }
    if (isQualified) {
      recordActivity(newLead.id, "lead_qualified", `Auto-qualified with score ${business.qualificationScore}/100`);
    }
    return newLead;
  }

  // Update existing snapshot
  found.qualificationScore = business.qualificationScore;
  found.serviceFitScore = business.qualification?.serviceFitScore || found.serviceFitScore;
  found.updatedAt = now;
  persistCrmData();
  return found;
}

export function getLeadById(id: string): CrmLead | null {
  return crmLeads.get(id) || null;
}

export function getLeadByBusinessId(bizId: string): CrmLead | null {
  return Array.from(crmLeads.values()).find((l) => l.businessId === bizId) || null;
}

export function listLeads(filters?: {
  stage?: LeadStage | "all";
  priority?: LeadPriority | "all";
  search?: string;
  assignedTo?: string;
}): CrmLead[] {
  let list = Array.from(crmLeads.values());

  if (filters?.stage && filters.stage !== "all") {
    list = list.filter((l) => l.stage === filters.stage);
  }
  if (filters?.priority && filters.priority !== "all") {
    list = list.filter((l) => l.priority === filters.priority);
  }
  if (filters?.assignedTo) {
    list = list.filter((l) => l.assignedTo === filters.assignedTo);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (l) =>
        l.companyName.toLowerCase().includes(q) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
    );
  }

  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function updateLeadStage(id: string, newStage: LeadStage, userId?: string, reason?: string): CrmLead {
  const lead = crmLeads.get(id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  const prevStage = lead.stage;
  if (prevStage === newStage) return lead;

  lead.stage = newStage;
  lead.updatedAt = new Date().toISOString();

  if (newStage === "contacted" && !lead.firstContactedAt) {
    lead.firstContactedAt = lead.updatedAt;
  }
  if ((newStage === "lost" || newStage === "disqualified") && reason) {
    lead.lostReason = reason;
  }

  recordActivity(lead.id, "stage_changed", `Stage updated to ${newStage}`, {
    previousValue: prevStage,
    newValue: newStage,
    userId,
    description: reason,
  });

  return lead;
}

export function updateLead(id: string, updates: Partial<CrmLead>, userId?: string): CrmLead {
  const lead = crmLeads.get(id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  if (updates.stage && updates.stage !== lead.stage) {
    return updateLeadStage(id, updates.stage, userId, updates.lostReason || undefined);
  }

  Object.assign(lead, updates, { updatedAt: new Date().toISOString() });

  if (updates.notes) {
    recordActivity(lead.id, "note_added", "Note updated", { userId });
  }
  if (updates.priority && updates.priority !== lead.priority) {
    recordActivity(lead.id, "priority_changed", `Priority changed to ${updates.priority}`, { userId });
  }
  if (updates.assignedTo && updates.assignedTo !== lead.assignedTo) {
    recordActivity(lead.id, "assigned", `Assigned to ${updates.assignedTo}`, { userId });
  }

  return lead;
}

export function getLeadActivities(leadId: string): Activity[] {
  return activities.get(leadId) || [];
}

// ============================================================
// OUTREACH & CONVERSATION OPERATIONS
// ============================================================
export function createOutreachDraft(
  leadId: string,
  params: {
    channel: OutreachChannel;
    contactId?: string;
    subject?: string;
    body: string;
    userId?: string;
    scheduledAt?: string;
  }
): OutreachActivity {
  const lead = crmLeads.get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const now = new Date().toISOString();
  const outreach: OutreachActivity = {
    id: crypto.randomUUID(),
    leadId,
    contactId: params.contactId ?? null,
    userId: params.userId ?? null,
    channel: params.channel,
    messageSubject: params.subject ?? null,
    messageBody: params.body,
    status: "draft",
    provider: null,
    providerMessageId: null,
    scheduledAt: params.scheduledAt ?? null,
    sentAt: null,
    deliveredAt: null,
    repliedAt: null,
    outcome: null,
    nextAction: "Requires approval before dispatch",
    isManual: false,
    createdAt: now,
    updatedAt: now,
  };

  outreachList.set(outreach.id, outreach);
  recordActivity(leadId, "message_drafted", `Outreach drafted for ${params.channel}`, {
    userId: params.userId,
    description: params.subject || undefined,
  });

  return outreach;
}

export function sendOrLogOutreach(
  outreachId: string,
  options?: {
    isManual?: boolean;
    provider?: string;
    providerMessageId?: string;
    deliveryConfirmed?: boolean;
  }
): OutreachActivity {
  const outreach = outreachList.get(outreachId);
  if (!outreach) throw new Error(`Outreach ${outreachId} not found`);

  // Suppression list check: Prevent sending to unsubscribed contacts
  const lead = crmLeads.get(outreach.leadId);
  if (lead) {
    const isContactSuppressed = (lead.contacts || []).some((c) => isSuppressed(c.value || (c as unknown as { contactValue?: string }).contactValue));
    const isEmailSuppressed = lead.primaryEmail ? isSuppressed(lead.primaryEmail) : false;
    const isLeadSuppressed =
      isContactSuppressed ||
      isEmailSuppressed ||
      isSuppressed(lead.companyName) ||
      (lead.stage === "disqualified" && lead.lostReason?.toLowerCase().includes("unsubscribe"));
    if (isLeadSuppressed) {
      throw new Error(`Cannot send outreach: Contact for lead "${lead.companyName}" is on the suppression list (unsubscribed).`);
    }
  }

  const now = new Date().toISOString();
  outreach.status = options?.deliveryConfirmed ? "delivered" : "sent";
  outreach.sentAt = now;
  if (options?.deliveryConfirmed) {
    outreach.deliveredAt = now;
  }
  outreach.isManual = !!options?.isManual;
  outreach.provider = options?.provider ?? "SMTP / Direct";
  outreach.providerMessageId = options?.providerMessageId ?? `msg_${crypto.randomUUID()}`;
  outreach.updatedAt = now;

  // Move lead stage to 'contacted' if in earlier stage
  if (lead && (lead.stage === "new" || lead.stage === "researched" || lead.stage === "qualified" || lead.stage === "ready_for_outreach")) {
    updateLeadStage(lead.id, "contacted", outreach.userId || undefined);
  }

  recordActivity(
    outreach.leadId,
    "message_sent",
    `${outreach.isManual ? "Manual message logged" : "Message sent"} via ${outreach.channel}`,
    {
      description: outreach.messageSubject || undefined,
      metadata: { outreachId, providerMessageId: outreach.providerMessageId },
    }
  );

  if (options?.deliveryConfirmed) {
    recordActivity(outreach.leadId, "delivery_confirmed", `Delivery confirmed via ${outreach.provider}`);
  }

  // Create or update conversation thread
  let conv = Array.from(conversations.values()).find((c) => c.leadId === outreach.leadId && c.channel === outreach.channel);
  if (!conv) {
    conv = {
      id: crypto.randomUUID(),
      leadId: outreach.leadId,
      contactId: outreach.contactId,
      channel: outreach.channel,
      subject: outreach.messageSubject,
      threadId: `th_${crypto.randomUUID()}`,
      status: "waiting_reply",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };
    conversations.set(conv.id, conv);
  } else {
    conv.status = "waiting_reply";
    conv.lastMessageAt = now;
    conv.updatedAt = now;
  }

  // Add outbound message to conversation
  const convMsgs = messages.get(conv.id) || [];
  convMsgs.push({
    id: crypto.randomUUID(),
    conversationId: conv.id,
    outreachId: outreach.id,
    direction: "outbound",
    senderName: "SoleTrust Sales",
    body: outreach.messageBody || "",
    isManual: outreach.isManual,
    providerMessageId: outreach.providerMessageId,
    sentAt: now,
    createdAt: now,
  });
  messages.set(conv.id, convMsgs);

  // Auto-schedule follow-up task 3 business days later
  const followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  scheduleFollowUp(outreach.leadId, `Follow-up after ${outreach.channel} outreach`, followUpDate, outreach.userId || undefined);

  return outreach;
}

export function recordIncomingReply(
  leadId: string,
  params: {
    channel: OutreachChannel;
    body: string;
    senderName?: string;
    senderEmail?: string;
    classification?: "positive" | "neutral" | "negative" | "out_of_office" | "unsubscribe";
    isManual?: boolean;
    providerMessageId?: string;
  }
): { message: ConversationMessage; lead: CrmLead } {
  const lead = crmLeads.get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const now = new Date().toISOString();

  // Find or create conversation
  let conv = Array.from(conversations.values()).find((c) => c.leadId === leadId && c.channel === params.channel);
  if (!conv) {
    conv = {
      id: crypto.randomUUID(),
      leadId,
      channel: params.channel,
      subject: "Incoming conversation",
      threadId: `th_${crypto.randomUUID()}`,
      status: "replied",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };
    conversations.set(conv.id, conv);
  } else {
    conv.status = "replied";
    conv.lastMessageAt = now;
    conv.updatedAt = now;
  }

  const msg: ConversationMessage = {
    id: crypto.randomUUID(),
    conversationId: conv.id,
    direction: "inbound",
    senderName: params.senderName ?? "Prospect",
    senderEmail: params.senderEmail ?? null,
    body: params.body,
    replyClassification: params.classification || "neutral",
    isManual: !!params.isManual,
    providerMessageId: params.providerMessageId ?? `reply_${crypto.randomUUID()}`,
    sentAt: now,
    createdAt: now,
  };

  const convMsgs = messages.get(conv.id) || [];
  convMsgs.push(msg);
  messages.set(conv.id, convMsgs);

  // Record activity
  recordActivity(
    leadId,
    params.isManual ? "reply_logged" : "reply_received",
    `Received reply via ${params.channel} (${params.classification || "neutral"})`,
    {
      description: params.body.slice(0, 150),
      metadata: { classification: params.classification, senderEmail: params.senderEmail },
    }
  );

  // AUTOMATIC RULES ON REPLY:
  // 1. Advance lead stage to 'engaged' if currently 'contacted'
  if (lead.stage === "contacted") {
    updateLeadStage(leadId, "engaged");
  }

  // 2. Pause all pending follow-ups for this lead
  pauseFollowUpsForLead(leadId, `Paused due to incoming reply received at ${now}`);

  // 3. If unsubscribe, add to suppression list
  if (params.classification === "unsubscribe") {
    if (params.senderEmail) addToSuppressionList(params.senderEmail);
    updateLeadStage(leadId, "disqualified", undefined, "Unsubscribe requested by prospect");
  }

  return { message: msg, lead };
}

export function addToSuppressionList(entry?: string | null): void {
  if (!entry || typeof entry !== "string") return;
  suppressionList.add(entry.toLowerCase().trim());
  persistCrmData();
}

export function isSuppressed(entry?: string | null): boolean {
  if (!entry || typeof entry !== "string") return false;
  return suppressionList.has(entry.toLowerCase().trim());
}

export function getLeadOutreach(leadId: string): OutreachActivity[] {
  return Array.from(outreachList.values()).filter((o) => o.leadId === leadId);
}

export function getLeadConversations(leadId: string): (Conversation & { messages: ConversationMessage[] })[] {
  const convs = Array.from(conversations.values()).filter((c) => c.leadId === leadId);
  return convs.map((c) => ({
    ...c,
    messages: messages.get(c.id) || [],
  }));
}

// ============================================================
// FOLLOW-UP OPERATIONS
// ============================================================
export function scheduleFollowUp(
  leadId: string,
  reason: string,
  dueAt: string,
  userId?: string
): FollowUp {
  const followUp: FollowUp = {
    id: crypto.randomUUID(),
    leadId,
    userId: userId ?? null,
    reason,
    dueAt,
    status: "pending",
    completedAt: null,
    pausedReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  followUps.set(followUp.id, followUp);

  const lead = crmLeads.get(leadId);
  if (lead) {
    lead.nextFollowUpAt = dueAt;
    lead.nextAction = reason;
  }

  recordActivity(leadId, "follow_up_scheduled", `Follow-up scheduled: ${reason}`, {
    description: `Due at ${dueAt}`,
    userId,
  });

  return followUp;
}

export function pauseFollowUpsForLead(leadId: string, reason: string): void {
  for (const f of followUps.values()) {
    if (f.leadId === leadId && f.status === "pending") {
      f.status = "paused";
      f.pausedReason = reason;
      f.updatedAt = new Date().toISOString();
    }
  }
}

export function completeFollowUp(id: string, userId?: string): FollowUp {
  const f = followUps.get(id);
  if (!f) throw new Error(`Follow-up ${id} not found`);

  f.status = "completed";
  f.completedAt = new Date().toISOString();
  f.updatedAt = f.completedAt;

  recordActivity(f.leadId, "follow_up_completed", `Follow-up completed: ${f.reason}`, { userId });
  return f;
}

export function listFollowUps(leadId?: string): FollowUp[] {
  const now = new Date().getTime();
  const list = Array.from(followUps.values());

  // Update overdue status dynamically
  for (const f of list) {
    if (f.status === "pending" && new Date(f.dueAt).getTime() < now) {
      f.status = "overdue";
    }
  }

  if (leadId) return list.filter((f) => f.leadId === leadId);
  return list.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

// ============================================================
// TASKS OPERATIONS
// ============================================================
export function createTask(params: {
  title: string;
  leadId?: string;
  description?: string;
  priority?: "critical" | "high" | "medium" | "low";
  dueAt?: string;
  assignedTo?: string;
  createdBy?: string;
}): Task {
  const task: Task = {
    id: crypto.randomUUID(),
    leadId: params.leadId ?? null,
    assignedTo: params.assignedTo ?? null,
    createdBy: params.createdBy ?? null,
    title: params.title,
    description: params.description ?? null,
    priority: params.priority || "medium",
    status: "todo",
    dueAt: params.dueAt ?? null,
    completedAt: null,
    reminderAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.set(task.id, task);

  if (task.leadId) {
    recordActivity(task.leadId, "task_created", `Task created: ${task.title}`);
  }

  return task;
}

export function updateTaskStatus(id: string, status: "todo" | "in_progress" | "completed" | "cancelled"): Task {
  const t = tasks.get(id);
  if (!t) throw new Error(`Task ${id} not found`);

  t.status = status;
  t.updatedAt = new Date().toISOString();
  if (status === "completed") {
    t.completedAt = t.updatedAt;
    if (t.leadId) {
      recordActivity(t.leadId, "task_completed", `Task completed: ${t.title}`);
    }
  }

  return t;
}

export function listTasks(leadId?: string): Task[] {
  const list = Array.from(tasks.values());
  if (leadId) return list.filter((t) => t.leadId === leadId);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================
// MEETINGS OPERATIONS
// ============================================================
export function scheduleMeeting(params: {
  leadId?: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  meetingUrl?: string;
  attendees?: Array<{ name: string; email?: string; role?: string }>;
  agenda?: string;
  organizedBy?: string;
}): Meeting {
  const meeting: Meeting = {
    id: crypto.randomUUID(),
    leadId: params.leadId ?? null,
    organizedBy: params.organizedBy ?? null,
    title: params.title,
    description: params.description ?? null,
    location: params.location ?? "Google Meet",
    meetingUrl: params.meetingUrl ?? "https://meet.google.com/demo-lead",
    startsAt: params.startsAt,
    endsAt: params.endsAt ?? null,
    timezone: "Asia/Kolkata",
    status: "scheduled",
    attendees: params.attendees || [],
    agenda: params.agenda ?? null,
    notes: null,
    outcome: null,
    nextActions: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  meetings.set(meeting.id, meeting);

  if (meeting.leadId) {
    updateLeadStage(meeting.leadId, "meeting_scheduled");
    recordActivity(meeting.leadId, "meeting_scheduled", `Meeting scheduled: ${meeting.title}`, {
      description: `Starts at ${meeting.startsAt}`,
    });
  }

  return meeting;
}

export function completeMeeting(id: string, notes?: string, outcome?: string): Meeting {
  const m = meetings.get(id);
  if (!m) throw new Error(`Meeting ${id} not found`);

  m.status = "completed";
  m.notes = notes ?? null;
  m.outcome = outcome ?? null;
  m.updatedAt = new Date().toISOString();

  if (m.leadId) {
    recordActivity(m.leadId, "meeting_completed", `Meeting completed: ${m.title}`, {
      description: outcome || notes || undefined,
    });
  }

  return m;
}

export function listMeetings(leadId?: string): Meeting[] {
  const list = Array.from(meetings.values());
  if (leadId) return list.filter((m) => m.leadId === leadId);
  return list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

// ============================================================
// DEALS & CUSTOMER OPERATIONS
// ============================================================
export function createDeal(params: {
  leadId: string;
  title: string;
  amount: number;
  currency?: string;
  stage?: "proposal" | "negotiation" | "won" | "lost";
  serviceOffered?: string;
  probability?: number;
  expectedCloseDate?: string;
}): Deal {
  const deal: Deal = {
    id: crypto.randomUUID(),
    leadId: params.leadId,
    title: params.title,
    serviceOffered: params.serviceOffered ?? "Clinic Growth & Booking Engine",
    amount: params.amount,
    currency: params.currency || "INR",
    stage: params.stage || "proposal",
    probability: params.probability ?? 60,
    expectedCloseDate: params.expectedCloseDate ?? null,
    actualCloseDate: null,
    competitors: null,
    businessNeed: null,
    proposalUrl: null,
    lostReason: null,
    wonAt: null,
    lostAt: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  deals.set(deal.id, deal);

  const lead = crmLeads.get(params.leadId);
  if (lead) {
    lead.estimatedDealValue = deal.amount;
    if (deal.stage === "proposal") updateLeadStage(lead.id, "proposal_sent");
  }

  recordActivity(params.leadId, "deal_created", `Deal created: ${deal.title}`, {
    description: `Value: ${deal.currency} ${deal.amount?.toLocaleString()}`,
  });

  return deal;
}

export function updateDealStage(
  dealId: string,
  stage: "proposal" | "negotiation" | "won" | "lost",
  options?: { lostReason?: string }
): { deal: Deal; customer?: Customer } {
  const deal = deals.get(dealId);
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  deal.stage = stage;
  deal.updatedAt = new Date().toISOString();

  const lead = crmLeads.get(deal.leadId);

  if (stage === "won") {
    deal.wonAt = deal.updatedAt;
    deal.actualCloseDate = deal.updatedAt.slice(0, 10);
    deal.probability = 100;

    if (lead) {
      updateLeadStage(lead.id, "won");
    }

    recordActivity(deal.leadId, "won", `Deal Won: ${deal.title}!`, {
      description: `Closed revenue: ${deal.currency} ${deal.amount?.toLocaleString()}`,
    });

    // Automatically convert lead to customer
    const customer = convertLeadToCustomer(deal.leadId, deal.id);
    return { deal, customer };
  } else if (stage === "lost") {
    deal.lostAt = deal.updatedAt;
    deal.probability = 0;
    deal.lostReason = options?.lostReason ?? "Deal marked as lost";

    if (lead) {
      updateLeadStage(lead.id, "lost", undefined, deal.lostReason);
    }

    recordActivity(deal.leadId, "lost", `Deal Lost: ${deal.title}`, {
      description: deal.lostReason,
    });
    return { deal };
  } else {
    if (lead && stage === "negotiation") {
      updateLeadStage(lead.id, "negotiation");
    }
    recordActivity(deal.leadId, "deal_updated", `Deal moved to ${stage}`);
    return { deal };
  }
}

export function convertLeadToCustomer(leadId: string, dealId?: string): Customer {
  const lead = crmLeads.get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const deal = dealId ? deals.get(dealId) : Array.from(deals.values()).find((d) => d.leadId === leadId && d.stage === "won");
  const revenue = deal?.amount || lead.estimatedDealValue || 0;

  const customer: Customer = {
    id: crypto.randomUUID(),
    leadId: lead.id,
    businessId: lead.businessId,
    dealId: deal?.id ?? null,
    companyName: lead.companyName,
    primaryContactName: null,
    primaryContactEmail: null,
    industry: lead.industry,
    city: lead.city,
    country: lead.country,
    totalRevenue: revenue,
    currency: lead.currency || "INR",
    servicesSold: deal?.serviceOffered ? [deal.serviceOffered] : ["Full-Stack Clinic Growth Infrastructure"],
    status: "active",
    acquiredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  customers.set(customer.id, customer);
  persistCrmData();
  return customer;
}

export function listDeals(leadId?: string): Deal[] {
  const list = Array.from(deals.values());
  if (leadId) return list.filter((d) => d.leadId === leadId);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listCustomers(): Customer[] {
  return Array.from(customers.values()).sort(
    (a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
  );
}

// ============================================================
// REAL ANALYTICS CALCULATOR (NO FAKE / DECORATIVE METRICS)
// ============================================================
export function calculateCrmDashboardMetrics(): CrmDashboardMetrics {
  const leads = Array.from(crmLeads.values());
  const outreach = Array.from(outreachList.values());
  const allMessages = Array.from(messages.values()).flat();
  const allDeals = Array.from(deals.values());
  const allMeetings = Array.from(meetings.values());
  const allFollowUps = Array.from(followUps.values());

  const totalDiscovered = leads.length;
  const totalVerified = leads.filter((l) => l.stage !== "new").length;
  const totalQualified = leads.filter((l) => l.qualificationScore >= 60).length;
  const leadsReadyForOutreach = leads.filter((l) => l.stage === "ready_for_outreach" || l.stage === "qualified").length;
  const contactedLeads = leads.filter((l) => l.firstContactedAt !== null || l.stage === "contacted" || l.stage === "engaged").length;

  const messagesSent = outreach.filter((o) => o.status === "sent" || o.status === "delivered" || o.status === "replied").length;
  const messagesDelivered = outreach.filter((o) => o.status === "delivered" || o.status === "replied").length;

  const inboundReplies = allMessages.filter((m) => m.direction === "inbound");
  const actualReplies = inboundReplies.length;
  const positiveReplies = inboundReplies.filter((m) => m.replyClassification === "positive").length;
  const neutralReplies = inboundReplies.filter((m) => m.replyClassification === "neutral").length;
  const negativeReplies = inboundReplies.filter((m) => m.replyClassification === "negative").length;

  const noResponseLeads = leads.filter((l) => l.stage === "contacted").length;

  const now = new Date().getTime();
  const followUpsDue = allFollowUps.filter((f) => f.status === "pending" || f.status === "due").length;
  const followUpsOverdue = allFollowUps.filter((f) => f.status === "overdue" || (f.status === "pending" && new Date(f.dueAt).getTime() < now)).length;

  const meetingsScheduled = allMeetings.filter((m) => m.status === "scheduled" || m.status === "confirmed").length;
  const meetingsCompleted = allMeetings.filter((m) => m.status === "completed").length;

  const proposalsSent = allDeals.filter((d) => d.stage === "proposal").length;
  const negotiatingDeals = allDeals.filter((d) => d.stage === "negotiation").length;
  const wonDeals = allDeals.filter((d) => d.stage === "won").length;
  const lostDeals = allDeals.filter((d) => d.stage === "lost").length;

  const pipelineValue = allDeals
    .filter((d) => d.stage !== "lost" && d.stage !== "won")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const actualRevenue = allDeals
    .filter((d) => d.stage === "won")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const safeDiv = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

  return {
    totalDiscovered,
    totalVerified,
    totalQualified,
    leadsReadyForOutreach,
    contactedLeads,
    messagesSent,
    messagesDelivered,
    actualReplies,
    positiveReplies,
    neutralReplies,
    negativeReplies,
    noResponseLeads,
    followUpsDue,
    followUpsOverdue,
    meetingsScheduled,
    meetingsCompleted,
    proposalsSent,
    negotiatingDeals,
    wonDeals,
    lostDeals,
    pipelineValue,
    actualRevenue,
    currency: "INR",
    conversionRates: {
      discoveryToVerification: safeDiv(totalVerified, totalDiscovered),
      verificationToQualification: safeDiv(totalQualified, totalVerified),
      qualificationToOutreach: safeDiv(contactedLeads, totalQualified),
      outreachToReply: safeDiv(actualReplies, messagesSent),
      replyToMeeting: safeDiv(meetingsScheduled + meetingsCompleted, Math.max(actualReplies, 1)),
      meetingToProposal: safeDiv(proposalsSent + negotiatingDeals + wonDeals, Math.max(meetingsCompleted, 1)),
      proposalToWon: safeDiv(wonDeals, Math.max(proposalsSent + negotiatingDeals + wonDeals, 1)),
    },
  };
}
