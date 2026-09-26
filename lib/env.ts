import {
  parseEnv,
  publicEnvSchema,
  serverEnvSchema,
  type PublicEnv,
  type ServerEnv,
} from "@/lib/schemas/env";

export function getPublicEnv(): PublicEnv {
  // Each NEXT_PUBLIC_* var must be referenced literally so Next.js can inline it
  return parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return parseEnv(serverEnvSchema, {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  });
}
