import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, clampRating, unauthorized, internalError, badRequest, notFound } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const limited = await enforceRateLimitOrResponse({ req, policyName: "work.rate", userId: session.user.id });
  if (limited) return limited;

  const body = await req.json().catch(() => ({} as any));
  const value = clampRating(Number(body?.value));
  if (!value) return badRequest("value must be 1..5");

  const userId = session.user.id;
  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return notFound("Work not found");

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
    return internalError();
  }
});
