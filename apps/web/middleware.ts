import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { appKeyFromUserAgent, matchesAppKey } from "@/lib/appMode";

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// v30: private-deployment gate. Only active when PRIVATE_MODE=true (Project 2's env).
// Project 1 never sets this, so this whole block is a no-op there — behavior stays
// byte-for-byte identical to before this change for Project 1.
function isPrivateModeEnabled() {
  return process.env.PRIVATE_MODE === "true";
}

// v31: app-only gate for the APK deployment (Project 3). Only active when
// APP_MODE=true, so Projects 1 and 2 are untouched by this whole block.
//
// Project 3 serves the normal public Inkura experience (PRIVATE_MODE unset), but
// ONLY to the Capacitor WebView inside the Inkura APK, which identifies itself
// through its User-Agent. Everything else gets a 404, so the deployment is not
// browsable, linkable or crawlable from a normal browser.
//
// Fails CLOSED on purpose: APP_MODE=true without APP_ACCESS_TOKEN blocks
// everything rather than silently serving the site to the open internet.
function isAppModeEnabled() {
  return process.env.APP_MODE === "true";
}

// Paths that must stay reachable without the app key even when APP_MODE is on.
function isAppModeExempt(pathname: string) {
  // Vercel Cron calls this with a Bearer secret and a Vercel User-Agent, never
  // the APK's. The route itself rejects a wrong/missing CRON_SECRET.
  if (pathname.startsWith("/api/cron/")) return true;
  return false;
}

// Deliberately tiny and self-contained: served to browsers that reach Project 3,
// so it must not leak anything about the catalog, and must not depend on a route
// that is itself gated.
const APP_GATE_NOTICE = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Not Found</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;background:#0c1538;color:#e6e6f0;
       font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;text-align:center}
  p{margin:0;opacity:.7;font-size:14px}
</style>
</head>
<body><p>404 — Not Found</p></body>
</html>`;

function appGateResponse(isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return new NextResponse(APP_GATE_NOTICE, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
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

  // v31: runs before everything else — on Project 3 a request without the app
  // key must not even learn whether a route exists.
  if (isAppModeEnabled() && !isAppModeExempt(pathname)) {
    const presentedKey =
      appKeyFromUserAgent(req.headers.get("user-agent")) ?? req.headers.get("x-inkura-app-key");
    if (!matchesAppKey(presentedKey, process.env.APP_ACCESS_TOKEN ?? "")) {
      return appGateResponse(isApi);
    }
  }

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
    "/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
