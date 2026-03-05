import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (review.userId === userId) {
    return NextResponse.json({ error: "You can't vote your own review" }, { status: 400 });
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

    return NextResponse.json({ ok: true, voted: result.voted, helpfulCount: result.helpfulCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
