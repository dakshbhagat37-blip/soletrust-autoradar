/**
 * SoleTrust Business OS v5.0 — Unified Omnichannel Inbox & Relationship Health
 * Consolidates Email, WhatsApp, Instagram, LinkedIn & Call threads into a single
 * chronological timeline with deterministic 0-100 Relationship Health scoring.
 */

import { dbStore } from "../../server/db/store.ts";
import type {
  ClientRelationship,
  OmnichannelInteraction,
  OmnichannelChannel,
  MessageDirection,
  MessageSentiment,
  ClientPortalSession,
} from "../../server/db/schema.ts";

export interface LogInteractionInput {
  clientId: string;
  channel: OmnichannelChannel;
  direction: MessageDirection;
  subject?: string;
  content: string;
  sender: string;
  recipient: string;
  sentiment?: MessageSentiment;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthScoreBreakdown {
  score: number; // 0 - 100
  status: "thriving" | "healthy" | "at_risk" | "critical";
  recencyScore: number; // Max 30
  sentimentScore: number; // Max 25
  invoiceHealthScore: number; // Max 25
  interactionVolumeScore: number; // Max 20
  reasons: string[];
  isGoingCold: boolean;
}

/**
 * Calculates deterministic Relationship Health Score (0–100)
 * UNKNOWN > WRONG: uses verifiable interaction timestamps, invoice states, and sentiment.
 */
export function calculateRelationshipHealth(clientId: string): HealthScoreBreakdown {
  const client = dbStore.getClient(clientId);
  const interactions = dbStore.getInteractionsForClient(clientId);
  const invoices = dbStore.listInvoices(clientId);

  const reasons: string[] = [];

  // 1. Recency Score (Max 30)
  let recencyScore = 15;
  const now = Date.now();
  const lastTouch = client?.lastTouchpointDate
    ? new Date(client.lastTouchpointDate).getTime()
    : interactions.length > 0
    ? new Date(interactions[interactions.length - 1].timestamp).getTime()
    : 0;

  let isGoingCold = false;

  if (lastTouch > 0) {
    const daysSince = (now - lastTouch) / (1000 * 60 * 60 * 24);
    if (daysSince <= 3) {
      recencyScore = 30;
      reasons.push("Recent contact within 3 days (+30)");
    } else if (daysSince <= 7) {
      recencyScore = 24;
      reasons.push("Active communication within last 7 days (+24)");
    } else if (daysSince <= 14) {
      recencyScore = 16;
      reasons.push("Moderate recency: last contacted within 14 days (+16)");
    } else if (daysSince <= 21) {
      recencyScore = 8;
      isGoingCold = true;
      reasons.push("Client going cold: no touchpoint in over 14 days (+8)");
    } else {
      recencyScore = 0;
      isGoingCold = true;
      reasons.push("Critical lack of contact: inactive for >21 days (0/30)");
    }
  } else {
    recencyScore = 5;
    reasons.push("No recorded client touchpoint (+5)");
  }

  // 2. Sentiment Score (Max 25)
  let sentimentScore = 15;
  if (interactions.length > 0) {
    const recent5 = interactions.slice(-5);
    const positiveCount = recent5.filter((i) => i.sentiment === "positive").length;
    const negativeCount = recent5.filter((i) => i.sentiment === "negative").length;
    const urgentCount = recent5.filter((i) => i.sentiment === "urgent").length;

    if (positiveCount >= 3) {
      sentimentScore = 25;
      reasons.push("Consistently positive interaction sentiment (+25)");
    } else if (negativeCount >= 2) {
      sentimentScore = 5;
      reasons.push("Negative sentiment detected in recent comms (5/25)");
    } else if (urgentCount >= 2) {
      sentimentScore = 10;
      reasons.push("Multiple urgent/escalated queries pending (10/25)");
    } else {
      sentimentScore = 18;
      reasons.push("Steady/neutral interaction sentiment (+18)");
    }
  }

  // 3. Invoice & Payment Health (Max 25)
  let invoiceHealthScore = 25;
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const unpaidInvoices = invoices.filter((i) => i.status === "issued" || i.status === "viewed");

  if (overdueInvoices.length > 0) {
    invoiceHealthScore = 5;
    isGoingCold = true;
    reasons.push(`Client has ${overdueInvoices.length} overdue invoice(s) (5/25)`);
  } else if (unpaidInvoices.length > 2) {
    invoiceHealthScore = 15;
    reasons.push(`Multiple pending invoices (${unpaidInvoices.length}) awaiting settlement (+15)`);
  } else if (invoices.some((i) => i.status === "paid")) {
    invoiceHealthScore = 25;
    reasons.push("Excellent payment history: all settled on time (+25)");
  } else {
    invoiceHealthScore = 20; // Default when no invoice issued yet
  }

  // 4. Interaction Volume & Channel Breadth (Max 20)
  let interactionVolumeScore = 10;
  const channelsUsed = new Set(interactions.map((i) => i.channel));
  if (channelsUsed.size >= 3) {
    interactionVolumeScore = 20;
    reasons.push(`Deep multichannel engagement across ${channelsUsed.size} channels (+20)`);
  } else if (channelsUsed.size >= 2) {
    interactionVolumeScore = 15;
    reasons.push(`Active dual-channel touchpoints (+15)`);
  } else if (interactions.length > 0) {
    interactionVolumeScore = 10;
    reasons.push("Single-channel communication active (+10)");
  } else {
    interactionVolumeScore = 5;
  }

  const totalScore = Math.min(100, Math.max(0, recencyScore + sentimentScore + invoiceHealthScore + interactionVolumeScore));

  let status: "thriving" | "healthy" | "at_risk" | "critical" = "healthy";
  if (totalScore >= 80) status = "thriving";
  else if (totalScore >= 60) status = "healthy";
  else if (totalScore >= 40) status = "at_risk";
  else status = "critical";

  return {
    score: totalScore,
    status,
    recencyScore,
    sentimentScore,
    invoiceHealthScore,
    interactionVolumeScore,
    reasons,
    isGoingCold,
  };
}

/**
 * Logs an omnichannel message into the unified timeline and recalculates health score.
 */
export function logOmnichannelInteraction(input: LogInteractionInput): OmnichannelInteraction {
  const timestamp = input.timestamp || new Date().toISOString();
  
  // Auto-detect sentiment if not provided
  let sentiment: MessageSentiment = input.sentiment || "neutral";
  if (!input.sentiment) {
    const text = input.content.toLowerCase();
    if (text.includes("urgent") || text.includes("asap") || text.includes("blocked") || text.includes("issue")) {
      sentiment = "urgent";
    } else if (text.includes("great") || text.includes("love") || text.includes("perfect") || text.includes("approved") || text.includes("thank")) {
      sentiment = "positive";
    } else if (text.includes("disappointed") || text.includes("delayed") || text.includes("wrong") || text.includes("unhappy")) {
      sentiment = "negative";
    }
  }

  const interaction: OmnichannelInteraction = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    clientId: input.clientId,
    channel: input.channel,
    direction: input.direction,
    subject: input.subject,
    content: input.content,
    sender: input.sender,
    recipient: input.recipient,
    sentiment,
    timestamp,
    metadata: input.metadata,
  };

