import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export interface SessionUpdate {
  response: NextResponse;
  user: User | null;
}

/**
 * Refreshes the Supabase auth session inside the Next.js Proxy and returns the
 * current user plus a response carrying any rotated cookies. The caller decides
 * redirects. Kept free of `next/headers` and Node APIs so it runs in the
 * proxy/edge runtime.
 */
export const updateSession = async (
  request: NextRequest,
): Promise<SessionUpdate> => {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { response, user: null };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
};
