import { z } from "zod";

/** Safe to expose to the browser — Next.js inlines NEXT_PUBLIC_* at build time. */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/** Server-only: Spotify catalog search credentials. */
export const spotifyEnvSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
});

/** Server-only: bypasses RLS. Used solely for upserting cached album metadata. */
export const supabaseAdminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type SpotifyEnv = z.infer<typeof spotifyEnvSchema>;
export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

export function parseEnv<T extends z.ZodType>(
  schema: T,
  input: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
