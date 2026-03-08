import "server-only";

import prisma from "@/server/db/prisma";
import { getChapterDisplayLabel } from "@/lib/chapterLabel";
import {
  canSeeGatedNotificationContent,
  commentNotificationDedupeKey,
  extractMentionUsernames,
} from "@/server/services/notifications/helpers";

type TargetType = "WORK" | "CHAPTER";

export async function notifyCommentEvents(args: {
  commentId: string;
  actorId: string;
  targetType: TargetType;
  targetId: string;
  parentId: string | null;
  body: string;
}) {
  const { commentId, actorId, targetType, targetId, parentId, body } = args;

  // Load context for href + gating
  const workCtx =
    targetType === "WORK"
      ? await prisma.work.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            slug: true,
            title: true,
            authorId: true,
            isMature: true,
            deviantLoveTags: { select: { id: true }, take: 1 },
          },
        })
      : null;

  const chapterCtx =
    targetType === "CHAPTER"
      ? await prisma.chapter.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            number: true,
            label: true,
            title: true,
            isMature: true,
            work: {
              select: {
                id: true,
                slug: true,
                title: true,
                authorId: true,
                isMature: true,
                deviantLoveTags: { select: { id: true }, take: 1 },
              },
            },
          },
        })
      : null;

  const work = workCtx || chapterCtx?.work;
  if (!work) return { ok: false as const, reason: "target_not_found" as const };

  const gatingReq = {
    adult: !!(work.isMature || chapterCtx?.isMature),
    deviant: (work.deviantLoveTags?.length || 0) > 0,
  };

  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, username: true, name: true },
  });

  const actorName = actor?.name || actor?.username || "Someone";

  const href =
    targetType === "WORK"
      ? `/w/${work.slug}?c=${commentId}#comments`
      : `/w/${work.slug}/read/${chapterCtx!.id}?c=${commentId}#comments`;

  const events: Array<{
    userId: string;
    type: "COMMENT_NEW" | "COMMENT_REPLY" | "COMMENT_MENTION";
    title: string;
    body: string;
    href: string;
    workId?: string | null;
    chapterId?: string | null;
    actorId: string;
    dedupeKey: string;
  }> = [];

  // 1) Notify work owner on new ROOT comments (avoid spamming for replies)
  if (!parentId && work.authorId && work.authorId !== actorId) {
    events.push({
      userId: work.authorId,
      type: "COMMENT_NEW",
      title: `New comment on ${work.title}`,
      body:
        targetType === "WORK"
          ? `${actorName} commented.`
          : `${actorName} commented on ${getChapterDisplayLabel(chapterCtx!.number, chapterCtx!.label)}.`,
      href,
      workId: work.id,
      chapterId: targetType === "CHAPTER" ? chapterCtx!.id : null,
      actorId,
      dedupeKey: commentNotificationDedupeKey("COMMENT_NEW", commentId, work.authorId),
    });
  }

  // 2) Reply notification to parent commenter
  let replyRecipient: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { userId: true } });
    if (parent?.userId && parent.userId !== actorId) {
      replyRecipient = parent.userId;
      events.push({
        userId: parent.userId,
        type: "COMMENT_REPLY",
        title: `New reply on ${work.title}`,
        body: `${actorName} replied to your comment.`,
        href,
        workId: work.id,
        chapterId: targetType === "CHAPTER" ? chapterCtx!.id : null,
        actorId,
        dedupeKey: commentNotificationDedupeKey("COMMENT_REPLY", commentId, parent.userId),
      });
    }
  }

  // 3) Mention notifications
  const mentions = extractMentionUsernames(body);
  if (mentions.length) {
    const users = await prisma.user.findMany({
      where: { username: { in: mentions } },
      select: { id: true, username: true },
      take: 50,
    });

    for (const u of users) {
      if (u.id === actorId) continue;
      if (replyRecipient && u.id === replyRecipient) continue; // avoid double-notif on reply+mention
      events.push({
        userId: u.id,
        type: "COMMENT_MENTION",
        title: `You were mentioned on ${work.title}`,
        body: `${actorName} mentioned you in a comment.`,
        href,
        workId: work.id,
        chapterId: targetType === "CHAPTER" ? chapterCtx!.id : null,
        actorId,
        dedupeKey: commentNotificationDedupeKey("COMMENT_MENTION", commentId, u.id),
      });
    }
  }

  if (!events.length) return { ok: true as const, notified: 0 };

  // Gate recipients (avoid notifying people who can't open the content)
  const uniqueUserIds = Array.from(new Set(events.map((e) => e.userId)));
  const gateRows = await prisma.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: { id: true, role: true, adultConfirmed: true, deviantLoveConfirmed: true },
  });
  const gateMap = new Map(gateRows.map((u) => [u.id, u]));

  const filtered = events.filter((e) => {
    const u = gateMap.get(e.userId);
    if (!u) return false;
    return canSeeGatedNotificationContent(u, gatingReq);
  });

  if (!filtered.length) return { ok: true as const, notified: 0 };

  await prisma.notification.createMany({
    data: filtered.map((e) => ({
      userId: e.userId,
      type: e.type as any,
      title: e.title,
      body: e.body,
      href: e.href,
      workId: e.workId || null,
      chapterId: e.chapterId || null,
      actorId: e.actorId,
      dedupeKey: e.dedupeKey,
    })) as any,
    skipDuplicates: true,
  });

  return { ok: true as const, notified: filtered.length };
}
