import { getStudioSettings } from "./settings-store.ts";
import type { WebhookDispatchPayload } from "./types.ts";
import type { CrmLead } from "../types/lead.ts";
import type { Business } from "../types/business.ts";
import { generateOutreachBrainSuite } from "../intelligence/outreach-brain.ts";
import { logger } from "../logging/logger.ts";

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  message: string;
}

/**
 * Dispatch lead data & 3-touch sequence to an external sequencer or CRM webhook
 */
export async function dispatchLeadWebhook(
  lead: CrmLead,
  business: Business,
  event: WebhookDispatchPayload["event"] = "lead.qualified",
  options: { customWebhookUrl?: string; authHeader?: string } = {}
): Promise<WebhookDispatchResult> {
  const settings = getStudioSettings();
  const targetUrl = options.customWebhookUrl || settings.webhookUrl;

  if (!targetUrl || (!settings.webhookEnabled && !options.customWebhookUrl)) {
    return {
      success: false,
      message: "Webhook dispatch is disabled or no URL configured in Studio Settings",
    };
  }

  const brain = generateOutreachBrainSuite(business, lead);

  const payload: WebhookDispatchPayload = {
    event,
    timestamp: new Date().toISOString(),
    lead: {
      id: lead.id,
      companyName: lead.companyName,
      website: lead.website,
      city: lead.city,
      country: lead.country,
      primaryEmail: lead.primaryEmail,
      primaryPhone: lead.primaryPhone,
      decisionMakerName: lead.primaryDecisionMakerName || brain.decisionMakerName,
      decisionMakerRole: lead.primaryDecisionMakerRole || brain.decisionMakerRole,
      stage: lead.stage,
      score: lead.qualificationScore,
      estimatedValue: lead.estimatedDealValue,
      currency: lead.currency || settings.defaultCurrency,
    },
    outreachSequence: {
      touch1: brain.emailSequence.touch1,
      touch2: brain.emailSequence.touch2,
      touch3: brain.emailSequence.touch3,
      whatsappDraft: brain.whatsAppVoiceNote.quickTwoLineOpener,
      optimalSendWindow: `${brain.timing.bestDays.join(", ")} ${brain.timing.bestTimeLocal} (${brain.timing.timezone})`,
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SoleTrust-AutoRadar-Dispatcher/3.0",
    };

    const auth = options.authHeader || settings.webhookAuthHeader;
    if (auth) {
      headers["Authorization"] = auth;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      logger.info(`Webhook successfully dispatched for lead ${lead.companyName} (${lead.id}) to ${targetUrl}`, {
        context: "WebhookDispatcher",
      });
      return {
        success: true,
        statusCode: response.status,
        message: `Successfully dispatched to ${targetUrl} (Status ${response.status})`,
      };
    }

    return {
      success: false,
      statusCode: response.status,
      message: `Webhook endpoint returned HTTP ${response.status}`,
    };
  } catch (err) {
    const errMsg = (err as Error).message;
    logger.warn(`Webhook dispatch error for lead ${lead.id}: ${errMsg}`, { context: "WebhookDispatcher" });
    return {
      success: false,
      message: `Webhook network failure: ${errMsg}`,
    };
  }
}

/**
 * Send a verification ping to validate a webhook URL
 */
export async function testWebhookEndpoint(url: string, authHeader?: string): Promise<WebhookDispatchResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { success: false, message: "Invalid URL protocol (must begin with http:// or https://)" };
  }

  const testPayload = {
    event: "test.ping",
    timestamp: new Date().toISOString(),
    source: "SoleTrust AutoRadar v3.0",
    message: "Test webhook connection successful from AutoRadar Dispatcher",
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SoleTrust-AutoRadar-Dispatcher/3.0",
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    return {
      success: res.ok,
      statusCode: res.status,
      message: res.ok
        ? `Endpoint connected successfully (HTTP ${res.status})`
        : `Endpoint returned error status (HTTP ${res.status})`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${(err as Error).message}`,
    };
  }
}
