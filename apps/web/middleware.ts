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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // NOTE: middleware needs NEXTAUTH_SECRET in apps/web env to decode JWT.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = req.nextUrl.clone();
    // UX: if user isn't logged in, send them to landing page first (not straight to login).
    // Landing page will offer Login/Signup, and can optionally continue to `next` after auth.
    url.pathname = "/";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAdminPath(pathname) && (token as any).role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
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
