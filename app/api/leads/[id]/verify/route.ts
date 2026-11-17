import { evaluateBusinessVerification } from "../../../../../lib/verification/gatekeeper.ts";
import { getBusinessById, saveBusiness } from "../../../../../lib/jobs/store.ts";
import { createSuccessResponse, createErrorResponse } from "../../../../../lib/types/api.ts";
import type { CandidateRecord } from "../../../../../lib/providers/types.ts";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  let body: {
    candidate?: CandidateRecord;
    industry?: string;
    city?: string;
    country?: string;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  let candidate = body.candidate;
  const existingBiz = id ? getBusinessById(id) : null;

  if (!candidate && existingBiz) {
    candidate = {
      companyName: existingBiz.canonicalName || existingBiz.rawName || "Unknown",
      website: existingBiz.website,
      domain: existingBiz.domain,
      phone: existingBiz.contacts?.find((c) => c.contactType === "phone")?.value || null,
      address: existingBiz.address || null,
      city: existingBiz.city || body.city || "Global City",
      country: existingBiz.country || body.country || "Global Region",
      industry: existingBiz.industry || body.industry || "Dermatology",
      source: "reverify",
      sourceUrl: existingBiz.website,
      provider: "internal",
      confidence: "high",
      rawMetadata: existingBiz.rawMetadata,
    };
  }

  if (!candidate) {
    return Response.json(
      createErrorResponse("VALIDATION_ERROR", "Candidate data or valid existing lead ID is required for verification", undefined, requestId),
      { status: 400 },
    );
  }

  const query = {
    industry: body.industry || candidate.industry || "General",
    city: body.city || candidate.city || "General",
    country: body.country || candidate.country || "General",
    limit: 1,
  };

  const evaluation = evaluateBusinessVerification(candidate, query);

  if (existingBiz) {
    existingBiz.identityStatus = evaluation.identity.status;
    existingBiz.identityScore = evaluation.identity.score;
    existingBiz.updatedAt = new Date().toISOString();
    saveBusiness(existingBiz);
  }

  return Response.json(
    createSuccessResponse(
      {
        leadId: id,
        isVerified: evaluation.isVerified,
        status: evaluation.identity.status,
        score: evaluation.identity.score,
        identity: evaluation.identity,
        industry: evaluation.industry,
        location: evaluation.location,
        rejectionReasons: evaluation.rejectionReasons,
        business: evaluation.business,
      },
      undefined,
      requestId,
    ),
    { status: 200 },
  );
}
