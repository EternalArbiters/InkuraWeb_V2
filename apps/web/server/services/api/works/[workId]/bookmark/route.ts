import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "work.bookmark", userId: session.user.id });
  if (limited) return limited;

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return json({ error: "Work not found" }, { status: 404 });

  const userId = session.user.id;
  try {
    const existing = await prisma.bookmark.findUnique({ where: { userId_workId: { userId, workId } } });
    if (existing) {
      await prisma.bookmark.delete({ where: { userId_workId: { userId, workId } } });
      return json({ ok: true, bookmarked: false });
    }
    await prisma.bookmark.create({ data: { userId, workId } });
    return json({ ok: true, bookmarked: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
