import { NextRequest } from "next/server";
import { getStudioSettings, updateStudioSettings } from "@/lib/dispatch/settings-store";
import { testWebhookEndpoint } from "@/lib/dispatch/webhook-dispatcher";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET() {
  const settings = getStudioSettings();
  return Response.json(createSuccessResponse(settings), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "test_webhook") {
      const pingRes = await testWebhookEndpoint(body.webhookUrl, body.webhookAuthHeader);
      return Response.json(createSuccessResponse(pingRes), { status: 200 });
    }

    const updated = updateStudioSettings(body);
    return Response.json(createSuccessResponse(updated), { status: 200 });
  } catch (err) {
    return Response.json(
      createErrorResponse("BAD_REQUEST", (err as Error).message),
      { status: 400 }
    );
  }
}
