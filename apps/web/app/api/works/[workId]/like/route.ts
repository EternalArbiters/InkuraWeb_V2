import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return json({ error: "Work not found" }, { status: 404 });

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

    return json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
