import "server-only";

import { randomUUID } from "crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

const SERVICE_NAME = process.env.INKURA_SERVICE_NAME || "inkura-web";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function nowIso() {
  return new Date().toISOString();
}

function getEnv() {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
}

function normalizeLevel(level: string | undefined): LogLevel {
  const v = String(level || "").toLowerCase().trim();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return "info";
}

function shouldLog(level: LogLevel) {
  const configured = normalizeLevel(process.env.INKURA_LOG_LEVEL);
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configured];
}

function jsonSafe(value: any) {
  try {
    JSON.stringify(value);
    return value;
  } catch {
    return { _nonSerializable: true };
  }
}

function safeString(v: unknown) {
  if (v == null) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

export function createRequestId() {
  try {
    return randomUUID();
  } catch {
    // Fallback: short-ish random string
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function errorToMeta(err: unknown): { errorName?: string; errorMessage: string; errorStack?: string } {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: safeString(err.message),
      errorStack: safeString(err.stack),
    };
  }
  return { errorMessage: safeString(err) };
}

export type LogMeta = Record<string, unknown>;

export function log(level: LogLevel, event: string, meta: LogMeta = {}) {
  if (!shouldLog(level)) return;

  const payload = {
    ts: nowIso(),
    level,
    env: getEnv(),
    service: SERVICE_NAME,
    event,
    ...jsonSafe(meta),
  };

  const line = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(event: string, meta?: LogMeta) {
  log("info", event, meta);
}

export function logWarn(event: string, meta?: LogMeta) {
  log("warn", event, meta);
}

export function logError(event: string, meta?: LogMeta) {
  log("error", event, meta);
}
