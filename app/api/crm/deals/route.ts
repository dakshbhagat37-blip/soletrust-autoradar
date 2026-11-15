import { NextRequest } from "next/server";
import { listDeals, createDeal, updateDealStage } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId") || undefined;
    const deals = listDeals(leadId);
    return Response.json(createSuccessResponse(deals, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("DEAL_LIST_ERROR", "Failed to retrieve deals", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.leadId || !body.title || body.amount === undefined) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Lead ID, deal title, and amount are required", undefined, requestId),
        { status: 400 }
      );
    }

    const deal = createDeal({
      leadId: body.leadId,
      title: body.title,
      amount: Number(body.amount),
      currency: body.currency || "INR",
      stage: body.stage || "proposal",
      serviceOffered: body.serviceOffered,
      probability: body.probability,
      expectedCloseDate: body.expectedCloseDate,
    });

    return Response.json(createSuccessResponse(deal, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("DEAL_CREATE_ERROR", "Failed to create deal", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.id || !body.stage) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Deal ID and stage are required", undefined, requestId),
        { status: 400 }
      );
    }

    const result = updateDealStage(body.id, body.stage, { lostReason: body.lostReason });
    return Response.json(createSuccessResponse(result, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("DEAL_UPDATE_ERROR", "Failed to update deal", String(error), requestId),
      { status: 500 }
    );
  }
}

