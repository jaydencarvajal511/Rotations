import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { test as base, expect } from "@playwright/test";

import type { Database } from "../../lib/supabase/database.types";

/** Signed-in specs only run via `npm run test:e2e:local`, never against the hosted project. */
const enabled = process.env.E2E_LOCAL_SUPABASE === "1";

type Album = { id: string; name: string; artist: string; release_date: string | null };

type Fixtures = {
  admin: SupabaseClient<Database>;
  user: { id: string };
  /** Inserts albums and entries for the signed-in user, oldest first. */
  seed: (items: (Album & { status: "want_to_listen" | "listened" })[]) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  admin: async ({}, provide) => {
    await provide(
      createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      }),
    );
  },

  user: async ({ admin, context, baseURL }, provide, testInfo) => {
    const email = `e2e-${testInfo.testId}-${Date.now()}@example.com`;
    const password = "e2e-password-123";
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;

    // Sign in with the same cookie format the app reads
    const jar = new Map<string, string>();
    const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
      },
    });
    const signIn = await ssr.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: baseURL! })));

    await provide({ id: data.user.id });
    await admin.auth.admin.deleteUser(data.user.id);
  },

  seed: async ({ admin, user }, provide) => {
    await provide(async (items) => {
      const { error: albumError } = await admin
        .from("albums")
        .upsert(items.map(({ id, name, artist, release_date }) => ({ id, name, artist, release_date })));
      if (albumError) throw albumError;

      const start = Date.parse("2026-01-01T00:00:00Z");
      const { error } = await admin.from("listening_entries").insert(
        items.map((item, i) => {
          const at = new Date(start + i * 86_400_000).toISOString();
          return {
            user_id: user.id,
            album_id: item.id,
            status: item.status,
            added_at: at,
            listened_at: item.status === "listened" ? at : null,
          };
        }),
      );
      if (error) throw error;
    });
  },
});

test.skip(!enabled, "Signed-in specs run via npm run test:e2e:local");

export { expect };
