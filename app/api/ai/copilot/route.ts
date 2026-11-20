import { NextRequest } from "next/server";
import {
  queryExecutiveCopilot,
  checkAutonomousBusinessTriggers,
} from "@/lib/ai/executive-copilot";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET() {
  const alerts = checkAutonomousBusinessTriggers();
  return Response.json(createSuccessResponse({ alerts }), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || "";

    if (!query.trim()) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "query string is required"),
        { status: 400 }
      );
    }

    const result = await queryExecutiveCopilot(query);
    const alerts = checkAutonomousBusinessTriggers();

    return Response.json(createSuccessResponse({ result, alerts }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Copilot query failed";
    return Response.json(createErrorResponse("COPILOT_FAILED", message), { status: 500 });
  }
}
