import { LogOut, Search } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Rotations</h1>
      <Link href="/search" className={buttonVariants({ size: "lg" })}>
        <Search aria-hidden />
        Search albums
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
          <LogOut aria-hidden />
        </Button>
      </form>
    </main>
  );
}
