import "server-only";
import { headers } from "next/headers";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: any };

async function resolveOrigin(): Promise<string> {
  // Prefer explicit envs (stable in Vercel & local).
  // IMPORTANT:
  // - In this monorepo, NextAuth runs in apps/api and the web app proxies /api/*.
  // - Using NEXTAUTH_URL here can accidentally point server fetches to the API origin,
  //   which breaks auth because cookies are set on the web origin.
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (envUrl) return envUrl.replace(/\/$/, "");

  // Fallback to request headers when running in a request context.
  try {
    // Next.js 15 request APIs are async.
    const h = await headers();
    // NOTE: must use the headers() result (`h`) — avoid referencing any other variable here.
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    if (host) return `${proto}://${host}`;
  } catch {
    // ignore
  }

  // Final fallback (dev).
  return "http://localhost:3000";
}

/**
 * Server-side fetch helper.
 * - Uses relative URL ("/api/...") so it goes through apps/web rewrites to apps/api.
 * - Forces no-store to avoid stale auth-dependent cache.
 */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const origin = await resolveOrigin();
  const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, origin).toString();

  // Forward incoming request cookies so server components can access authenticated endpoints.
  // Without this, any server-rendered page that calls /api/me/* will behave as logged-out.
  let cookieHeader = "";
  try {
    const h = await headers();
    cookieHeader = h.get("cookie") || "";
  } catch {
    // ignore (e.g. build-time)
  }

  const mergedHeaders = new Headers(init.headers || {});
  if (cookieHeader && !mergedHeaders.has("cookie")) {
    mergedHeaders.set("cookie", cookieHeader);
  }

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: mergedHeaders,
  });

  let data: any = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const txt = await res.text().catch(() => "");
    data = txt;
  }

  if (res.ok) return { ok: true, status: res.status, data };
  return { ok: false, status: res.status, data };
}
