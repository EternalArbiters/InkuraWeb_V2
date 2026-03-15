import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

function clampRating(v: number) {
  if (!Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n < 1 || n > 5 ? null : n;
}

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "work.rate", userId: session.user.id });
  if (limited) return limited;

  const body = await req.json().catch(() => ({} as any));
  const value = clampRating(Number(body?.value));
  if (!value) return json({ error: "value must be 1..5" }, { status: 400 });

  const userId = session.user.id;
  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return json({ error: "Work not found" }, { status: 404 });

  try {
    await prisma.workRating.upsert({ where: { userId_workId: { userId, workId } }, update: { value }, create: { userId, workId, value } });
    const agg = await prisma.workRating.aggregate({ where: { workId }, _avg: { value: true }, _count: { value: true } });
    const ratingAvg = Number(agg._avg.value ?? 0);
    const ratingCount = Number(agg._count.value ?? 0);
    await prisma.$executeRaw`UPDATE "Work" SET "ratingAvg" = ${ratingAvg}, "ratingCount" = ${ratingCount} WHERE "id" = ${workId}`;
    await trackAnalyticsEventSafe({ req, eventType: "RATING_SUBMIT", userId, workId, path: req.url, routeName: "work.rate", metadata: { value } });
    return json({ ok: true, myRating: value, ratingAvg, ratingCount });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
