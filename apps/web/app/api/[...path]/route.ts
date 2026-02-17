import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Robust API proxy for the web app.
 *
 * Why this exists:
 * - Next.js rewrites in next.config.ts are resolved at build time.
 * - On Vercel, if INTERNAL_API_BASE isn't available during the build step,
 *   the rewrite destination can silently fall back (e.g., localhost) and
 *   client + server calls to /api/* will fail.
 *
 * This route handler proxies /api/* at runtime using env vars, so the web
 * app can always reach the real API deployment.
 */

const API_BASE =
  process.env.INTERNAL_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  // last-resort fallback (safe default for this project)
  "https://inkura-api.vercel.app";

// Next.js 15.5.x type-gen in this project expects `context.params` to be awaitable.
// Runtime may pass a plain object; `await` works for both values and Promises.
type RouteCtx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, { params }: RouteCtx) {
  const resolved: any = await params;
  const path: string[] = (resolved?.path || []) as string[];
  const incomingUrl = new URL(req.url);

  // Normalize base so it works whether the env contains just the origin
  // ("https://inkura-api.vercel.app") or already includes "/api".
  const base = API_BASE.replace(/\/$/, "");
  const normalizedBase = base.endsWith("/api") ? base.slice(0, -4) : base;

  const target = new URL(`/api/${path.join("/")}`, normalizedBase);
  target.search = incomingUrl.search;

  // Prevent accidental proxy loops if someone misconfigures API_BASE.
  if (target.origin === incomingUrl.origin) {
    return new Response(
      JSON.stringify({ error: "API proxy misconfigured: API_BASE points to this web origin." }),
      { status: 500, headers: { "content-type": "application/json", "cache-control": "no-store" } },
    );
  }

  // Forward headers (minus hop-by-hop ones)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstream = await fetch(target.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const outHeaders = new Headers(upstream.headers);
  // ensure responses aren't cached by accident (auth-dependent)
  outHeaders.set("cache-control", "no-store");
  // content-length can be wrong if streaming/decompressed
  outHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
