import "server-only";

import type { AlbumSummary } from "@/lib/schemas/album";
import {
  DEEZER_ERROR,
  deezerAlbumSchema,
  deezerErrorSchema,
  parseDeezerSearch,
  toAlbumSummary,
} from "@/lib/schemas/deezer";

const BASE_URL = "https://api.deezer.com";
// Metadata rarely changes; caching also keeps us well under Deezer's rate limit
const REVALIDATE_SECONDS = 60 * 60 * 24;
export const SEARCH_LIMIT = 20;
export const MAX_TERM_LENGTH = 100;

export class CatalogError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "CatalogError";
  }
}

async function request(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new CatalogError(`Deezer ${path} failed with HTTP ${res.status}`, res.status);
  }
  return res.json();
}

/** Returns the Deezer error code if the body is an error payload. */
function errorCode(json: unknown): number | null {
  const parsed = deezerErrorSchema.safeParse(json);
  return parsed.success ? parsed.data.error.code : null;
}

export async function searchAlbums(term: string): Promise<AlbumSummary[]> {
  const query = term.trim().slice(0, MAX_TERM_LENGTH);
  if (!query) return [];

  const json = await request("/search/album", { q: query, limit: String(SEARCH_LIMIT) });
  const code = errorCode(json);
  if (code !== null) throw new CatalogError(`Deezer search failed with code ${code}`, code);

  return parseDeezerSearch(json).map(toAlbumSummary);
}

/** Full album details (including release date). Returns null unless `id` is a catalog album. */
export async function lookupAlbum(id: string): Promise<AlbumSummary | null> {
  if (!/^\d{1,20}$/.test(id)) return null;

  const json = await request(`/album/${id}`);
  const code = errorCode(json);
  if (code === DEEZER_ERROR.NOT_FOUND) return null;
  if (code !== null) throw new CatalogError(`Deezer album lookup failed with code ${code}`, code);

  const album = deezerAlbumSchema.parse(json);
  return String(album.id) === id ? toAlbumSummary(album) : null;
}
