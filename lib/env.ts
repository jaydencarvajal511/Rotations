import {
  parseEnv,
  publicEnvSchema,
  supabaseAdminEnvSchema,
  type PublicEnv,
  type SupabaseAdminEnv,
} from "@/lib/schemas/env";

export function getPublicEnv(): PublicEnv {
  // Each NEXT_PUBLIC_* var must be referenced literally so Next.js can inline it
  return parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return parseEnv(supabaseAdminEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
