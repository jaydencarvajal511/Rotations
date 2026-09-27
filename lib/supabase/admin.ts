import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Service-role client — bypasses RLS. Only for writes RLS intentionally
 * blocks for users (the albums metadata cache). Never use it to read or
 * write user data; use the cookie-based server client for that.
 */
export function createAdminClient() {
  const env = getSupabaseAdminEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
