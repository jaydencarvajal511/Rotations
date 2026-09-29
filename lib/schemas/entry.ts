import { z } from "zod";

/** Mirrors the listening_entries.status check constraint. */
export const entryStatusSchema = z.enum(["want_to_listen", "listened"]);
export type EntryStatus = z.infer<typeof entryStatusSchema>;

/** Catalog album IDs are numeric strings (Deezer album id). */
export const albumIdSchema = z.string().regex(/^\d{1,20}$/, "Invalid album id");

export const entryIdSchema = z.uuid();

/** A listening_entries row joined with its album, as returned by the list query. */
export const listEntryRowSchema = z.object({
  id: z.uuid(),
  status: entryStatusSchema,
  added_at: z.string(),
  listened_at: z.string().nullable(),
  albums: z.object({
    id: z.string(),
    name: z.string(),
    artist: z.string(),
    cover_url: z.string().nullable(),
    release_date: z.string().nullable(),
  }),
});
