import "server-only";

import type { AlbumSummary } from "@/lib/schemas/album";

import { createAdminClient } from "./admin";

/**
 * Caches catalog metadata. Uses the service role because RLS allows no user
 * writes to albums — only call this with data fetched server-side from the
 * catalog, never with client-supplied metadata.
 */
export async function upsertAlbum(album: AlbumSummary): Promise<void> {
  const { error } = await createAdminClient()
    .from("albums")
    .upsert({
      id: album.id,
      name: album.name,
      artist: album.artist,
      cover_url: album.coverUrl,
      release_date: album.releaseDate,
      fetched_at: new Date().toISOString(),
    });
  if (error) throw error;
}
