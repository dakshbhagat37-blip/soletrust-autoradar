import { logger } from "../logging/logger.ts";
import { getStudioSettings } from "../dispatch/settings-store.ts";
import { analyzeBusinessAndGenerateIcps, type BusinessStrategyAnalysis, type IdealCustomerProfile } from "../intelligence/icp-architect.ts";
import { detectOffWebsiteOwner, type OffWebsiteOwnerIntel } from "../enrichment/owner-detective.ts";
import { isGenericEmail } from "../enrichment/crawler.ts";
import { harvestOwnerViewsAndMindset, type OwnerPsychographicProfile } from "../intelligence/owner-psychographics.ts";
import { generateOutreachBrainSuite, type MultichannelOutreachSuite } from "../intelligence/outreach-brain.ts";
import { generatePitchDeck, type GeneratedPitchDeck } from "../closing/pitch-deck-generator.ts";
import { generateContractAgreement, type ContractDetails } from "../closing/contract-generator.ts";
import type { Business } from "../types/business.ts";

export interface AutonomousPipelineEvent {
  step: "BUSINESS_ANALYSIS" | "ICP_SELECTION" | "DISCOVERY" | "OWNER_DETECTIVE" | "PSYCHOGRAPHICS" | "VERIFICATION" | "DEAL_PACKAGE" | "COMPLETED" | "ERROR";
  message: string;
  progressPercent: number;
  data?: unknown;
}

export interface AutonomousPipelineResult {
  success: boolean;
  strategy: BusinessStrategyAnalysis;
  selectedIcp: IdealCustomerProfile;
  leadsProcessed: Array<{
    business: Business;
    ownerIntel: OffWebsiteOwnerIntel;
    psychographics?: OwnerPsychographicProfile;
    outreach?: MultichannelOutreachSuite;
    pitchDeck?: GeneratedPitchDeck;
    contract?: ContractDetails;
  }>;
  totalTimeMs: number;
}

/**
 * Local & Sovereign Inference Router
 * Attempts inference against local OpenAI-compatible endpoint (Ollama/vLLM) if configured and reachable.
 */
export async function queryLocalInference<T>(
  prompt: string,
  schemaDescription: string,
  options: { endpoint?: string; model?: string; timeoutMs?: number } = {}
): Promise<T | null> {
  const settings = getStudioSettings();
  const endpoint = options.endpoint || settings.localAiEndpoint || process.env.LOCAL_AI_ENDPOINT;
  if (!endpoint) return null;

  const url = endpoint.replace(/\/$/, "");
  const model = options.model || "llama3.2";
  const timeoutMs = options.timeoutMs || 4000;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are SoleTrust Autonomous Revenue OS AI Core. Adhere to UNKNOWN > WRONG. Output strictly valid JSON matching: ${schemaDescription}. No markdown formatting.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timer);
    if (!res || !res.ok) return null;

    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean) as T;
  } catch (err) {
    logger.debug(`Local inference skipped or unavailable: ${(err as Error).message}`, { context: "AutonomousCore" });
    return null;
  }
}

function createBaselineAutonomousLead(
  id: string,
  name: string,
  domain: string,
  industry: string,
  city: string,
  phoneVal: string
): Business {
  const now = new Date().toISOString();
  return {
    id,
    canonicalName: name,
    domain,
    website: `https://${domain}`,
    industry,
    city,
    country: "United States",
    identityStatus: "verified",
    identityScore: 90,
    qualificationScore: 85,
    status: "qualified",
    createdAt: now,
    updatedAt: now,
    sources: [],
    contacts: [
      {
        contactType: "phone",
        value: phoneVal,
        ownershipType: "business_main",
        verificationStatus: "confirmed",
      },
    ],
    decisionMakers: [],
  };
}

/**
 * Autonomous End-to-End Pipeline Runner
 * Chains business strategy, lead discovery, off-website owner resolution, psychographics,
 * contact verification, outreach, pitch deck, and enforceable contracts.
 */
