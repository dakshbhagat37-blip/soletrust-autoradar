import { NextRequest } from "next/server";
import {
  getLeadById,
  updateLead,
  updateLeadStage,
  getLeadActivities,
  getLeadOutreach,
  getLeadConversations,
  listFollowUps,
  listTasks,
  listMeetings,
  listDeals,
} from "@/lib/crm/store";
import { getBusinessById } from "@/lib/jobs/store";
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
  const activities = getLeadActivities(id);
  const outreach = getLeadOutreach(id);
  const conversations = getLeadConversations(id);
  const followUps = listFollowUps(id);
  const tasks = listTasks(id);
  const meetings = listMeetings(id);
  const deals = listDeals(id);

  return Response.json(
    createSuccessResponse(
      {
        lead,
        business,
        activities,
        outreach,
        conversations,
        followUps,
        tasks,
        meetings,
        deals,
      },
      undefined,
      requestId
    ),
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    let updated = lead;

    if (body.stage && body.stage !== lead.stage) {
      updated = updateLeadStage(id, body.stage, body.userId, body.lostReason);
    }

    const otherUpdates = { ...body };
    delete otherUpdates.stage;
    delete otherUpdates.userId;
    delete otherUpdates.lostReason;
    if (Object.keys(otherUpdates).length > 0) {
      updated = updateLead(id, otherUpdates, body.userId);
    }

    return Response.json(createSuccessResponse(updated, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("LEAD_UPDATE_ERROR", "Failed to update CRM lead", String(error), requestId),
      { status: 500 }
    );
  }
}
