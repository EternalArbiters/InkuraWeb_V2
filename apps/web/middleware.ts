import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

  // v30 fix: this app's JWT carries enough custom fields (avatar URL, avatarFocusX/Y/
  // Zoom, inkuraLanguage, profileOnboardingComplete, etc.) that the encoded/encrypted
  // token routinely exceeds a single cookie's ~4KB limit — when that happens, NextAuth
  // transparently SPLITS it across multiple cookies (named "...session-token.0", ".1",
  // etc.) and getToken() already knows how to reassemble them. A prior version of this
  // file pre-checked for an EXACT cookie name before bothering to call getToken(), which
  // broke for exactly this chunked-cookie case and made valid, logged-in sessions look
  // anonymous to this middleware. Always call getToken() directly instead — it's cheap
  // (near-instant, no crypto work) when there's no cookie at all.
  let token: Awaited<ReturnType<typeof getToken>> | null = null;
  let tokenFetched = false;
  const ensureToken = async () => {
    if (tokenFetched) return token;
    tokenFetched = true;
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return token;
  };

  if (privateModeOn && !isPublicInPrivateMode(pathname)) {
    const t = await ensureToken();
    const role = (t as any)?.role;
    // TEMP DIAGNOSTIC (v30) — remove once the private-mode login issue is confirmed fixed.
    console.log("[private-mode-debug]", {
      pathname,
      cookieNames: req.cookies.getAll().map((c) => c.name),
      hasToken: !!t,
      role: role ?? null,
    });
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
