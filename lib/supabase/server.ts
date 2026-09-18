import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

/**
 * Server-only client for lead writes. The publishable key cannot insert into
 * `leads` under current RLS, so this requires SUPABASE_SERVICE_ROLE_KEY.
 * Never expose that key with a NEXT_PUBLIC_ prefix.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL?.trim() || requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
