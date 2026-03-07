import "server-only";

import { apiRoute, json } from "@/server/http";
import { createStudioSeries, listStudioSeries, patchStudioSeries } from "@/server/services/studio/series";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const data = await listStudioSeries();
  return json(data);
});

export const POST = apiRoute(async (req: Request) => {
  const res = await createStudioSeries(req);
  return json(res.body, { status: res.status });
});

export const PATCH = apiRoute(async (req: Request) => {
  const res = await patchStudioSeries(req);
  return json(res.body, { status: res.status });
});
