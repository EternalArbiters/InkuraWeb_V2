import "server-only";
import { headers } from "next/headers";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: any };

function resolveOrigin(): string {
  // Prefer explicit envs (stable in Vercel & local).
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (envUrl) return envUrl.replace(/\/$/, "");

  // Fallback to request headers when running in a request context.
  try {
    const h = headers();
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
  const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, resolveOrigin()).toString();

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.headers || {}),
    },
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
