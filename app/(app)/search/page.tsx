import { Search } from "lucide-react";
import type { Metadata } from "next";

import { AlbumSearchResults } from "@/components/albums/album-search-results";
import { Input } from "@/components/ui/input";
import { CatalogError, MAX_TERM_LENGTH, searchAlbums } from "@/lib/catalog";
import { CATALOG_NAME } from "@/lib/catalog/links";
import type { AlbumSummary } from "@/lib/schemas/album";
import { getEntryStatuses } from "@/lib/supabase/entries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <form role="search" action="/search" className="relative">
        <label htmlFor="q" className="sr-only">
          Search albums
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={term}
          maxLength={MAX_TERM_LENGTH}
          placeholder="Album or artist"
          autoComplete="off"
          enterKeyHint="search"
          className="h-12 pr-12 text-base"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-primary"
        >
          <Search aria-hidden className="size-5" />
        </button>
      </form>

      {term ? <Results term={term} /> : <EmptyPrompt />}

      <p className="text-center text-xs text-muted-foreground">Album data from {CATALOG_NAME}</p>
    </main>
  );
}

function EmptyPrompt() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <Search aria-hidden className="size-12 text-primary" />
      <p className="max-w-xs">Search for an album to save it for later.</p>
    </div>
  );
}

async function Results({ term }: { term: string }) {
  let albums: AlbumSummary[];
  try {
    albums = await searchAlbums(term);
  } catch (error) {
    if (!(error instanceof CatalogError)) throw error;
    return (
      <p role="alert" className="text-center text-muted-foreground">
        Album search is unavailable right now. Try again in a minute.
      </p>
    );
  }

  if (albums.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No albums found for “{term}”.
      </p>
    );
  }

  const supabase = await createClient();
  const statuses = await getEntryStatuses(
    supabase,
    albums.map((a) => a.id),
  );

  return <AlbumSearchResults albums={albums} initialStatuses={statuses} />;
}
