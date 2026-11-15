import { calculateCrmDashboardMetrics } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const metrics = calculateCrmDashboardMetrics();
    return Response.json(createSuccessResponse(metrics, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("ANALYTICS_ERROR", "Failed to calculate analytics metrics", String(error), requestId),
      { status: 500 }
    );
  }
}
