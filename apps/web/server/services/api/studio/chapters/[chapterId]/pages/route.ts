import "server-only";

import { apiRoute, json } from "@/server/http";
import { revalidatePublicChapter } from "@/server/cache/publicContent";
import { uploadOrReplaceChapterPages } from "@/server/services/studio/chapterPages";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const res = await uploadOrReplaceChapterPages(req, chapterId);
  if (res.status >= 200 && res.status < 300) revalidatePublicChapter({ chapterId, workSlug: (res.body as any)?.workSlug });
  return json(res.body, { status: res.status });
});
