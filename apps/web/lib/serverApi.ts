import "server-only";
import { cookies, headers } from "next/headers";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: any };

async function resolveOrigin(): Promise<string> {
  // IMPORTANT: for auth stability we must fetch against the *current* web origin.
  //
  // 1) Prefer request headers (works for both Vercel + local).
  try {
    // Next.js 15: headers() is async.
    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    if (host) return `${proto}://${host}`;
  } catch {
    // ignore (e.g. build-time)
  }

  // 2) Fallback to envs.
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (envUrl) return envUrl.replace(/\/$/, "");

  // 3) Final fallback (dev).
  return "http://localhost:3000";
}

async function getCookieHeader(): Promise<string> {
  // In App Router, `cookies()` is the reliable way to access incoming cookies.
  // (Some environments strip the raw `cookie` header from `headers()`.)
  try {
    // Next.js 15: cookies() is async.
    const c = await cookies();
    const all = c.getAll();
    if (!all.length) return "";
    return all.map(({ name, value }) => `${name}=${value}`).join("; ");
  } catch {
    return "";
  }
}

/**
 * Server-side fetch helper.
 * - Uses relative URL ("/api/...") against the current origin (apps/web).
 * - Forces no-store to avoid stale auth-dependent cache.
 */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const origin = await resolveOrigin();
  const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, origin).toString();

  // Forward incoming cookies so server components can access authenticated endpoints.
  // Without this, pages like /studio (server-rendered) can incorrectly redirect to /auth/signin.
  const cookieHeader = await getCookieHeader();

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
