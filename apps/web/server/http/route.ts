import "server-only";

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

/**
 * Wrap a Next.js App Router route handler and convert thrown errors into JSON responses.
 *
 * - ApiError(status, message) => `{ error: message }` with status
 * - Error("UNAUTHORIZED")     => 401
 * - Error("FORBIDDEN")        => 403
 * - otherwise                => 500 (and logs to console)
 */
export function apiRoute<TCtx = any>(
  handler: (req: Request, ctx?: TCtx) => Promise<Response>,
): (req: Request, ctx?: TCtx) => Promise<Response> {
  return async (req: Request, ctx?: TCtx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return jsonError(e.message, e.status);
      }
      const msg = normalizeMessage(e);
      if (msg === "UNAUTHORIZED") return unauthorized();
      if (msg === "FORBIDDEN") return forbidden();

      console.error(e);
      return internalError();
    }
  };
}
