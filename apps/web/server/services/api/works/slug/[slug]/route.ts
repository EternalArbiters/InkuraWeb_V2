import "server-only";

import { getWorkPageDataBySlug } from "@/server/services/works/workPage";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const data = await getWorkPageDataBySlug(slug);
  if (!data.ok) return json({ error: data.error }, { status: data.status });
  return json(data);
});
