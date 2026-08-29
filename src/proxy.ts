import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/infrastructure/supabase/edge";

/**
 * Next.js Proxy (formerly `middleware`) — refreshes the Supabase session on
 * every matched request and gates protected vs. auth-only routes.
 */

/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/settings",
  "/rounds",
  "/courses",
];

/** Routes an authenticated user should be bounced away from. */
const AUTH_ROUTES = ["/login", "/signup"];

const startsWithAny = (pathname: string, prefixes: string[]): boolean =>
  prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (user && startsWithAny(pathname, AUTH_ROUTES)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and files served from public/.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|offline).*)",
  ],
};
