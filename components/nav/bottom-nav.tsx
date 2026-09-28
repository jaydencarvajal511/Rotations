"use client";

import { Disc3, FolderOpen, LogOut, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/listened", label: "Listened", icon: Disc3 },
  { href: "/want-to-listen", label: "Want to Listen", icon: FolderOpen },
  { href: "/search", label: "Search", icon: Search },
];

const itemClass =
  "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg";

/** v1's bottom bar: Listened, Want to Listen, Search, Sign out. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl px-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(itemClass, active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Icon aria-hidden className={cn("size-6", active && "stroke-[2.5]")} />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <form action={signOut} className="flex flex-1">
            <button type="submit" className={cn(itemClass, "text-muted-foreground hover:text-foreground")}>
              <LogOut aria-hidden className="size-6" />
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
