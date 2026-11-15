import { NextRequest } from "next/server";
import {
  getLeadById,
  getLeadOutreach,
  createOutreachDraft,
  sendOrLogOutreach,
} from "@/lib/crm/store";
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

  const outreach = getLeadOutreach(id);
  return Response.json(createSuccessResponse(outreach, undefined, requestId), { status: 200 });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  try {
    const lead = getLeadById(id);
    if (!lead) {
      return Response.json(
        createErrorResponse("NOT_FOUND", `CRM Lead [${id}] not found`, undefined, requestId),
        { status: 404 }
      );
    }

    const body = await request.json();
    if (!body || !body.channel || !body.body) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Outreach channel and body are required", undefined, requestId),
        { status: 400 }
      );
    }

    // Step 1: Create draft
    const draft = createOutreachDraft(id, {
      channel: body.channel,
      contactId: body.contactId,
      subject: body.subject,
      body: body.body,
      userId: body.userId,
      scheduledAt: body.scheduledAt,
    });

    // Step 2: If action is "send" or "log", immediately dispatch or record
    if (body.action === "send" || body.action === "log") {
      const dispatched = sendOrLogOutreach(draft.id, {
        isManual: body.action === "log",
        provider: body.provider || "Direct Outbound",
        deliveryConfirmed: body.deliveryConfirmed ?? true,
      });
      return Response.json(createSuccessResponse(dispatched, undefined, requestId), { status: 201 });
    }

    return Response.json(createSuccessResponse(draft, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("OUTREACH_ERROR", "Failed to process outreach activity", String(error), requestId),
      { status: 500 }
    );
  }
}

