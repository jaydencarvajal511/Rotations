import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath, LOGIN_PATH } from "@/lib/auth/paths";
import { getPublicEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Refreshes the Supabase session cookie and does an optimistic auth redirect.
 * Not a security boundary — data access is protected by RLS.
 */
export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Don't run code between createServerClient and getClaims — it can cause
  // hard-to-debug random logouts
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && !isPublicPath(pathname)) {
    return redirectPreservingCookies(request, response, LOGIN_PATH, {
      next: pathname + search,
    });
  }

  if (isSignedIn && pathname === LOGIN_PATH) {
    return redirectPreservingCookies(request, response, "/");
  }

  return response;
}

function redirectPreservingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params: Record<string, string> = {},
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = new URLSearchParams(params).toString();
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
