import { NextRequest } from "next/server";
import { updateDeliverableStatus } from "@/features/operations/project-spawner";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, deliverableId, status, approvedBy, feedback } = body;

    if (!projectId || !deliverableId || !status) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "projectId, deliverableId, and status are required"),
        { status: 400 }
      );
    }

    const deliverable = updateDeliverableStatus(projectId, deliverableId, status, {
      approvedBy,
      feedback,
    });

    return Response.json(createSuccessResponse(deliverable), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update deliverable";
    return Response.json(createErrorResponse("UPDATE_FAILED", message), { status: 500 });
  }
}
