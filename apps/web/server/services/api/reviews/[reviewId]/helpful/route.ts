import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, notFound, internalError, badRequest } from "@/server/http";

export const runtime = "nodejs";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ reviewId: string }> }) => {
  const { reviewId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const userId = session.user.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) return notFound();

  if (review.userId === userId) {
    return badRequest("You can't vote your own review");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reviewVote.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
        select: { reviewId: true },
      });

      if (existing) {
        await tx.reviewVote.delete({ where: { reviewId_userId: { reviewId, userId } } });
        const updated = await tx.review.update({ where: { id: reviewId }, data: { helpfulCount: { decrement: 1 } } });
        return { voted: false, helpfulCount: updated.helpfulCount };
      }

      await tx.reviewVote.create({ data: { reviewId, userId } });
      const updated = await tx.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } });
      return { voted: true, helpfulCount: updated.helpfulCount };
    });

    return json({ ok: true, voted: result.voted, helpfulCount: result.helpfulCount });
  } catch (e) {
    console.error(e);
    return internalError();
  }
});
