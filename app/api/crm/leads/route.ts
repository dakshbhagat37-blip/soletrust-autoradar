import { NextRequest } from "next/server";
import { listLeads, createOrUpdateLeadFromBusiness } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";
import type { LeadStage, LeadPriority } from "@/lib/types/lead";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const stage = (searchParams.get("stage") as LeadStage | "all") || "all";
    const priority = (searchParams.get("priority") as LeadPriority | "all") || "all";
    const search = searchParams.get("search") || undefined;
    const assignedTo = searchParams.get("assignedTo") || undefined;

    const leads = listLeads({ stage, priority, search, assignedTo });

    return Response.json(createSuccessResponse(leads, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("LEAD_LIST_ERROR", "Failed to retrieve CRM leads", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.canonicalName) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Lead company name is required", undefined, requestId),
        { status: 400 }
      );
    }

    const business = {
      id: body.id || crypto.randomUUID(),
      canonicalName: body.canonicalName,
      website: body.website || null,
      domain: body.domain || null,
      industry: body.industry || "General B2B",
      city: body.city || "Vadodara",
      country: body.country || "India",
      identityStatus: "verified" as const,
      identityScore: 80,
      qualificationScore: body.qualificationScore || 70,
      status: "qualified" as const,
      serviceTrack: body.serviceTrack || "creative+technical",
      sources: [],
      contacts: [],
      decisionMakers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const lead = createOrUpdateLeadFromBusiness(business);
    return Response.json(createSuccessResponse(lead, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("LEAD_CREATE_ERROR", "Failed to create CRM lead", String(error), requestId),
      { status: 500 }
    );
  }
}

