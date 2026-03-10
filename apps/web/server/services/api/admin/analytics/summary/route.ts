import "server-only";

import { apiRoute, badRequest, json } from "@/server/http";
import { getAdminAnalyticsData } from "@/server/services/admin/analytics";

function toPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export const GET = apiRoute(async (req: Request) => {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const days = url.searchParams.get("days");
  const limit = url.searchParams.get("limit");

  if (start && end && new Date(start) > new Date(end)) {
    return badRequest("start must be before or equal to end");
  }

  const data = await getAdminAnalyticsData({
    start,
    end,
    days: days ? toPositiveNumber(days, 30) : undefined,
    limit: limit ? toPositiveNumber(limit, 10) : undefined,
  });

  return json(data);
});
