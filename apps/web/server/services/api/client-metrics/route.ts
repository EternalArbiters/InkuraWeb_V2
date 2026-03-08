import { apiRoute, badRequest, json, readJsonObject } from "@/server/http";
import { logClientMetric } from "@/server/observability/metrics";

function readMetricName(body: Record<string, any>) {
  const raw = typeof body.name === "string" ? body.name.trim() : "";
  if (!raw) return "";
  return raw.slice(0, 80);
}

function sanitizeData(input: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>).slice(0, 24)) {
    if (value == null) {
      out[key] = null;
      continue;
    }
    if (typeof value === "number") {
      out[key] = Number.isFinite(value) ? value : null;
      continue;
    }
    if (typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (typeof value === "string") {
      out[key] = value.trim().slice(0, 240);
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = value.slice(0, 10).map((entry) => (typeof entry === "string" ? entry.slice(0, 120) : entry));
      continue;
    }
    if (typeof value === "object") {
      out[key] = depth >= 1 ? "[object]" : sanitizeData(value, depth + 1) || "[object]";
    }
  }
  return out;
}

export const POST = apiRoute(async (req) => {
  const body = await readJsonObject(req);
  const name = readMetricName(body);
  if (!name) return badRequest("Metric name is required");

  const path = typeof body.path === "string" ? body.path.trim().slice(0, 240) : "";
  const at = typeof body.at === "string" ? body.at.trim().slice(0, 80) : "";
  const data = sanitizeData(body.data);

  logClientMetric(name, {
    source: "browser",
    metricPath: path || undefined,
    at: at || undefined,
    ...(data || {}),
  });

  return json({ ok: true });
});
