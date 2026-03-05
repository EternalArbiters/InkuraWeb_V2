import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

type TargetType = "WORK" | "CHAPTER";

async function isWorkOwner(userId: string, targetType: TargetType, targetId: string) {
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({ where: { id: targetId }, select: { authorId: true } });
    return !!w && w.authorId === userId;
  }
  const ch = await prisma.chapter.findUnique({
    where: { id: targetId },
    select: { work: { select: { authorId: true } } },
  });
  return !!ch && ch.work.authorId === userId;
}

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const pin = body?.pin !== undefined ? !!body.pin : true;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, targetType: true, targetId: true, parentId: true, isHidden: true, isPinned: true },
  });
  if (!comment) return json({ error: "Comment not found" }, { status: 404 });

  if (comment.parentId) return json({ error: "Only root comments can be pinned" }, { status: 400 });
  if (comment.isHidden) return json({ error: "Cannot pin a hidden comment" }, { status: 400 });

  const isAdmin = session.user.role === "ADMIN";
  const owner = await isWorkOwner(session.user.id, comment.targetType as TargetType, comment.targetId);
  if (!owner && !isAdmin) return json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    if (pin) {
      // enforce single pinned per target
      await tx.comment.updateMany({
        where: { targetType: comment.targetType as any, targetId: comment.targetId, isPinned: true },
        data: { isPinned: false, pinnedAt: null, pinnedById: null },
      });

      return tx.comment.update({
        where: { id: commentId },
        data: { isPinned: true, pinnedAt: now, pinnedById: session.user.id },
        select: { id: true, isPinned: true, userId: true, targetType: true, targetId: true },
      });
    }

    return tx.comment.update({
      where: { id: commentId },
      data: { isPinned: false, pinnedAt: null, pinnedById: null },
      select: { id: true, isPinned: true, userId: true, targetType: true, targetId: true },
    });
  });

  // Notify the comment author when pinned (nice engagement)
  try {
    if (pin && updated.userId && updated.userId !== session.user.id) {
      const work =
        updated.targetType === "WORK"
          ? await prisma.work.findUnique({ where: { id: updated.targetId }, select: { id: true, slug: true, title: true } })
          : await prisma.chapter.findUnique({
              where: { id: updated.targetId },
              select: { id: true, number: true, work: { select: { id: true, slug: true, title: true } } },
            }).then((ch) => ch?.work || null);

      if (work?.slug) {
        const href =
          updated.targetType === "WORK"
            ? `/w/${work.slug}?c=${updated.id}#comments`
            : `/w/${work.slug}/read/${updated.targetId}?c=${updated.id}#comments`;

        await prisma.notification.createMany({
          data: [
            {
              userId: updated.userId,
              type: "COMMENT_PINNED" as any,
              title: "Your comment was pinned",
              body: `Pinned on ${work.title}.`,
              href,
              workId: work.id,
              chapterId: updated.targetType === "CHAPTER" ? updated.targetId : null,
              actorId: session.user.id,
              dedupeKey: `comment_pinned:${updated.id}:${updated.userId}`,
            },
          ] as any,
          skipDuplicates: true,
        });
      }
    }
  } catch (e) {
    console.error("notify pinned failed", e);
  }

  return json({ ok: true, isPinned: updated.isPinned });
});
