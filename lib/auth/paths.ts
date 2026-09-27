/** Routes reachable without a session. */
const PUBLIC_PATHS = ["/login", "/~offline"];
const PUBLIC_PREFIXES = ["/auth/"];

export const LOGIN_PATH = "/login";

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Returns `next` only if it's a same-origin relative path, otherwise "/".
 * Prevents open redirects via ?next=https://evil.com or //evil.com.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}
