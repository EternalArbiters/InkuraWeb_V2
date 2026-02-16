export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; data: any };

/**
 * Server-side fetch helper.
 * - Uses relative URL ("/api/...") so it goes through apps/web rewrites to apps/api.
 * - Forces no-store to avoid stale auth-dependent cache.
 */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const res = await fetch(path, {
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
