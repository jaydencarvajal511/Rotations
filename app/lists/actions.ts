"use server";

import { revalidatePath } from "next/cache";

import { entryIdSchema } from "@/lib/schemas/entry";
import { markListened, removeEntry } from "@/lib/supabase/entries";
import { createClient } from "@/lib/supabase/server";

export type EntryActionResult = { status: "ok" } | { status: "error"; message: string };

const NOT_FOUND = "That album isn't in your lists anymore.";

function revalidateLists() {
  revalidatePath("/want-to-listen");
  revalidatePath("/listened");
}

export async function markAsListened(entryId: unknown): Promise<EntryActionResult> {
  const id = entryIdSchema.safeParse(entryId);
  if (!id.success) return { status: "error", message: NOT_FOUND };

  const updated = await markListened(await createClient(), id.data);
  if (!updated) return { status: "error", message: NOT_FOUND };

  revalidateLists();
  return { status: "ok" };
}

export async function removeFromList(entryId: unknown): Promise<EntryActionResult> {
  const id = entryIdSchema.safeParse(entryId);
  if (!id.success) return { status: "error", message: NOT_FOUND };

  const removed = await removeEntry(await createClient(), id.data);
  if (!removed) return { status: "error", message: NOT_FOUND };

  revalidateLists();
  return { status: "ok" };
}
