import { waterfall } from "../../../lib/providers/waterfall.ts";
import { createSuccessResponse } from "../../../lib/types/api.ts";

export async function GET() {
  const providers = waterfall.listProviders().map((p) => ({
    id: p.id,
    name: p.name,
    priority: p.priority,
    isEnabled: p.isEnabled,
  }));

  return Response.json(createSuccessResponse(providers, { total: providers.length }));
}

