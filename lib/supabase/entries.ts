import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { entryStatusSchema, type EntryStatus } from "@/lib/schemas/entry";

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
