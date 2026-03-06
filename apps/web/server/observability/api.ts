import "server-only";

import { createRequestId } from "@/server/observability/logger";

export function getRequestPath(req: Request) {
  try {
    return new URL(req.url).pathname;
  } catch {
    return "";
  }
}

export function getIncomingRequestId(req: Request): string | null {
  const direct = req.headers.get("x-request-id")?.trim();
  if (direct) return direct;

  // Vercel adds an ID header on the edge; still useful as a trace key.
  const vercel = req.headers.get("x-vercel-id")?.trim();
  if (vercel) return vercel;

  const cfRay = req.headers.get("cf-ray")?.trim();
  if (cfRay) return cfRay;

  return null;
}

export function getOrCreateRequestId(req: Request) {
  return getIncomingRequestId(req) || createRequestId();
}

export function attachRequestIdHeader(res: Response, requestId: string): Response {
  // Best-effort: mutate if possible.
  try {
    (res.headers as any).set?.("x-request-id", requestId);
    return res;
  } catch {
    // Fall back to cloning a new response.
    const headers = new Headers(res.headers);
    headers.set("x-request-id", requestId);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }
}