  dbStore.addInteraction(interaction);

  // Recalculate client health and save
  const client = dbStore.getClient(input.clientId);
  if (client) {
    const health = calculateRelationshipHealth(input.clientId);
    client.healthScore = health.score;
    client.healthStatus = health.status;
    dbStore.saveClient(client);
  }

  return interaction;
}

/**
 * Creates or retrieves a persistent client relationship record.
 */
export function getOrCreateClientRelationship(data: {
  id?: string;
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  website?: string;
  industry?: string;
  city?: string;
  country?: string;
  dealId?: string;
  leadId?: string;
}): ClientRelationship {
  const existing = data.id
    ? dbStore.getClient(data.id)
    : dbStore.listClients().find((c) => c.companyName.toLowerCase() === data.companyName.toLowerCase());

  if (existing) {
    return existing;
  }

  const clientId = data.id || `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const portalToken = `portal_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

  const newClient: ClientRelationship = {
    id: clientId,
    companyName: data.companyName,
    primaryContactName: data.primaryContactName,
    primaryContactEmail: data.primaryContactEmail,
    primaryContactPhone: data.primaryContactPhone,
    website: data.website,
    industry: data.industry || "General",
    city: data.city || "Global",
    country: data.country || "Global",
    dealId: data.dealId,
    leadId: data.leadId,
    portalToken,
    healthScore: 85,
    healthStatus: "thriving",
    lastTouchpointDate: new Date().toISOString(),
    openInvoiceCount: 0,
    totalRevenueCents: 0,
    tags: ["active-client"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.saveClient(newClient);

  // Auto-create client portal session
  const portalSession: ClientPortalSession = {
    token: portalToken,
    clientId,
    dealId: data.dealId || `deal-${clientId}`,
    clientName: data.companyName,
    contractSigned: false,
    createdDate: new Date().toISOString(),
    lastAccessedDate: new Date().toISOString(),
  };
  dbStore.savePortalSession(portalSession);

  return newClient;
}
