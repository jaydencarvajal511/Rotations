import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Rotations</h1>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
          <LogOut aria-hidden />
        </Button>
      </form>
    </main>
  );
}
