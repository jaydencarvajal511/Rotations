/** Apple Music redirects ID-only album URLs to the canonical, storefront-specific page. */
export function appleMusicAlbumUrl(albumId: string): string {
  return `https://music.apple.com/album/${encodeURIComponent(albumId)}`;
}
