import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/home",
  "/library",
  "/notifications",
  "/settings",
  "/studio",
  "/admin",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// Edge JWT decoding can fail if NEXTAUTH_SECRET is missing in the Edge runtime.
// To avoid redirect loops ("logged in" UI but middleware says "not logged in"),
// we first check for the presence of a session cookie.
function hasAuthCookie(req: NextRequest) {
  const names = [
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "next-auth.session-token",
    "__Secure-authjs.session-token",
    "authjs.session-token",
  ];
  return names.some((n) => !!req.cookies.get(n)?.value);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // Fast path: if there is no auth cookie at all, user is definitely not logged in.
  if (!hasAuthCookie(req)) {
    const url = req.nextUrl.clone();
    // UX: if user isn't logged in, send them to landing page first (not straight to login).
    // Landing page will offer Login/Signup, and can optionally continue to `next` after auth.
    url.pathname = "/";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Admin path: attempt to decode role if secret is available.
  // If decoding fails (token=null), allow through and lock it server-side in /admin layout.
  if (isAdminPath(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token && (token as any).role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/library/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/studio/:path*",
    "/admin/:path*",
  ],
};
