import "server-only";

import { apiRoute, json } from "@/server/http";
import { revalidatePublicChapter } from "@/server/cache/publicContent";
import { deleteStudioChapter, getStudioChapterForEdit, patchStudioChapter } from "@/server/services/studio/chapters";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const data = await getStudioChapterForEdit(chapterId);
  return json(data);
});

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const res = await patchStudioChapter(req, chapterId);
  const chapter = (res.body as any)?.chapter as any;
  if (res.status >= 200 && res.status < 300) revalidatePublicChapter({ chapterId: chapter?.id ?? chapterId, workSlug: chapter?.workSlug });
  return json(res.body, { status: res.status });
});

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const data = await deleteStudioChapter(chapterId);
  revalidatePublicChapter({ chapterId, workSlug: (data as any)?.workSlug });
  return json(data);
});
