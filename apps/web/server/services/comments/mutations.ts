import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { canModerateForTarget } from "./moderation";

function clampText(s: unknown): string {
  return String(s ?? "").trim();
}

export async function updateCommentFromRequest(req: Request, commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { status: 401, body: { error: "Unauthorized" } };

  const body = await req.json().catch(() => ({} as any));
  const text = clampText(body?.body);
  if (!text) return { status: 400, body: { error: "Comment body is required" } };
  if (text.length > 2000) return { status: 400, body: { error: "Comment too long" } };

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true, isHidden: true } });
  if (!c) return { status: 404, body: { error: "Comment not found" } };

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;

  if (!isOwner && !isAdmin) return { status: 403, body: { error: "Forbidden" } };
  if (c.isHidden && !isAdmin) return { status: 403, body: { error: "Comment is hidden" } };

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: text, editedAt: new Date() },
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: {
        include: {
          media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
        },
      },
    },
  });

  return { status: 200, body: { ok: true, comment: updated } };
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { status: 401, body: { error: "Unauthorized" } };

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true } });
  if (!c) return { status: 404, body: { error: "Comment not found" } };

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;
  if (!isOwner && !isAdmin) return { status: 403, body: { error: "Forbidden" } };

  await prisma.$transaction(async (tx) => {
    // best effort: clear reports
    await tx.report.deleteMany({ where: { targetType: "COMMENT", targetId: commentId } });
    await tx.comment.delete({ where: { id: commentId } });
  });

  return { status: 200, body: { ok: true } };
}

export async function toggleCommentLike(commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, isHidden: true } });
  if (!comment) return { status: 404, body: { error: "Comment not found" } };

  // Disallow reactions on hidden comments for non-admins.
  if (comment.isHidden && session.user.role !== "ADMIN") {
    return { status: 403, body: { error: "Comment is hidden" } };
  }

  const userId = session.user.id as string;

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
      return {
        liked: false,
        likeCount: Math.max(0, updated.likeCount),
        dislikeCount: Math.max(0, updated.dislikeCount),
      };
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

  return { status: 200, body: { ok: true, ...result } };
}

export async function toggleCommentDislike(commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, isHidden: true } });
  if (!comment) return { status: 404, body: { error: "Comment not found" } };

  // Disallow reactions on hidden comments for non-admins.
  if (comment.isHidden && session.user.role !== "ADMIN") {
    return { status: 403, body: { error: "Comment is hidden" } };
  }

  const userId = session.user.id as string;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.commentDislike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await tx.commentDislike.delete({ where: { userId_commentId: { userId, commentId } } });
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { dislikeCount: { decrement: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });
      return {
        disliked: false,
        likeCount: Math.max(0, updated.likeCount),
        dislikeCount: Math.max(0, updated.dislikeCount),
      };
    }

    // If user had liked, remove it (mutual exclusive)
    const existingLike = await tx.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    await tx.commentDislike.create({ data: { userId, commentId } });

    const updated = await tx.comment.update({
      where: { id: commentId },
      data: {
        dislikeCount: { increment: 1 },
        ...(existingLike ? { likeCount: { decrement: 1 } } : {}),
      },
      select: { likeCount: true, dislikeCount: true },
    });

    if (existingLike) {
      await tx.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
    }

    return { disliked: true, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
  });

  return { status: 200, body: { ok: true, ...result } };
}

export async function setCommentPinned(req: Request, commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { status: 401, body: { error: "Unauthorized" } };

  const body = await req.json().catch(() => ({} as any));
  const pin = body?.pin !== undefined ? !!body.pin : true;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, targetType: true, targetId: true, parentId: true, isHidden: true, isPinned: true },
  });
  if (!comment) return { status: 404, body: { error: "Comment not found" } };

  if (comment.parentId) return { status: 400, body: { error: "Only root comments can be pinned" } };
  if (comment.isHidden) return { status: 400, body: { error: "Cannot pin a hidden comment" } };

  const owner = await canModerateForTarget({
    session,
    targetType: String(comment.targetType) as any,
    targetId: String(comment.targetId),
  });
  const isAdmin = session.user.role === "ADMIN";
  if (!owner && !isAdmin) return { status: 403, body: { error: "Forbidden" } };

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
          ? await prisma.work.findUnique({
              where: { id: updated.targetId },
              select: { id: true, slug: true, title: true },
            })
          : await prisma.chapter
              .findUnique({
                where: { id: updated.targetId },
                select: { id: true, number: true, work: { select: { id: true, slug: true, title: true } } },
              })
              .then((ch) => ch?.work || null);

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

  return { status: 200, body: { ok: true, isPinned: updated.isPinned } };
}

export async function setCommentHidden(req: Request, commentId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const body = await req.json().catch(() => ({} as any));
  const hide = body?.hide !== undefined ? !!body.hide : true;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isHidden: true, targetType: true, targetId: true },
  });
  if (!comment) return { status: 404, body: { error: "Comment not found" } };

  const owner = await canModerateForTarget({
    session,
    targetType: String(comment.targetType) as any,
    targetId: String(comment.targetId),
  });
  const isAdmin = session.user.role === "ADMIN";
  if (!owner && !isAdmin) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      isHidden: hide,
      hiddenAt: hide ? new Date() : null,
      hiddenById: hide ? session.user.id : null,
    },
  });

  return { status: 200, body: { ok: true, isHidden: updated.isHidden } };
}
