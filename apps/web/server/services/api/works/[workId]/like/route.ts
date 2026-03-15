import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "work.like", userId: session.user.id });
  if (limited) return limited;

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return json({ error: "Work not found" }, { status: 404 });

  const userId = session.user.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.workLike.findUnique({ where: { userId_workId: { userId, workId } } });
      if (existing) {
        await tx.workLike.delete({ where: { userId_workId: { userId, workId } } });
        await tx.$executeRaw`UPDATE "Work" SET "likeCount" = GREATEST(0, "likeCount" - 1) WHERE "id" = ${workId}`;
        const updated = await tx.work.findUnique({ where: { id: workId }, select: { likeCount: true } });
        return { liked: false, likeCount: Math.max(0, updated.likeCount) };
      }
      await tx.workLike.create({ data: { userId, workId } });
      await tx.$executeRaw`UPDATE "Work" SET "likeCount" = "likeCount" + 1 WHERE "id" = ${workId}`;
      const updated = await tx.work.findUnique({ where: { id: workId }, select: { likeCount: true } });
      return { liked: true, likeCount: updated.likeCount };
    });
    if (result.liked) {
      await trackAnalyticsEventSafe({ req, eventType: "WORK_LIKE", userId, workId, path: req.url, routeName: "work.like" });
    }
    return json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
