import { z } from "zod";

import type { AlbumSummary } from "./album";

/** An album ("collection") result from the iTunes Search or Lookup API. */
export const itunesAlbumSchema = z.object({
  wrapperType: z.literal("collection"),
  collectionId: z.number().int().positive(),
  collectionName: z.string().min(1),
  artistName: z.string().min(1),
  artworkUrl100: z.url().optional(),
  releaseDate: z.string().optional(),
  collectionViewUrl: z.url().optional(),
});

/**
 * Items are left unparsed here so one malformed result (or a non-album
 * result, e.g. the artist row a lookup can return) doesn't fail the batch.
 */
export const itunesResponseSchema = z.object({
  resultCount: z.number().int().nonnegative(),
  results: z.array(z.unknown()),
});

export type ItunesAlbum = z.infer<typeof itunesAlbumSchema>;

export function parseItunesAlbums(json: unknown): ItunesAlbum[] {
  const { results } = itunesResponseSchema.parse(json);
  return results.flatMap((item) => {
    const parsed = itunesAlbumSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

const ARTWORK_SIZE = 600;

/** iTunes serves any square size by rewriting the "100x100bb" segment. */
export function upscaleArtwork(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/100x100bb\./, `/${ARTWORK_SIZE}x${ARTWORK_SIZE}bb.`);
}

/** "2006-10-27T07:00:00Z" → "2006-10-27". The date part is the release date as listed. */
export function toReleaseDate(value: string | undefined): string | null {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

export function toAlbumSummary(album: ItunesAlbum): AlbumSummary {
  return {
    id: String(album.collectionId),
    name: album.collectionName,
    artist: album.artistName,
    coverUrl: upscaleArtwork(album.artworkUrl100),
    releaseDate: toReleaseDate(album.releaseDate),
    storeUrl: album.collectionViewUrl ?? null,
  };
}
