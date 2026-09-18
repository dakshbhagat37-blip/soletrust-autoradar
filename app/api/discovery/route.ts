import { getDiscoveryProvider, runDiscovery } from "@/lib/discovery";
import { z } from "zod";

const discoveryRequestSchema = z.object({
  keyword: z.string().trim().min(1),
  city: z.string().trim().min(1),
  country: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  serviceTrack: z.string().trim().min(1),
  limit: z.number().int().min(1).max(50).default(10),
});

function errorResponse(status: number, error: string, details?: unknown) {
  return Response.json(
    details === undefined ? { success: false, error } : { success: false, error, details },
    { status },
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  const parsed = discoveryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Invalid discovery request", parsed.error.flatten());
  }

  try {
    const result = await runDiscovery(parsed.data, getDiscoveryProvider("mock"));

    return Response.json({
      success: true,
      provider: result.provider,
      total: result.total,
      companies: result.companies,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    return errorResponse(500, message);
  }
}
