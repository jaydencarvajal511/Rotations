import { z } from "zod";

/** Catalog-agnostic album shape used by the UI and the albums cache. */
export const albumSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  artist: z.string().min(1),
  coverUrl: z.url().nullable(),
  /** YYYY-MM-DD */
  releaseDate: z.iso.date().nullable(),
  /** Link back to the catalog's store page (required by Apple's terms near album art) */
  storeUrl: z.url().nullable(),
});

export type AlbumSummary = z.infer<typeof albumSummarySchema>;