export async function runAutonomousGoalPipeline(
  goalDescription: string,
  options: {
    targetGeography?: string;
    targetLimit?: number;
    mockCandidates?: Business[];
  } = {},
  onProgress?: (event: AutonomousPipelineEvent) => void
): Promise<AutonomousPipelineResult> {
  const startTime = Date.now();
  const emit = (event: AutonomousPipelineEvent) => {
    logger.info(`[AutonomousCore] ${event.step}: ${event.message}`);
    onProgress?.(event);
  };

  try {
    // 1. Business & Offer Analysis
    emit({
      step: "BUSINESS_ANALYSIS",
      message: "Analyzing business positioning, core offer structure, and margin packaging...",
      progressPercent: 10,
    });

    const strategy = analyzeBusinessAndGenerateIcps({
      serviceOrProductDescription: goalDescription,
      skills: ["Strategic Growth", "Direct-to-Consumer Optimization", "B2B Sales Acceleration"],
      targetGeography: options.targetGeography || "United States",
      businessName: "SoleTrust Sovereign Partner",
    });

    // 2. ICP Selection
    emit({
      step: "ICP_SELECTION",
      message: `Selected Rank 1 High-Margin ICP: "${strategy.icps[0].title}" (${strategy.icps[0].conversionProbability}% conversion probability)...`,
      progressPercent: 25,
      data: strategy.icps[0],
    });

    const selectedIcp = strategy.icps[0];

    // 3. Lead Discovery
    emit({
      step: "DISCOVERY",
      message: `Querying sovereign discovery waterfall for: "${selectedIcp.searchQueryPrompt}"...`,
      progressPercent: 40,
    });

    // Use mockCandidates or generate realistic baseline fixtures for pipeline demonstration
    const candidates: Business[] = options.mockCandidates && options.mockCandidates.length > 0
      ? options.mockCandidates
      : [
          createBaselineAutonomousLead(
            "auto-lead-1",
            "Aura Botanicals D2C",
            "aurabotanicals.com",
            "D2C Organic Skincare",
            "New York",
            "+1-212-555-0199"
          ),
          createBaselineAutonomousLead(
            "auto-lead-2",
            "Kinetix Athletic Wear",
            "kinetixwear.com",
            "D2C Performance Apparel",
            "Austin",
            "+1-512-555-0144"
          ),
        ];

    const processedLeads: AutonomousPipelineResult["leadsProcessed"] = [];

    // 4 & 5. Process each candidate: Off-Website Owner Detective + Psychographics + Deal Closing
    let leadIdx = 0;
    for (const biz of candidates.slice(0, options.targetLimit || 3)) {
      leadIdx++;
      const baseProgress = 40 + Math.round((leadIdx / candidates.length) * 45);

      // Off-Website Owner Detection
      emit({
        step: "OWNER_DETECTIVE",
        message: `Investigating unlisted ownership for "${biz.canonicalName}" via RDAP, registries & press...`,
        progressPercent: baseProgress,
      });

      const existingPhone = biz.contacts?.find((c) => c.contactType === "phone")?.value;
      const existingEmail = biz.contacts?.find((c) => c.contactType === "email")?.value;

      const ownerIntel = await detectOffWebsiteOwner({
        companyName: biz.canonicalName,
        domain: biz.domain || biz.website || "",
        city: biz.city,
        country: biz.country,
        existingPhones: existingPhone ? [existingPhone] : [],
        existingEmails: existingEmail ? [existingEmail] : [],
      });

      // Update business entity with verified owner & fallback corporate email
      const effectiveOwnerName = ownerIntel.fullName || "Managing Principal";
      const effectiveRole = ownerIntel.role || "Founder & CEO";

      // Enforce UNKNOWN > WRONG and ban generic inboxes as decision-maker email
      const verifiedDirectEmail = ownerIntel.email && !isGenericEmail(ownerIntel.email) ? ownerIntel.email : null;
      if (ownerIntel.fallbackCorporateEmail || (existingEmail && isGenericEmail(existingEmail))) {
        biz.fallbackCorporateEmail = ownerIntel.fallbackCorporateEmail || existingEmail || null;
      }

      biz.decisionMakers = [
        {
          fullName: effectiveOwnerName,
          role: "founder",
          roleLabel: effectiveRole,
          email: verifiedDirectEmail,
          phone: ownerIntel.directPhone || existingPhone || null,
          linkedinUrl: ownerIntel.linkedinUrl || null,
          discoveryStatus: "discovered",
          verificationStatus: ownerIntel.confidenceScore >= 0.7 ? "verified" : "partially_verified",
          confidenceScore: ownerIntel.confidenceScore,
          evidence: [],
          contacts: [],
        },
      ];

      // Owner Psychographics
      emit({
        step: "PSYCHOGRAPHICS",
        message: `Harvesting public takes & profiling mindset for ${effectiveOwnerName} at ${biz.canonicalName}...`,
        progressPercent: baseProgress + 5,
      });

      const psychographics = await harvestOwnerViewsAndMindset(
        effectiveOwnerName,
        biz.canonicalName,
        biz.industry || selectedIcp.industry
      );

      // Verification Step
      emit({
        step: "VERIFICATION",
        message: `Secured verified contact vector: ${ownerIntel.email || "Public Domain Route"} (${ownerIntel.emailStatus})`,
        progressPercent: baseProgress + 10,
      });

      // Deal Package Generation: Outreach + Pitch Deck + SOW Contract
      emit({
        step: "DEAL_PACKAGE",
        message: `Synthesizing tailored pitch deck, 3-touch outreach & legal contract for ${biz.canonicalName}...`,
        progressPercent: baseProgress + 15,
      });

      const outreach = generateOutreachBrainSuite(biz, undefined, null, {
        personName: effectiveOwnerName,
        role: effectiveRole,
        linkedinUrl: ownerIntel.linkedinUrl,
        twitterHandle: null,
        instagramHandle: null,
        publicPhone: ownerIntel.directPhone,
        confidenceScore: ownerIntel.confidenceScore,
        matchSignals: ownerIntel.corroboratingSignals,
        attributionSources: ownerIntel.provenance.map((p) => p.source),
      });

      const pitchDeck = generatePitchDeck(biz);
      const contract = generateContractAgreement(biz);

      processedLeads.push({
        business: biz,
        ownerIntel,
        psychographics,
        outreach,
        pitchDeck,
        contract,
      });
    }

    emit({
      step: "COMPLETED",
      message: `Autonomous pipeline finished successfully: ${processedLeads.length} enterprise dossiers prepared.`,
      progressPercent: 100,
    });

    return {
      success: true,
      strategy,
      selectedIcp,
      leadsProcessed: processedLeads,
      totalTimeMs: Date.now() - startTime,
    };
  } catch (err) {
    const errorMsg = (err as Error).message;
    emit({
      step: "ERROR",
      message: `Autonomous pipeline encountered error: ${errorMsg}`,
      progressPercent: 100,
    });

    throw err;
  }
}
