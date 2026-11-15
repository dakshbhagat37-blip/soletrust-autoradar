import { NextRequest } from "next/server";
import { getLeadById } from "@/lib/crm/store";
import { getBusinessById } from "@/lib/jobs/store";
import { generateAiSalesStrategy } from "@/lib/crm/ai-strategy";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  const lead = getLeadById(id);
  if (!lead) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `CRM Lead [${id}] not found`, undefined, requestId),
      { status: 404 }
    );
  }

  const business = lead.businessId ? getBusinessById(lead.businessId) : null;
  if (!business) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Associated business for lead [${id}] not found`, undefined, requestId),
      { status: 404 }
    );
  }

  const strategy = generateAiSalesStrategy(business, lead);

  return Response.json(createSuccessResponse(strategy, undefined, requestId), { status: 200 });
}

