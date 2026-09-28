import { z } from "zod";

/** Mirrors the listening_entries.status check constraint. */
export const entryStatusSchema = z.enum(["want_to_listen", "listened"]);
export type EntryStatus = z.infer<typeof entryStatusSchema>;

/** Catalog album IDs are numeric strings (iTunes collectionId). */
export const albumIdSchema = z.string().regex(/^\d{1,20}$/, "Invalid album id");
