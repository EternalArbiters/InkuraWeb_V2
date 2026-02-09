import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.workLike.findUnique({
        where: { userId_workId: { userId, workId } },
      });

      if (existing) {
        await tx.workLike.delete({ where: { userId_workId: { userId, workId } } });
        const updated = await tx.work.update({
          where: { id: workId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
        return { liked: false, likeCount: Math.max(0, updated.likeCount) };
      }

      await tx.workLike.create({ data: { userId, workId } });
      const updated = await tx.work.update({
        where: { id: workId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: updated.likeCount };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
