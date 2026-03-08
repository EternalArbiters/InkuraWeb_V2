import "server-only";

import { logInfo, logWarn } from "@/server/observability/logger";

type MetricMeta = Record<string, unknown>;

function readEnvMs(name: string, fallback: number) {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return raw;
}

function normalizeDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs < 0) return 0;
  return Math.round(durationMs);
}

function truncateString(value: string, max = 240) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return truncateString(value, 240);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    if (depth >= 2) return value.length;
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= 2) return "[object]";
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
      out[key] = sanitizeValue(entry, depth + 1);
    }
    return out;
  }
  return String(value);
}

function sanitizeMeta(meta: MetricMeta = {}) {
  const out: MetricMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] = sanitizeValue(value);
  }
  return out;
}

export function getSlowRouteThresholdMs() {
  return readEnvMs("INKURA_SLOW_ROUTE_MS", 600);
}

export function getSlowPageRenderThresholdMs() {
  return readEnvMs("INKURA_SLOW_PAGE_RENDER_MS", 900);
}

export function getSlowQueryThresholdMs() {
  return readEnvMs("INKURA_SLOW_QUERY_MS", 250);
}

export function getClientMetricWarnThresholdMs() {
  return readEnvMs("INKURA_CLIENT_WARN_MS", 4000);
}

export function logPageRenderMetric(page: string, startedAt: number, meta: MetricMeta = {}) {
  const durationMs = normalizeDuration(Date.now() - startedAt);
  const payload = sanitizeMeta({ page, durationMs, ...meta });
  if (durationMs >= getSlowPageRenderThresholdMs()) {
    logWarn("page.slow_render", payload);
  } else {
    logInfo("page.render", payload);
  }
}

export function logSlowRouteMetric(meta: MetricMeta) {
  logWarn("api.slow_route", sanitizeMeta(meta));
}

export function logPrismaQueryMetric(meta: MetricMeta & { durationMs: number }) {
  const payload = sanitizeMeta({ ...meta, durationMs: normalizeDuration(meta.durationMs) });
  if ((payload.durationMs as number) >= getSlowQueryThresholdMs()) {
    logWarn("db.slow_query", payload);
  } else if (process.env.INKURA_LOG_QUERIES === "1") {
    logInfo("db.query", payload);
  }
}

export function logClientMetric(name: string, meta: MetricMeta = {}) {
  const payload = sanitizeMeta({ metricName: name, ...meta });
  const durationMs = typeof payload.durationMs === "number" ? payload.durationMs : null;
  if (durationMs != null && durationMs >= getClientMetricWarnThresholdMs()) {
    logWarn("client.metric", payload);
    return;
  }
  logInfo("client.metric", payload);
}
