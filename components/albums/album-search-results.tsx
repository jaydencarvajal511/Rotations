"use client";

import { Check, ExternalLink, FolderPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { saveToWantToListen, type SaveAlbumResult } from "@/app/search/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AlbumSummary } from "@/lib/schemas/album";
import type { EntryStatus } from "@/lib/schemas/entry";

import { AlbumCover } from "./album-cover";

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
            <button
              type="button"
              onClick={() => setSelected(album)}
              className="flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <AlbumCover src={album.coverUrl} alt="" size={72} className="rounded-lg" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="line-clamp-2 font-semibold">{album.name}</span>
                <span className="truncate text-sm text-muted-foreground">{album.artist}</span>
              </span>
            </button>
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
  const inRotation = status !== undefined;
  const year = album.releaseDate?.slice(0, 4);

  function save() {
    startTransition(async () => {
      const res = await saveToWantToListen(album.id);
      setResult(res);
      if (res.status !== "error") onSaved();
    });
  }

  return (
    <DialogContent className="gap-5">
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <AlbumCover
          src={album.coverUrl}
          alt={`Cover of ${album.name}`}
          size={240}
          priority
          className="rounded-xl"
        />
        <DialogDescription className="flex gap-2 font-medium text-primary">
          <span>{album.artist}</span>
          {year ? (
            <>
              <span aria-hidden>•</span>
              <span>{year}</span>
            </>
          ) : null}
        </DialogDescription>
        <DialogTitle className="text-lg leading-snug">{album.name}</DialogTitle>
      </div>

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

        {album.storeUrl ? (
          <a
            href={album.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            View on Apple Music <ExternalLink aria-hidden className="size-3" />
          </a>
        ) : null}
      </div>
    </DialogContent>
  );
}
