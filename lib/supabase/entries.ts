import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { catalogAlbumUrl } from "@/lib/catalog/links";
import type { AlbumSummary } from "@/lib/schemas/album";
import { entryStatusSchema, listEntryRowSchema, type EntryStatus } from "@/lib/schemas/entry";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";

/** Which of `albumIds` the signed-in user already has, and in which list. RLS scopes to the user. */
export async function getEntryStatuses(
  supabase: Client,
  albumIds: string[],
): Promise<Record<string, EntryStatus>> {
  if (albumIds.length === 0) return {};

  const { data, error } = await supabase
    .from("listening_entries")
    .select("album_id, status")
    .in("album_id", albumIds);
  if (error) throw error;

  return Object.fromEntries(
    data.map((row) => [row.album_id, entryStatusSchema.parse(row.status)]),
  );
}

export type AddEntryResult = { status: "added" } | { status: "exists" };

export async function addWantToListen(
  supabase: Client,
  userId: string,
  albumId: string,
): Promise<AddEntryResult> {
  const { error } = await supabase
    .from("listening_entries")
    .insert({ user_id: userId, album_id: albumId, status: "want_to_listen" });

  if (error?.code === UNIQUE_VIOLATION) return { status: "exists" };
  if (error) throw error;
  return { status: "added" };
}

export type ListEntry = {
  id: string;
  status: EntryStatus;
  addedAt: string;
  listenedAt: string | null;
  album: AlbumSummary;
};

/** All of the signed-in user's entries in one list, with album metadata. RLS scopes to the user. */
export async function listEntries(supabase: Client, status: EntryStatus): Promise<ListEntry[]> {
  const { data, error } = await supabase
    .from("listening_entries")
    .select("id, status, added_at, listened_at, albums (id, name, artist, cover_url, release_date)")
    .eq("status", status)
    .order("added_at", { ascending: false });
  if (error) throw error;

  return listEntryRowSchema.array().parse(data).map((row) => ({
    id: row.id,
    status: row.status,
    addedAt: row.added_at,
    listenedAt: row.listened_at,
    album: {
      id: row.albums.id,
      name: row.albums.name,
      artist: row.albums.artist,
      coverUrl: row.albums.cover_url,
      releaseDate: row.albums.release_date,
      storeUrl: catalogAlbumUrl(row.albums.id),
    },
  }));
}

/** Returns false if no matching want_to_listen entry exists for this user. */
export async function markListened(supabase: Client, entryId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("listening_entries")
    .update({ status: "listened", listened_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("status", "want_to_listen")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

/** Returns false if the entry doesn't exist (or isn't this user's — RLS hides it). */
export async function removeEntry(supabase: Client, entryId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("listening_entries")
    .delete()
    .eq("id", entryId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
