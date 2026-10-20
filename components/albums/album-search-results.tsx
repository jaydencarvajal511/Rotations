"use client";

import { Check, FolderPlus, Headphones } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { getAlbumDetails, saveAlbum, type SaveAlbumResult } from "@/lib/albums/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AlbumSummary } from "@/lib/schemas/album";
import type { EntryStatus } from "@/lib/schemas/entry";

import { AlbumDetailHeader, StoreLink } from "./album-detail-header";
import { AlbumRow } from "./album-row";

type Props = {
  albums: AlbumSummary[];
  initialStatuses: Record<string, EntryStatus>;
};

export function AlbumSearchResults({ albums, initialStatuses }: Props) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [selected, setSelected] = useState<AlbumSummary | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-3" aria-label="Search results">
        {albums.map((album) => (
          <li key={album.id}>
            <AlbumRow album={album} onSelect={() => setSelected(album)} />
          </li>
        ))}
      </ul>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected ? (
          <AlbumDetail
            key={selected.id}
            album={selected}
            status={statuses[selected.id]}
            onSaved={(list) => setStatuses((s) => ({ ...s, [selected.id]: list }))}
          />
        ) : null}
      </Dialog>
    </>
  );
}

function AlbumDetail({
  album,
  status,
  onSaved,
}: {
  album: AlbumSummary;
  status: EntryStatus | undefined;
  onSaved: (list: EntryStatus) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveAlbumResult | null>(null);
  const [savingTo, setSavingTo] = useState<EntryStatus | null>(null);
  const [releaseDate, setReleaseDate] = useState(album.releaseDate);
  const inRotation = status !== undefined;

  // Search results don't include release dates; fetch them for the header
  useEffect(() => {
    if (album.releaseDate) return;
    let cancelled = false;
    getAlbumDetails(album.id).then((details) => {
      if (!cancelled && details?.releaseDate) setReleaseDate(details.releaseDate);
    });
    return () => {
      cancelled = true;
    };
  }, [album.id, album.releaseDate]);

  function save(list: EntryStatus) {
    setSavingTo(list);
    startTransition(async () => {
      const res = await saveAlbum(album.id, list);
      setResult(res);
      if (res.status !== "error") onSaved(list);
    });
  }

  return (
    <DialogContent className="gap-5">
      <AlbumDetailHeader album={{ ...album, releaseDate }} />

      <div className="flex flex-col items-center gap-3">
        {result?.status === "added" ? (
          <p role="status" className="flex items-center gap-2 font-medium">
            <Check aria-hidden className="size-4" /> {savingTo === "listened" ? "Saved to Listened" : "Saved to Want to Listen"}
          </p>
        ) : inRotation ? (
          <p role="status" className="text-center font-medium text-destructive">
            This album is already in rotation!
          </p>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <Button onClick={() => save("want_to_listen")} disabled={pending} size="lg">
              <FolderPlus aria-hidden />
              {pending && savingTo === "want_to_listen" ? "Saving…" : "Add to Want to Listen"}
            </Button>
            <Button
              onClick={() => save("listened")}
              disabled={pending}
              size="lg"
              variant="outline"
            >
              <Headphones aria-hidden />
              {pending && savingTo === "listened" ? "Saving…" : "Add to Listened"}
            </Button>
          </div>
        )}

        {result?.status === "error" ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {result.message}
          </p>
        ) : null}

        <StoreLink url={album.storeUrl} />
      </div>
    </DialogContent>
  );
}
