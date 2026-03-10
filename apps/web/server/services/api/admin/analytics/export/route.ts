import "server-only";

import { apiRoute, badRequest } from "@/server/http";
import { buildAdminAnalyticsPdf } from "@/server/services/admin/analyticsPdf";

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

  const { data, buffer } = await buildAdminAnalyticsPdf({
    start,
    end,
    days: days ? toPositiveNumber(days, 30) : undefined,
    limit: limit ? toPositiveNumber(limit, 10) : undefined,
  });

  const filename = `inkura-analytics-${data.range.start}-to-${data.range.end}.pdf`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
