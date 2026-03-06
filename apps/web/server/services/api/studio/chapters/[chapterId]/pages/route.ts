import "server-only";

import { json } from "@/server/http";
import { uploadOrReplaceChapterPages } from "@/server/services/studio/chapterPages";


export const POST = async (req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const res = await uploadOrReplaceChapterPages(req, chapterId);
  return json(res.body, { status: res.status });
};
