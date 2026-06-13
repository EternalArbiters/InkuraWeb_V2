import "server-only";

import prisma from "@/server/db/prisma";
import { userPublicSelect } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, clampRating, cleanText, unauthorized, internalError, badRequest } from "@/server/http";
import { ensureCanViewWorkReviews, listWorkReviews } from "@/server/services/reviews/listWorkReviews";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const url = new URL(req.url);
  const rawTake = url.searchParams.get("take");
  const take = rawTake == null ? undefined : Number.parseInt(rawTake, 10);
  const res = await listWorkReviews({
    workId,
    sort: url.searchParams.get("sort"),
    take: Number.isFinite(take) ? take : undefined,
  });
  return json(res.body, { status: res.status });
});

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const gate = await ensureCanViewWorkReviews(workId);
  if (!gate.ok) return json(gate.body, { status: gate.status });

  const bodyJson = await req.json().catch(() => ({} as any));
  const rating = clampRating(Number(bodyJson?.rating));
  const title = cleanText(bodyJson?.title, 120) || null;
  const body = cleanText(bodyJson?.body, 10000);
  const isSpoiler = !!bodyJson?.isSpoiler;

  if (!rating) return badRequest("rating must be 1..5");
  if (!body) return badRequest("body is required");

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { workId_userId: { workId, userId } },
        update: { rating, title, body, isSpoiler },
        create: { workId, userId, rating, title, body, isSpoiler },
        include: { user: { select: userPublicSelect } },
      });

      await tx.workRating.upsert({
        where: { userId_workId: { userId, workId } },
        update: { value: rating },
        create: { userId, workId, value: rating },
      });

      const agg = await tx.workRating.aggregate({
        where: { workId },
        _avg: { value: true },
        _count: { value: true },
      });

      const ratingAvg = Number(agg._avg.value ?? 0);
      const ratingCount = Number(agg._count.value ?? 0);

      await tx.$executeRaw`UPDATE "Work" SET "ratingAvg" = ${ratingAvg}, "ratingCount" = ${ratingCount} WHERE "id" = ${workId}`;

      return { review, ratingAvg, ratingCount };
    });

    return json({ ok: true, review: result.review, ratingAvg: result.ratingAvg, ratingCount: result.ratingCount });
  } catch (e) {
    console.error(e);
    return internalError();
  }
});
