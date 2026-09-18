import { getDiscoveryProvider, runDiscovery } from "@/lib/discovery";
import { DatabaseError, saveDiscoveredCompanies } from "@/lib/leads/save";
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

  const query = parsed.data;
  let discovered;

  try {
    discovered = await runDiscovery(query, getDiscoveryProvider("mock"));
  } catch {
    return errorResponse(502, "Discovery provider error");
  }

  try {
    const saved = await saveDiscoveredCompanies(discovered.companies, {
      requestedServiceTrack: query.serviceTrack,
      requestedIndustry: query.industry,
    });

    return Response.json({
      success: true,
      provider: discovered.provider,
      discovered: discovered.total,
      inserted: saved.inserted.length,
      duplicates: saved.duplicates.length,
      leads: saved.leads,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(500, "Database error");
    }
    return errorResponse(500, "Unexpected error");
  }
}
