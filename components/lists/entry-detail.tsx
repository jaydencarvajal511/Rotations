"use client";

import { Disc3, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { AlbumDetailHeader, StoreLink } from "@/components/albums/album-detail-header";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { markAsListened, removeFromList, type EntryActionResult } from "@/lib/lists/actions";
import type { ListEntry } from "@/lib/supabase/entries";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/**
 * v1's "more info" view. On success the server revalidates the list, the
 * entry leaves it, and the parent closes this dialog.
 */
export function EntryDetail({ entry }: { entry: ListEntry }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: string) => Promise<EntryActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action(entry.id);
      if (result.status === "error") setError(result.message);
    });
  }

  return (
    <DialogContent className="gap-5">
      <AlbumDetailHeader album={entry.album} />

      <div className="flex flex-col items-center gap-3">
        {entry.listenedAt ? (
          <p className="text-sm text-muted-foreground">
            Listened {dateFormat.format(new Date(entry.listenedAt))}
          </p>
        ) : null}

        {entry.status === "want_to_listen" ? (
          <Button onClick={() => run(markAsListened)} disabled={pending} size="lg" className="w-full">
            <Disc3 aria-hidden />
            Mark as listened
          </Button>
        ) : null}

        <Button
          onClick={() => run(removeFromList)}
          disabled={pending}
          variant="outline"
          size="lg"
          className="w-full text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden />
          Remove
        </Button>

        {error ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <StoreLink url={entry.album.storeUrl} />
      </div>
    </DialogContent>
  );
}
