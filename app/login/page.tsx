import { LogIn, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Rotations</h1>
        <p className="text-muted-foreground">Build out your music rotation.</p>
      </div>

      <RefreshCw aria-hidden className="size-24 text-muted-foreground/40" />

      <form action={signInWithGoogle} className="flex w-full max-w-xs flex-col gap-3">
        <input type="hidden" name="next" value={nextPath} />
        <Button type="submit" size="lg" className="w-full">
          Sign in with Google
          <LogIn aria-hidden />
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            Sign-in didn&apos;t work. Please try again.
          </p>
        ) : null}
      </form>
    </main>
  );
}
