import { z } from "zod";

import type { AlbumSummary } from "./album";

/** Deezer reports failures as HTTP 200 with an error body. */
export const deezerErrorSchema = z.object({
  error: z.object({
    type: z.string(),
    message: z.string(),
    code: z.number(),
  }),
});

export const DEEZER_ERROR = {
  QUOTA: 4,
  PARAMETER: 500,
  NOT_FOUND: 800,
} as const;

/** Fields shared by search results and the album endpoint. */
export const deezerAlbumSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  link: z.url().optional(),
  cover_xl: z.url().optional(),
  cover_big: z.url().optional(),
  record_type: z.string().optional(),
  artist: z.object({ name: z.string().min(1) }),
  /** Only on GET /album/{id}; search results omit it. */
  release_date: z.string().optional(),
});

/** Items are left unparsed so one malformed result doesn't fail the whole search. */
export const deezerSearchSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
});

export type DeezerAlbum = z.infer<typeof deezerAlbumSchema>;

export function parseDeezerSearch(json: unknown): DeezerAlbum[] {
  const { data } = deezerSearchSchema.parse(json);
  return data.flatMap((item) => {
    const parsed = deezerAlbumSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Deezer uses "0000-00-00" for unknown dates. */
export function toReleaseDate(value: string | undefined): string | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || match[1] === "0000") return null;
  const [, , month, day] = match;
  if (month === "00" || day === "00") return null;
  return value!;
}

export function deezerAlbumUrl(albumId: string): string {
  return `https://www.deezer.com/album/${encodeURIComponent(albumId)}`;
}

export function toAlbumSummary(album: DeezerAlbum): AlbumSummary {
  const id = String(album.id);
  return {
    id,
    name: album.title,
    artist: album.artist.name,
    coverUrl: album.cover_xl ?? album.cover_big ?? null,
    releaseDate: toReleaseDate(album.release_date),
    storeUrl: album.link ?? deezerAlbumUrl(id),
  };
}
