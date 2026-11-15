import { isSupabaseConfigured } from "../../../lib/supabase/client.ts";
import { isSupabaseServerConfigured } from "../../../lib/supabase/server.ts";

export async function GET() {
  const startTime = Date.now();
  const searxngUrl = process.env.SEARXNG_URL?.trim() || "http://localhost:8080";

  let searxngReachable = false;
  let searxngLatencyMs: number | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const pingStart = Date.now();
    const res = await fetch(`${searxngUrl}/healthz`, {
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);

    if (res && res.status < 500) {
      searxngReachable = true;
      searxngLatencyMs = Date.now() - pingStart;
    }
  } catch {
    searxngReachable = false;
  }

  const supabaseClientReady = isSupabaseConfigured();
  const supabaseServerReady = isSupabaseServerConfigured();

  const healthData = {
    status: "ok",
    version: "0.2.0",
    service: "SoleTrust AutoRadar Intelligence Core",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    configuration: {
      supabaseClientReady,
      supabaseServerReady,
      searxngUrl,
      searxngReachable,
      searxngLatencyMs,
      nodeEnv: process.env.NODE_ENV || "development",
    },
    checks: {
      database: supabaseServerReady ? "configured" : "fallback_mode",
      metaSearch: searxngReachable ? "online" : "offline_or_fallback",
    },
    latencyMs: Date.now() - startTime,
  };

  return Response.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

