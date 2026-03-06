import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, status: true, work: { select: { status: true } } },
  });
  if (!chapter || chapter.status !== "PUBLISHED" || chapter.work.status !== "PUBLISHED") {
    return json({ error: "Chapter not found" }, { status: 404 });
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.chapterLike.findUnique({
        where: { userId_chapterId: { userId, chapterId } },
      });

      if (existing) {
        await tx.chapterLike.delete({ where: { userId_chapterId: { userId, chapterId } } });
        const updated = await tx.chapter.update({
          where: { id: chapterId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
        return { liked: false, likeCount: Math.max(0, updated.likeCount) };
      }

      await tx.chapterLike.create({ data: { userId, chapterId } });
      const updated = await tx.chapter.update({
        where: { id: chapterId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: updated.likeCount };
    });

    return json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
