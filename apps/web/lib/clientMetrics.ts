"use client";

type MetricData = Record<string, unknown>;

const ENDPOINT = "/api/client-metrics";

function canUseBeacon() {
  return typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
}

function safeString(value: unknown, max = 240) {
  if (value == null) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return safeString(value, 240) || "";
  if (Array.isArray(value)) {
    if (depth >= 2) return value.length;
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= 2) return "[object]";
    const out: MetricData = {};
    for (const [key, entry] of Object.entries(value as MetricData).slice(0, 20)) {
      out[key] = sanitizeValue(entry, depth + 1);
    }
    return out;
  }
  return safeString(value) || null;
}

function sanitizeData(data: MetricData = {}) {
  const out: MetricData = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = sanitizeValue(value);
  }
  return out;
}

export function sendClientMetric(name: string, data: MetricData = {}) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    name,
    at: new Date().toISOString(),
    path: window.location.pathname,
    data: sanitizeData(data),
  });

  if (canUseBeacon()) {
    try {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      return;
    } catch {
      // fall through
    }
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => null);
}

export function sendUploadMetric(data: {
  scope: string;
  beforeBytes: number;
  afterBytes: number;
  durationMs: number;
  presignMs?: number;
  uploadMs?: number;
  contentType?: string;
  compressionApplied?: boolean;
  outcome?: "success" | "error";
  errorMessage?: string;
}) {
  sendClientMetric("client.upload", data);
}
