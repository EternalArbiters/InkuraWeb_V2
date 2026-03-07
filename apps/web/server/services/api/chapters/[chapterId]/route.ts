import "server-only";

import { getPublishedChapterReaderData } from "@/server/services/chapters/readChapter";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const data = await getPublishedChapterReaderData(chapterId);
  if (!data.ok) return json({ error: data.error }, { status: data.status });
  return json(data);
});
