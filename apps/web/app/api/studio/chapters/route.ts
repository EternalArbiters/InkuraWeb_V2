import { apiRoute, json } from "@/server/http";
import { createStudioChapter } from "@/server/services/studio/chapters";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const res = await createStudioChapter(req);
  return json(res.body, { status: res.status });
});
