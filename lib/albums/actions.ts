"use server";

import { revalidatePath } from "next/cache";

import { CatalogError, lookupAlbum } from "@/lib/catalog";
import type { AlbumSummary } from "@/lib/schemas/album";
import { albumIdSchema } from "@/lib/schemas/entry";
import { upsertAlbum } from "@/lib/supabase/albums";
import { addWantToListen, getEntryStatuses } from "@/lib/supabase/entries";
import { createClient } from "@/lib/supabase/server";

export type SaveAlbumResult =
  | { status: "added" }
  | { status: "already_saved" }
  | { status: "error"; message: string };

/**
 * Adds an album to the user's Want to Listen list. Takes only the album id:
 * metadata is re-fetched from the catalog so users can't write arbitrary
 * data into the shared albums cache.
 */
export async function saveToWantToListen(albumId: unknown): Promise<SaveAlbumResult> {
  const parsedId = albumIdSchema.safeParse(albumId);
  if (!parsedId.success) {
    return { status: "error", message: "That album couldn't be found." };
  }
  const id = parsedId.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) {
    return { status: "error", message: "Please sign in again." };
  }

  const existing = await getEntryStatuses(supabase, [id]);
  if (existing[id]) return { status: "already_saved" };

  let album;
  try {
    album = await lookupAlbum(id);
  } catch (error) {
    if (error instanceof CatalogError) {
      return { status: "error", message: "Album search is unavailable right now. Try again in a minute." };
    }
    throw error;
  }
  if (!album) {
    return { status: "error", message: "That album couldn't be found." };
  }

  await upsertAlbum(album);
  const result = await addWantToListen(supabase, userId, id);

  revalidatePath("/");
  return result.status === "added" ? { status: "added" } : { status: "already_saved" };
}

/**
 * Full catalog details for the search detail view. Search results omit the
 * release date, so the dialog fetches this on open. Responses are cached.
 */
export async function getAlbumDetails(albumId: unknown): Promise<AlbumSummary | null> {
  const parsedId = albumIdSchema.safeParse(albumId);
  if (!parsedId.success) return null;
  try {
    return await lookupAlbum(parsedId.data);
  } catch (error) {
    if (error instanceof CatalogError) return null;
    throw error;
  }
}
