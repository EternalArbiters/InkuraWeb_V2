import "server-only";

import prisma from "@/server/db/prisma";
import { commentListInclude, mediaObjectSelect } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { notifyCommentEvents } from "@/server/services/notifyCommentEvents";

export type CommentTargetTypeString = "WORK" | "CHAPTER";

function safeTargetType(v: unknown): CommentTargetTypeString | null {
  const s = String(v || "").toUpperCase().trim();
  if (s === "WORK" || s === "CHAPTER") return s;
  return null;
}

export async function createCommentFromRequest(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const body = await req.json().catch(() => ({} as any));
  const targetType = safeTargetType(body?.targetType);
  const targetId = String(body?.targetId || "").trim();
  const parentId = body?.parentId ? String(body.parentId).trim() : null;
  const text = String(body?.body || "").trim();
  const isSpoiler = !!body?.isSpoiler;

  if (!targetType || !targetId) {
    return { status: 400, body: { error: "targetType and targetId are required" } };
  }
  if (!text) return { status: 400, body: { error: "Comment body is required" } };
  if (text.length > 2000) return { status: 400, body: { error: "Comment too long" } };

  // Validate target exists
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!w) return { status: 404, body: { error: "Work not found" } };
  } else {
    const ch = await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!ch) return { status: 404, body: { error: "Chapter not found" } };
  }

  // Validate parent (if reply)
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, targetType: true, targetId: true, parentId: true, isHidden: true },
    });
    if (!parent) return { status: 404, body: { error: "Parent comment not found" } };
    if (parent.isHidden) return { status: 403, body: { error: "Cannot reply to hidden comment" } };
    if (parent.targetType !== targetType || parent.targetId !== targetId) {
      return { status: 400, body: { error: "Invalid parent for this target" } };
    }
    // Limit reply depth to avoid abuse (max 5 levels)
    let depth = 1;
    let cur: string | null = parent.parentId ? String(parent.parentId) : null;
    while (cur) {
      depth += 1;
      if (depth > 5) return { status: 400, body: { error: "Reply thread too deep" } };
      const next = await prisma.comment.findUnique({ where: { id: cur }, select: { parentId: true } });
      cur = next?.parentId ? String(next.parentId) : null;
    }
  }

  const rawAttachments: unknown[] = Array.isArray(body?.attachments) ? (body.attachments as unknown[]) : [];
  const mediaIds: string[] = rawAttachments
    .map((a) => String((a as any)?.mediaId || (a as any)?.id || "").trim())
    .filter((v) => v.length > 0);

  const uniqueMediaIds: string[] = Array.from(new Set<string>(mediaIds)).slice(0, 3);

  const mediaRows = uniqueMediaIds.length
    ? await prisma.mediaObject.findMany({
        where: { id: { in: uniqueMediaIds } },
        select: mediaObjectSelect,
      })
    : [];

  if (mediaRows.length !== uniqueMediaIds.length) {
    return { status: 400, body: { error: "One or more attachments not found" } };
  }

  for (const m of mediaRows) {
    if (m.type !== "COMMENT_IMAGE" && m.type !== "COMMENT_GIF") {
      return { status: 400, body: { error: "Invalid attachment type" } };
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        targetType,
        targetId,
        userId: session.user.id,
        parentId: parentId || null,
        body: text,
        isSpoiler,
      },
    });

    if (mediaRows.length) {
      await tx.commentAttachment.createMany({
        data: mediaRows.map((m) => ({
          commentId: comment.id,
          mediaId: m.id,
          type: m.type === "COMMENT_GIF" ? "GIF" : "IMAGE",
        })),
        skipDuplicates: true,
      });
    }

    return tx.comment.findUnique({
      where: { id: comment.id },
      include: commentListInclude,
    });
  });

  // Side-effects are best-effort.
  try {
    if (created?.id) {
      await notifyCommentEvents({
        commentId: created.id,
        actorId: session.user.id,
        targetType,
        targetId,
        parentId: parentId || null,
        body: text,
      });
    }
  } catch (e) {
    console.error("notifyCommentEvents failed", e);
  }

  return { status: 201, body: { ok: true, comment: created } };
}
