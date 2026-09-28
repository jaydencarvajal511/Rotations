"use client";

import { ArrowDown, ArrowUp, Funnel, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { AlbumRow } from "@/components/albums/album-row";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  filterEntries,
  nextSort,
  SORT_KEYS,
  SORT_LABELS,
  sortEntries,
  type ListParams,
  type SortKey,
} from "@/lib/lists/sort";
import type { EntryStatus } from "@/lib/schemas/entry";
import type { ListEntry } from "@/lib/supabase/entries";
import { cn } from "@/lib/utils";

import { EntryDetail } from "./entry-detail";

type Props = {
  title: string;
  status: EntryStatus;
  entries: ListEntry[];
  initialParams: ListParams;
};

export function ListView({ title, status, entries, initialParams }: Props) {
  const pathname = usePathname();
  const [params, setParams] = useState(initialParams);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () => sortEntries(filterEntries(entries, params.q), params.sort, params.dir),
    [entries, params],
  );
  // Look up by id so the dialog closes itself once the entry leaves this list
  const selected = entries.find((e) => e.id === selectedId) ?? null;

  function update(next: Partial<ListParams>) {
    const merged = { ...params, ...next };
    setParams(merged);
    // Keep sort/filter in the URL without a server round trip
    const search = new URLSearchParams({ sort: merged.sort, dir: merged.dir });
    if (merged.q) search.set("q", merged.q);
    window.history.replaceState(null, "", `${pathname}?${search}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {title} <span className="text-muted-foreground">({entries.length})</span>
        </h1>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            aria-expanded={sortOpen}
            aria-controls="sort-menu"
            aria-label="Sort"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), sortOpen && "bg-accent")}
          >
            <Funnel aria-hidden className="size-5" />
          </button>
        ) : null}
      </header>

      {sortOpen && entries.length > 0 ? (
        <div id="sort-menu" role="group" aria-label="Sort by" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SORT_KEYS.map((key) => (
            <SortButton key={key} sortKey={key} params={params} onSelect={() => update(nextSort(params, key))} />
          ))}
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={`Filter ${title}`}
            placeholder="Filter by title or artist"
            value={params.q}
            maxLength={100}
            onChange={(e) => update({ q: e.target.value })}
            className="h-11 pl-9 text-base"
          />
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyList status={status} />
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No albums match “{params.q}”.</p>
      ) : (
        <ul aria-label={title} className="grid gap-3 sm:grid-cols-3">
          {visible.map((entry) => (
            <li key={entry.id}>
              <AlbumRow album={entry.album} onSelect={() => setSelectedId(entry.id)} responsiveGrid />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        {selected ? <EntryDetail key={selected.id} entry={selected} /> : null}
      </Dialog>
    </main>
  );
}

function SortButton({ sortKey, params, onSelect }: { sortKey: SortKey; params: ListParams; onSelect: () => void }) {
  const active = params.sort === sortKey;
  const Arrow = params.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline" }),
        "justify-center",
      )}
    >
      {SORT_LABELS[sortKey]}
      {active ? (
        <>
          <Arrow aria-hidden />
          <span className="sr-only">{params.dir === "asc" ? "ascending" : "descending"}</span>
        </>
      ) : null}
    </button>
  );
}

function EmptyList({ status }: { status: EntryStatus }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
      {status === "want_to_listen" ? (
        <>
          <p>Nothing queued up yet.</p>
          <Link href="/search" className={buttonVariants()}>
            <Search aria-hidden />
            Search for albums
          </Link>
        </>
      ) : (
        <p>No albums listened to yet. Mark one as listened from Want to Listen.</p>
      )}
    </div>
  );
}
