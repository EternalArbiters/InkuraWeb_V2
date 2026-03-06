import "server-only";

import { apiRoute, json } from "@/server/http";
import { listPublishedWorks } from "@/server/services/works/listPublishedWorks";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const data = await listPublishedWorks(req);
  return json(data);
});
