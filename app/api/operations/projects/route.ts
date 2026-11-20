import { NextRequest } from "next/server";
import { dbStore } from "@/server/db/store";
import { spawnProjectFromDeal } from "@/features/operations/project-spawner";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET() {
  const projects = dbStore.listProjects();
  return Response.json(createSuccessResponse(projects), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.dealId || !body.contract) {
      return Response.json(createErrorResponse("INVALID_INPUT", "dealId and contract details are required"), { status: 400 });
    }

    const project = spawnProjectFromDeal({
      dealId: body.dealId,
      contract: body.contract,
      currency: body.currency,
      assignedTeam: body.assignedTeam,
      startDate: body.startDate,
    });

    return Response.json(createSuccessResponse(project), { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to spawn project";
    return Response.json(createErrorResponse("SPAWN_FAILED", message), { status: 500 });
  }
}
