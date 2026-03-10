import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, badRequest, json, readJsonObject } from "@/server/http";
import { aggregateAnalyticsRange } from "@/server/analytics/aggregate/run";

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export const POST = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const body = await readJsonObject(req);

  const start = typeof body.start === "string" ? body.start : null;
  const end = typeof body.end === "string" ? body.end : null;
  const days = body.days == null ? undefined : toPositiveInt(body.days, 30);

  if (start && end && new Date(start) > new Date(end)) {
    return badRequest("start must be before or equal to end");
  }

  const result = await aggregateAnalyticsRange({ start, end, days });
  return json({ ok: true, ...result });
});
