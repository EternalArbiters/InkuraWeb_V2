import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname.startsWith("/upload") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/admin");

  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "1");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    const role = String((token as any).role || "").toUpperCase();
    if (role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/settings/:path*", "/report/:path*", "/admin/:path*"]
};
