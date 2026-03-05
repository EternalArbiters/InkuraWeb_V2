import { apiRoute, json } from "@/server/http";
import { createStudioWork, listStudioWorks } from "@/server/services/studio/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const data = await listStudioWorks(req);
  return json(data);
});

export const POST = apiRoute(async (req: Request) => {
  const res = await createStudioWork(req);
  return json(res.body, { status: res.status });
});
