import "server-only";

import { getSession } from "@/server/auth/session";
import { attachRequestIdHeader, getOrCreateRequestId, getRequestPath } from "@/server/observability/api";
import { errorToMeta, logError, logInfo } from "@/server/observability/logger";
import { getSlowRouteThresholdMs, logSlowRouteMetric } from "@/server/observability/metrics";
import { forbidden, internalError, unauthorized, error as jsonError } from "./response";

/**
 * Error type used by API route handlers to signal an HTTP error response.
 * We keep the response body format consistent with existing routes: `{ error: string }`.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeMessage(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return String(e.message || "");
  return String((e as any)?.message || "");
}

async function safeGetSessionUserId(): Promise<string | null> {
  try {
    const session = await getSession();
    const userId = (session as any)?.user?.id as string | undefined;
    return userId || null;
  } catch {
    return null;
  }
}

function statusCodeToName(status: number) {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (status === 422) return "UNPROCESSABLE_ENTITY";
  if (status >= 500) return "INTERNAL_ERROR";
  return "HTTP_ERROR";
}


function attachServerTimingHeader(res: Response, durationMs: number): Response {
  const value = `app;dur=${Math.max(0, Math.round(durationMs))}`;
  try {
    (res.headers as any).set?.("server-timing", value);
    return res;
  } catch {
    const headers = new Headers(res.headers);
    headers.set("server-timing", value);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }
}

/**
 * Wrap a Next.js App Router route handler and convert thrown errors into JSON responses.
 *
 * - ApiError(status, message) => `{ error: message }` with status
 * - Error("UNAUTHORIZED")     => 401
 * - Error("FORBIDDEN")        => 403
 * - otherwise                => 500
 *
 * Stage 8 addition:
 * - Attach `x-request-id` to all responses (best-effort)
 * - Structured JSON logs for server-side errors (request id + route + status + userId when available)
 */
export function apiRoute(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response>;
export function apiRoute<TCtx>(handler: (req: Request, ctx: TCtx) => Promise<Response>): (req: Request, ctx: TCtx) => Promise<Response>;
export function apiRoute<TCtx>(handler: (req: Request, ctx?: TCtx) => Promise<Response>) {
  return async (req: Request, ctx?: TCtx) => {
    const requestId = getOrCreateRequestId(req);
    const startedAt = Date.now();
    const path = getRequestPath(req);
    const method = req.method || "GET";

    const logRequests = process.env.INKURA_LOG_REQUESTS === "1";

    try {
      const res = await handler(req, ctx);
      const durationMs = Date.now() - startedAt;
      const withServerTiming = attachServerTimingHeader(res, durationMs);
      const out = attachRequestIdHeader(withServerTiming, requestId);

      if (durationMs >= getSlowRouteThresholdMs()) {
        logSlowRouteMetric({
          requestId,
          method,
          path,
          status: out.status,
          durationMs,
        });
      }

      // Log only the problematic ones by default, or everything if INKURA_LOG_REQUESTS=1.
      if (out.status >= 500) {
        const userId = await safeGetSessionUserId();
        logError("api.response_error", {
          requestId,
          method,
          path,
          status: out.status,
          code: statusCodeToName(out.status),
          userId,
          durationMs,
        });
      } else if (logRequests) {
        logInfo("api.request", {
          requestId,
          method,
          path,
          status: out.status,
          durationMs,
        });
      }

      return out;
    } catch (e) {
      if (e instanceof ApiError) {
        const res = jsonError(e.message, e.status);
        const durationMs = Date.now() - startedAt;
        const withServerTiming = attachServerTimingHeader(res, durationMs);
        const out = attachRequestIdHeader(withServerTiming, requestId);

        if (durationMs >= getSlowRouteThresholdMs()) {
          logSlowRouteMetric({
            requestId,
            method,
            path,
            status: e.status,
            durationMs,
          });
        }

        // Only log 5xx ApiErrors (4xx are usually expected).
        if (e.status >= 500) {
          const userId = await safeGetSessionUserId();
          logError("api.api_error", {
            requestId,
            method,
            path,
            status: e.status,
            code: statusCodeToName(e.status),
            userId,
            durationMs,
            ...errorToMeta(e),
          });
        } else if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: e.status,
            durationMs,
          });
        }

        return out;
      }

      const msg = normalizeMessage(e);

      if (msg === "UNAUTHORIZED") {
        const durationMs = Date.now() - startedAt;
        const out = attachRequestIdHeader(attachServerTimingHeader(unauthorized(), durationMs), requestId);
        if (durationMs >= getSlowRouteThresholdMs()) {
          logSlowRouteMetric({ requestId, method, path, status: 401, durationMs });
        }
        if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: 401,
            durationMs,
          });
        }
        return out;
      }

      if (msg === "FORBIDDEN") {
        const durationMs = Date.now() - startedAt;
        const out = attachRequestIdHeader(attachServerTimingHeader(forbidden(), durationMs), requestId);
        if (durationMs >= getSlowRouteThresholdMs()) {
          logSlowRouteMetric({ requestId, method, path, status: 403, durationMs });
        }
        if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: 403,
            durationMs,
          });
        }
        return out;
      }

      // Unhandled error.
      const durationMs = Date.now() - startedAt;
      const userId = await safeGetSessionUserId();
      logError("api.unhandled_error", {
        requestId,
        method,
        path,
        status: 500,
        code: "INTERNAL_ERROR",
        userId,
        durationMs,
        ...errorToMeta(e),
      });

      const out = attachRequestIdHeader(attachServerTimingHeader(internalError(), durationMs), requestId);
      if (durationMs >= getSlowRouteThresholdMs()) {
        logSlowRouteMetric({ requestId, method, path, status: 500, durationMs });
      }
      return out;
    }
  };
}
