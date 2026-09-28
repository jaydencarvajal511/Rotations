import { z } from "zod";

import type { AlbumSummary } from "@/lib/schemas/album";

/** v1's sort options, minus rating/genre (out of scope). */
export const SORT_KEYS = ["added", "title", "artist", "release"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export const SORT_LABELS: Record<SortKey, string> = {
  added: "Order Made",
  title: "Title",
  artist: "Artist",
  release: "Release Date",
};

/** Dates default to newest first, text to A→Z. */
export const DEFAULT_DIR: Record<SortKey, SortDir> = {
  added: "desc",
  title: "asc",
  artist: "asc",
  release: "desc",
};

export type SortableEntry = {
  id: string;
  addedAt: string;
  listenedAt: string | null;
  album: Pick<AlbumSummary, "name" | "artist" | "releaseDate">;
};

export const listParamsSchema = z.object({
  sort: z.enum(SORT_KEYS).catch("added"),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
  q: z.string().max(100).catch("").default(""),
});

export type ListParams = { sort: SortKey; dir: SortDir; q: string };

/** Parses untrusted URL params; anything invalid falls back to defaults. */
export function parseListParams(params: Record<string, string | string[] | undefined>): ListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const parsed = listParamsSchema.parse({
    sort: first(params.sort),
    dir: first(params.dir),
    q: first(params.q),
  });
  return { sort: parsed.sort, dir: parsed.dir ?? DEFAULT_DIR[parsed.sort], q: parsed.q };
}

/** Tapping the active sort flips direction (like v1); a new sort starts at its default. */
export function nextSort(current: ListParams, key: SortKey): Pick<ListParams, "sort" | "dir"> {
  if (current.sort === key) {
    return { sort: key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { sort: key, dir: DEFAULT_DIR[key] };
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/** "Order Made" means when it entered this list — listened_at for the Listened list. */
function orderMade(entry: SortableEntry): string {
  return entry.listenedAt ?? entry.addedAt;
}

export function sortEntries<T extends SortableEntry>(entries: T[], sort: SortKey, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;

  const compare = (a: T, b: T): number => {
    switch (sort) {
      case "title":
        return sign * collator.compare(a.album.name, b.album.name);
      case "artist":
        return sign * collator.compare(a.album.artist, b.album.artist);
      case "release": {
        // Unknown release dates always sink to the bottom
        if (!a.album.releaseDate || !b.album.releaseDate) {
          return Number(!a.album.releaseDate) - Number(!b.album.releaseDate);
        }
        return sign * a.album.releaseDate.localeCompare(b.album.releaseDate);
      }
      case "added":
        return sign * orderMade(a).localeCompare(orderMade(b));
    }
  };

  // Stable tiebreak so equal keys don't shuffle between renders
  return [...entries].sort(
    (a, b) => compare(a, b) || orderMade(b).localeCompare(orderMade(a)) || a.id.localeCompare(b.id),
  );
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Every word in the query must appear in the title or artist, ignoring case and accents. */
export function filterEntries<T extends SortableEntry>(entries: T[], query: string): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;

  return entries.filter((entry) => {
    const haystack = normalize(`${entry.album.name} ${entry.album.artist}`);
    return words.every((word) => haystack.includes(word));
  });
}
