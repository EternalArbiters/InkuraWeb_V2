import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken, decode } from "next-auth/jwt";

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// v30: private-deployment gate. Only active when PRIVATE_MODE=true (Project 2's env).
// Project 1 never sets this, so this whole block is a no-op there — behavior stays
// byte-for-byte identical to before this change for Project 1.
function isPrivateModeEnabled() {
  return process.env.PRIVATE_MODE === "true";
}

// Paths reachable with NO session even when PRIVATE_MODE is on.
function isPublicInPrivateMode(pathname: string) {
  if (pathname === "/") return true; // the private landing notice itself
  if (pathname.startsWith("/auth/signin")) return true; // the sign-in page itself
  if (pathname === "/auth/error") return true; // NextAuth error page
  if (pathname === "/api/auth/register") return false; // MUST stay blocked (self-registration)
  if (pathname.startsWith("/api/auth/")) return true; // NextAuth's own routes (csrf/session/callback/providers/signin/signout)
  if (pathname.startsWith("/api/cron/")) return true; // Vercel Cron calls this with a Bearer secret, never a session cookie
  if (pathname === "/api/analytics/events") return true; // fire-and-forget page-view beacon, fires unconditionally on every page incl. the private landing notice — reveals nothing sensitive
  if (pathname === "/api/client-metrics") return true; // same reasoning — perf beacon, no sensitive data
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const privateModeOn = isPrivateModeEnabled();
  const needsAdminCheck = isAdminPath(pathname);

  // v30 fix: getToken() in Edge Middleware auto-detects whether to look for the
  // "__Secure-"-prefixed session cookie by guessing at the request's protocol — and
  // that guess is unreliable specifically inside Vercel Edge Middleware, where it can
  // end up looking for the plain "next-auth.session-token" name even though NextAuth
  // actually set (and the browser is sending) "__Secure-next-auth.session-token" —
  // silently treating a fully valid, logged-in session as anonymous. Force the correct
  // behavior explicitly instead of relying on the guess: Vercel always serves over
  // HTTPS in every deployed environment (production + preview), so secureCookie should
  // be true whenever we're not running the local "next dev" server.
  const secureCookie = process.env.NODE_ENV === "production";

  let token: Awaited<ReturnType<typeof getToken>> | null = null;
  let tokenFetched = false;
  const ensureToken = async () => {
    if (tokenFetched) return token;
    tokenFetched = true;
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie });
    return token;
  };

  if (privateModeOn && !isPublicInPrivateMode(pathname)) {
    const t = await ensureToken();
    const role = (t as any)?.role;

    // TEMP DIAGNOSTIC (v30) — remove once resolved. getToken() swallows decode errors
    // and just returns null; decode the raw cookie ourselves to see the REAL reason.
    if (!t) {
      const raw =
        req.cookies.get("__Secure-next-auth.session-token")?.value ||
        req.cookies.get("next-auth.session-token")?.value ||
        null;
      console.log("[private-mode-debug] raw cookie present?", !!raw, "length:", raw?.length ?? 0);
      if (raw) {
        try {
          const decoded = await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET as string });
          console.log("[private-mode-debug] manual decode SUCCEEDED:", { role: (decoded as any)?.role, email: (decoded as any)?.email });
        } catch (err: any) {
          console.log("[private-mode-debug] manual decode FAILED:", err?.name, err?.message, err?.stack?.slice(0, 500));
        }
      }
    }

    if (!t || (role !== "ADMIN" && role !== "SPECIAL_USER")) {
      if (isApi) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    // authenticated ADMIN/SPECIAL_USER — fall through to the unchanged /admin check below.
  }

  if (!needsAdminCheck) return NextResponse.next();

  const adminToken = await ensureToken();
  if (!adminToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if ((adminToken as any).role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
