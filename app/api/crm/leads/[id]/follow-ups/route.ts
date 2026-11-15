import { NextRequest } from "next/server";
import { getLeadById, listFollowUps, scheduleFollowUp, completeFollowUp } from "@/lib/crm/store";
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

  const followUps = listFollowUps(id);
  return Response.json(createSuccessResponse(followUps, undefined, requestId), { status: 200 });
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
    if (!body || !body.reason || !body.dueAt) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Follow-up reason and dueAt are required", undefined, requestId),
        { status: 400 }
      );
    }

    const followUp = scheduleFollowUp(id, body.reason, body.dueAt, body.userId);
    return Response.json(createSuccessResponse(followUp, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("FOLLOW_UP_ERROR", "Failed to schedule follow-up", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    if (!body || !body.id) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Follow-up ID is required", undefined, requestId),
        { status: 400 }
      );
    }

    const followUp = completeFollowUp(body.id, body.userId);
    return Response.json(createSuccessResponse(followUp, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("FOLLOW_UP_ERROR", "Failed to complete follow-up", String(error), requestId),
      { status: 500 }
    );
  }
}
