import "server-only";

import { apiRoute, json } from "@/server/http";
import { revalidatePublicChapter } from "@/server/cache/publicContent";
import { createStudioChapter } from "@/server/services/studio/chapters";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const res = await createStudioChapter(req);
  const chapter = (res.body as any)?.chapter as any;
  if (res.status >= 200 && res.status < 300) revalidatePublicChapter({ chapterId: chapter?.id, workSlug: chapter?.workSlug });
  return json(res.body, { status: res.status });
});
