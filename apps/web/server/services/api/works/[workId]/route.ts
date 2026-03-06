import "server-only";

import prisma from "@/server/db/prisma";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, slug: true, status: true },
  });
  if (!work) return json({ error: "Not found" }, { status: 404 });
  return json({ work });
});
