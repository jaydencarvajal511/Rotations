import { ExternalLink } from "lucide-react";

import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AlbumSummary } from "@/lib/schemas/album";

import { AlbumCover } from "./album-cover";

/** Cover, "artist • year", and title — v1's album popup layout. */
export function AlbumDetailHeader({ album }: { album: AlbumSummary }) {
  const year = album.releaseDate?.slice(0, 4);
  return (
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
  );
}

/** Apple's terms require a store link near album art from their catalog. */
export function StoreLink({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
    >
      View on Apple Music <ExternalLink aria-hidden className="size-3" />
    </a>
  );
}
