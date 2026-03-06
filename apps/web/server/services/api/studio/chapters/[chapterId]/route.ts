import "server-only";

import { json } from "@/server/http";
import { getStudioChapterForEdit, patchStudioChapter } from "@/server/services/studio/chapters";


export const GET = async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const data = await getStudioChapterForEdit(chapterId);
  return json(data);
};
export const PATCH = async (req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const res = await patchStudioChapter(req, chapterId);
  return json(res.body, { status: res.status });
};
