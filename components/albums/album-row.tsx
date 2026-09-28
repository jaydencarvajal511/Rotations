import type { AlbumSummary } from "@/lib/schemas/album";
import { cn } from "@/lib/utils";

import { AlbumCover } from "./album-cover";

type Props = {
  album: AlbumSummary;
  onSelect: () => void;
  /** Card layout on wider screens (v1's 3-column grid); rows on mobile. */
  responsiveGrid?: boolean;
};

export function AlbumRow({ album, onSelect, responsiveGrid = false }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        responsiveGrid && "sm:h-full sm:flex-col sm:justify-start sm:p-4 sm:text-center",
      )}
    >
      <AlbumCover
        src={album.coverUrl}
        alt=""
        size={responsiveGrid ? 144 : 72}
        className={cn("rounded-lg", responsiveGrid && "size-18 sm:size-36")}
      />
      <span className={cn("flex min-w-0 flex-col gap-1", responsiveGrid && "sm:items-center")}>
        <span className="line-clamp-2 font-semibold">{album.name}</span>
        <span className="truncate text-sm text-muted-foreground">{album.artist}</span>
      </span>
    </button>
  );
}
