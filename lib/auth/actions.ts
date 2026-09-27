"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LOGIN_PATH, safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  // Server actions are POSTs, so the browser always sends Origin
  const origin = (await headers()).get("origin");
  if (!origin) {
    redirect(`${LOGIN_PATH}?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`${LOGIN_PATH}?error=auth`);
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
