import "server-only";

import { NextResponse } from "next/server";

export type JsonInit = {
  status?: number;
  headers?: HeadersInit;
};

/**
 * Thin wrapper around NextResponse.json to keep API routes consistent.
 * Uses the existing Inkura response shapes (mostly `{ error: string }`).
 */
export function json<T>(data: T, init?: JsonInit) {
  return NextResponse.json(data as any, init);
}

export function error(message: string, status = 400, init?: Omit<JsonInit, "status">) {
  return json({ error: message }, { status, ...(init || {}) });
}

export function badRequest(message = "Bad request") {
  return error(message, 400);
}

export function unauthorized(message = "Unauthorized") {
  return error(message, 401);
}

export function forbidden(message = "Forbidden") {
  return error(message, 403);
}

export function notFound(message = "Not found") {
  return error(message, 404);
}

export function conflict(message = "Conflict") {
  return error(message, 409);
}

export function payloadTooLarge(message = "Payload too large") {
  return error(message, 413);
}

export function unsupportedMediaType(message = "Unsupported media type") {
  return error(message, 415);
}

export function unprocessableEntity(message = "Unprocessable entity") {
  return error(message, 422);
}

export function internalError(message = "Internal error") {
  return error(message, 500);
}
