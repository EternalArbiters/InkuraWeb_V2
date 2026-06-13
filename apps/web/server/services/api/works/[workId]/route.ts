import "server-only";

import { getWorkSlugById } from "@/server/services/works/workSlug";
import { apiRoute, json, notFound } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const work = await getWorkSlugById(workId);
  if (!work) return notFound();
  return json({ work });
});
