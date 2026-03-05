import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, isHidden: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  // Disallow reactions on hidden comments for non-admins.
  if (comment.isHidden && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Comment is hidden" }, { status: 403 });
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      });

      if (existing) {
        await tx.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
        const updated = await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true, dislikeCount: true },
        });
        return { liked: false, likeCount: Math.max(0, updated.likeCount), dislikeCount: Math.max(0, updated.dislikeCount) };
      }

      // If user had disliked, remove it (mutual exclusive)
      const existingDislike = await tx.commentDislike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      });

      await tx.commentLike.create({ data: { userId, commentId } });

      const updated = await tx.comment.update({
        where: { id: commentId },
        data: {
          likeCount: { increment: 1 },
          ...(existingDislike ? { dislikeCount: { decrement: 1 } } : {}),
        },
        select: { likeCount: true, dislikeCount: true },
      });

      if (existingDislike) {
        await tx.commentDislike.delete({ where: { userId_commentId: { userId, commentId } } });
      }

      return { liked: true, likeCount: updated.likeCount, dislikeCount: Math.max(0, updated.dislikeCount) };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
