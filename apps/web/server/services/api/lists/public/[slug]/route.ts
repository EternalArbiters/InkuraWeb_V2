import "server-only";

import { getReadingListPageDataBySlug } from "@/server/services/readingLists/readingLists";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const data = await getReadingListPageDataBySlug(slug);
  if (!data.ok) return json({ error: data.error }, { status: data.status });
  return json({
    list: data.list,
    items: data.items,
    viewer: data.viewer,
  });
});
