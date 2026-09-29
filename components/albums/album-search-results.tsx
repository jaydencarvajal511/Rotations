"use client";

import { Check, FolderPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { getAlbumDetails, saveToWantToListen, type SaveAlbumResult } from "@/lib/albums/actions";
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
            onSaved={() => setStatuses((s) => ({ ...s, [selected.id]: "want_to_listen" }))}
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
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveAlbumResult | null>(null);
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

  function save() {
    startTransition(async () => {
      const res = await saveToWantToListen(album.id);
      setResult(res);
      if (res.status !== "error") onSaved();
    });
  }

  return (
    <DialogContent className="gap-5">
      <AlbumDetailHeader album={{ ...album, releaseDate }} />

      <div className="flex flex-col items-center gap-3">
        {result?.status === "added" ? (
          <p role="status" className="flex items-center gap-2 font-medium">
            <Check aria-hidden className="size-4" /> Saved to Want to Listen
          </p>
        ) : inRotation ? (
          <p role="status" className="text-center font-medium text-destructive">
            This album is already in rotation!
          </p>
        ) : (
          <Button onClick={save} disabled={pending} size="lg" className="w-full">
            <FolderPlus aria-hidden />
            {pending ? "Saving…" : "Add to Want to Listen"}
          </Button>
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
