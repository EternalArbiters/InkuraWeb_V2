import "server-only";

import { getSession } from "@/server/auth/session";
import { attachRequestIdHeader, getOrCreateRequestId, getRequestPath } from "@/server/observability/api";
import { errorToMeta, logError, logInfo } from "@/server/observability/logger";
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
      const out = attachRequestIdHeader(res, requestId);

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
          durationMs: Date.now() - startedAt,
        });
      } else if (logRequests) {
        logInfo("api.request", {
          requestId,
          method,
          path,
          status: out.status,
          durationMs: Date.now() - startedAt,
        });
      }

      return out;
    } catch (e) {
      if (e instanceof ApiError) {
        const res = jsonError(e.message, e.status);
        const out = attachRequestIdHeader(res, requestId);

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
            durationMs: Date.now() - startedAt,
            ...errorToMeta(e),
          });
        } else if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: e.status,
            durationMs: Date.now() - startedAt,
          });
        }

        return out;
      }

      const msg = normalizeMessage(e);

      if (msg === "UNAUTHORIZED") {
        const out = attachRequestIdHeader(unauthorized(), requestId);
        if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: 401,
            durationMs: Date.now() - startedAt,
          });
        }
        return out;
      }

      if (msg === "FORBIDDEN") {
        const out = attachRequestIdHeader(forbidden(), requestId);
        if (logRequests) {
          logInfo("api.request", {
            requestId,
            method,
            path,
            status: 403,
            durationMs: Date.now() - startedAt,
          });
        }
        return out;
      }

      // Unhandled error.
      const userId = await safeGetSessionUserId();
      logError("api.unhandled_error", {
        requestId,
        method,
        path,
        status: 500,
        code: "INTERNAL_ERROR",
        userId,
        durationMs: Date.now() - startedAt,
        ...errorToMeta(e),
      });

      const out = attachRequestIdHeader(internalError(), requestId);
      return out;
    }
  };
}
