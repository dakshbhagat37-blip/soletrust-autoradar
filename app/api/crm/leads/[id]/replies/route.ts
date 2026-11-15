import { NextRequest } from "next/server";
import { getLeadById, recordIncomingReply } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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
    if (!body || !body.body || !body.channel) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Reply body and channel are required", undefined, requestId),
        { status: 400 }
      );
    }

    const result = recordIncomingReply(id, {
      channel: body.channel,
      body: body.body,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      classification: body.classification || "positive",
      isManual: body.isManual ?? true,
      providerMessageId: body.providerMessageId,
    });

    return Response.json(createSuccessResponse(result, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("REPLY_RECORD_ERROR", "Failed to record reply", String(error), requestId),
      { status: 500 }
    );
  }
}

