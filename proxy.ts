import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets, PWA files, and the service worker route
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icons/|manifest.webmanifest|serwist/).*)",
  ],
};
