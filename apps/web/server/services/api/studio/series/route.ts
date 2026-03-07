import "server-only";

import { apiRoute, json } from "@/server/http";
import { listStudioSeries, mutateStudioSeries } from "@/server/services/studio/series";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request) => {
  const data = await listStudioSeries();
  return json(data);
});

export const POST = apiRoute(async (req: Request) => {
  const res = await mutateStudioSeries(req);
  return json(res.body, { status: res.status });
});
