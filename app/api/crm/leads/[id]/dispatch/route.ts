import { NextRequest } from "next/server";
import { getLeadById } from "../../../../../lib/crm/store.ts";
import { getBusinessById } from "../../../../../lib/jobs/store.ts";
import { dispatchLeadWebhook } from "../../../../../lib/dispatch/webhook-dispatcher.ts";
import { createSuccessResponse, createErrorResponse } from "../../../../../lib/types/api.ts";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const lead = getLeadById(id);

  if (!lead) {
    return Response.json(createErrorResponse("NOT_FOUND", `Lead ${id} not found`), { status: 404 });
  }

  const business = lead.businessId ? getBusinessById(lead.businessId) : null;
  if (!business) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Business record for lead ${id} not found`),
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const event = body.event || "manual.dispatch";

  const result = await dispatchLeadWebhook(lead, business, event, {
    customWebhookUrl: body.customWebhookUrl,
    authHeader: body.authHeader,
  });

  return Response.json(createSuccessResponse(result), { status: 200 });
}
