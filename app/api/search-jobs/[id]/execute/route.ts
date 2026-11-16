import { getSearchJob, saveSearchJob, saveJobBusinesses } from "../../../../../lib/jobs/store.ts";
import { createOrUpdateLeadFromBusiness } from "../../../../../lib/crm/store.ts";
import { executeBusinessDiscovery } from "../../../../../lib/discovery/pipeline.ts";
import { verifyCandidateBatch } from "../../../../../lib/verification/gatekeeper.ts";
import { enrichBusinessFromWebsite } from "../../../../../lib/intelligence/enrichment.ts";
import { discoverDecisionMakers } from "../../../../../lib/decision-makers/pipeline.ts";
import { classifyAndVerifyBusinessContacts } from "../../../../../lib/contacts/classification.ts";
import { calculateQualificationScores } from "../../../../../lib/qualification/calculator.ts";
import { createSuccessResponse, createErrorResponse } from "../../../../../lib/types/api.ts";
import { logger } from "../../../../../lib/logging/logger.ts";
import type { Business } from "../../../../../lib/types/business.ts";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  if (!id) {
    return Response.json(
      createErrorResponse("INVALID_ID", "Job ID is required", undefined, requestId),
      { status: 400 }
    );
  }

  const job = await getSearchJob(id);
  if (!job) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Search job [${id}] not found`, undefined, requestId),
      { status: 404 }
    );
  }

  try {
    job.status = "discovering";
    job.currentStage = "discovery";
    job.progress = 10;
    await saveSearchJob(job);

    logger.info("Executing full AutoRadar pipeline for job", {
      context: "POST /api/search-jobs/[id]/execute",
      searchJobId: job.id,
      data: job.query,
    });

    // Stage 1: Business Discovery
    const discoveryRes = await executeBusinessDiscovery(job.query, {
      searchJobId: job.id,
    });
    const candidates = discoveryRes.accepted;

    job.stageStats.candidatesFound = discoveryRes.stats.totalDiscovered;
    job.stageStats.uniqueBusinesses = discoveryRes.stats.afterDeduplication;
    job.status = "verifying";
    job.currentStage = "identity_verification";
    job.progress = 30;
    await saveSearchJob(job);

    // Stage 2, 3, 4: Business Verification (Identity, Industry, Location)
    const verificationRes = verifyCandidateBatch(candidates, job.query);
    const verifiedBusinesses = verificationRes.verifiedBusinesses;

    job.stageStats.identityVerified = verificationRes.stats.verifiedCount;
    job.stageStats.industryVerified = verificationRes.stats.verifiedCount;
    job.stageStats.locationVerified = verificationRes.stats.verifiedCount;
    job.status = "enriching";
    job.currentStage = "website_intelligence";
    job.progress = 50;
    await saveSearchJob(job);

    const processedBusinesses: Business[] = [];

    // Stages 5, 6, 7, 8: Website Intelligence, Decision-Makers, Contacts & Qualification
    for (const biz of verifiedBusinesses) {
      let enrichedBiz = biz;
      let intel = null;
      let enrichResult: Awaited<ReturnType<typeof enrichBusinessFromWebsite>> | null = null;

      // Stage 5: Website Intelligence
      if (biz.website) {
        try {
          enrichResult = await enrichBusinessFromWebsite(biz, {
            fetchSubpages: true,
          });
          enrichedBiz = enrichResult.business;
          intel = enrichResult.intelligence;
          if (intel.reachable) {
            job.stageStats.officialWebsitesFound++;
          }
        } catch {
          // Keep existing verified data if crawl fails
        }
      }

      // Stage 6: Decision-Maker Intelligence
      try {
        const dmResult = await discoverDecisionMakers(enrichedBiz, {
          websiteHtml: enrichResult?.crawledHtml?.homepageHtml,
          subpagesHtml: enrichResult?.crawledHtml?.subpagesHtml,
        });
        enrichedBiz = {
          ...enrichedBiz,
          decisionMakers: dmResult.decisionMakers,
        };
        job.stageStats.decisionMakersFound += dmResult.candidatesEvaluated;
        job.stageStats.decisionMakersVerified += dmResult.decisionMakers.length;
      } catch {
        // Keep biz
      }

      // Stage 7: Contact Verification & Classification
      try {
        const contactResult = await classifyAndVerifyBusinessContacts(enrichedBiz);
        enrichedBiz = contactResult.business;
        job.stageStats.businessContactsFound += enrichedBiz.contacts.length;
      } catch {
        // Keep biz
      }

      // Stage 8: Lead Qualification & Transparent Scoring
      const qualScores = calculateQualificationScores(enrichedBiz, intel, {
        requestedIndustry: job.query.industry,
        requestedCity: job.query.city,
        requestedCountry: job.query.country,
        requestedServiceTrack: job.query.serviceTrack || "creative+technical",
      });

      enrichedBiz = {
        ...enrichedBiz,
        qualificationScore: qualScores.overallScore,
        qualification: qualScores,
        opportunity: qualScores.opportunity || null,
        status: qualScores.status === "qualified" ? "qualified" : qualScores.status === "review" ? "review" : "rejected",
      };

      if (qualScores.isQualified) {
        job.stageStats.qualifiedLeads++;
      } else {
        job.stageStats.rejectedLeads++;
      }

      processedBusinesses.push(enrichedBiz);
    }

    // Rank Qualified Leads by Overall Score
    processedBusinesses.sort((a, b) => b.qualificationScore - a.qualificationScore);

    // Persist discovered and qualified businesses in store
    saveJobBusinesses(job.id, processedBusinesses);

    // Automatically synchronize leads into CRM pipeline with full audit history
    for (const biz of processedBusinesses) {
      createOrUpdateLeadFromBusiness(biz);
    }

    job.status = "completed";
    job.currentStage = "completed";
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    job.leads = processedBusinesses;
    await saveSearchJob(job);

    logger.info("AutoRadar pipeline execution completed", {
      context: "POST /api/search-jobs/[id]/execute",
      searchJobId: job.id,
      data: {
        totalEvaluated: processedBusinesses.length,
        qualifiedCount: job.stageStats.qualifiedLeads,
      },
    });

    return Response.json(
      createSuccessResponse(
        {
          job,
          businesses: processedBusinesses,
          qualifiedCount: job.stageStats.qualifiedLeads,
          reviewCount: processedBusinesses.filter((b) => b.status === "review").length,
          rejectedCount: processedBusinesses.filter((b) => b.status === "rejected").length,
        },
        undefined,
        requestId
      ),
      { status: 200 }
    );
  } catch (error) {
    job.status = "failed";
    job.errorMessage = error instanceof Error ? error.message : String(error);
    await saveSearchJob(job);

    logger.error("AutoRadar pipeline execution failed", {
      context: "POST /api/search-jobs/[id]/execute",
      searchJobId: job.id,
      error,
    });

    return Response.json(
      createErrorResponse("PIPELINE_ERROR", "Pipeline execution failed", String(error), requestId),
      { status: 500 }
    );
  }
}
