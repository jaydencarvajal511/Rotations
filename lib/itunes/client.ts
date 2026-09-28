import "server-only";

import type { AlbumSummary } from "@/lib/schemas/album";
import { parseItunesAlbums, toAlbumSummary } from "@/lib/schemas/itunes";

const BASE_URL = "https://itunes.apple.com";
// Apple rate-limits to ~20 calls/min and sends max-age=86400; cache for a day
const REVALIDATE_SECONDS = 60 * 60 * 24;
export const SEARCH_LIMIT = 20;
export const MAX_TERM_LENGTH = 100;

export class ItunesError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ItunesError";
  }
}

async function request(path: string, params: Record<string, string>) {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new ItunesError(`iTunes ${path} failed with ${res.status}`, res.status);
  }
  return parseItunesAlbums(await res.json());
}

export async function searchAlbums(term: string): Promise<AlbumSummary[]> {
  const query = term.trim().slice(0, MAX_TERM_LENGTH);
  if (!query) return [];

  const albums = await request("/search", {
    term: query,
    media: "music",
    entity: "album",
    limit: String(SEARCH_LIMIT),
  });
  return albums.map(toAlbumSummary);
}

/** Returns null unless `id` is an album in the catalog. */
export async function lookupAlbum(id: string): Promise<AlbumSummary | null> {
  if (!/^\d{1,20}$/.test(id)) return null;

  const albums = await request("/lookup", { id, entity: "album" });
  const album = albums.find((a) => String(a.collectionId) === id);
  return album ? toAlbumSummary(album) : null;
}
