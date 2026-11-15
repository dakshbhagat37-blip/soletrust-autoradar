import { waterfall } from "../../../../lib/providers/waterfall.ts";
import { createSuccessResponse } from "../../../../lib/types/api.ts";

export async function GET() {
  const providers = waterfall.listProviders();
  const checks = await Promise.allSettled(providers.map((p) => p.checkHealth()));

  const results = checks.map((res, idx) => {
    const provider = providers[idx]!;
    if (res.status === "fulfilled") {
      return res.value;
    }
    return {
      providerId: provider.id,
      providerName: provider.name,
      status: "unreachable" as const,
      latencyMs: 0,
      message: res.reason instanceof Error ? res.reason.message : String(res.reason),
      checkedAt: new Date().toISOString(),
    };
  });

  const allHealthy = results.every((r) => r.status === "healthy");
  const anyReachable = results.some((r) => r.status === "healthy" || r.status === "degraded");

  return Response.json(
    createSuccessResponse(
      {
        overallStatus: allHealthy ? "healthy" : anyReachable ? "degraded" : "unhealthy",
        providers: results,
      },
      { total: results.length },
    ),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

