import "server-only";

/**
 * The app's album catalog. Callers import from here (or ./links in client
 * code), never from a provider module, so switching providers (Spotify →
 * iTunes → Deezer so far) only changes these re-exports.
 */
export { CatalogError, lookupAlbum, MAX_TERM_LENGTH, searchAlbums } from "@/lib/deezer/client";
