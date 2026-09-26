import { z } from "zod";

/** Safe to expose to the browser — Next.js inlines NEXT_PUBLIC_* at build time. */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/** Server-only secrets. Never import the result into a client component. */
export const serverEnvSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

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
