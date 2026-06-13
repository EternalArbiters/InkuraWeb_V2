import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { commentListInclude } from "@/server/db/selectors";
import { apiRoute, json, unauthorized, badRequest, notFound } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const runtime = "nodejs";

async function canModerate(session: any, chapterId: string) {
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  const ch = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { work: { select: { authorId: true } } } });
  return !!ch && ch.work.authorId === session.user.id;
}

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const session = await getSession();
  const canMod = await canModerate(session, chapterId);
  const comments = await prisma.comment.findMany({
    where: { targetType: "CHAPTER", targetId: chapterId, ...(canMod ? {} : { isHidden: false }) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    include: commentListInclude,
  });
  return json({ ok: true, canModerate: canMod, comments });
});

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ chapterId: string }> }) => {
  const { chapterId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const limited = await enforceRateLimitOrResponse({ req, policyName: "comment.create", userId: session.user.id });
  if (limited) return limited;

  const body = await req.json().catch(() => ({} as any));
  const text = String(body?.body || "").trim();
  const isSpoiler = !!body?.isSpoiler;
  const attachments: unknown[] = Array.isArray(body?.attachments) ? body.attachments : [];
  if (!text) return badRequest("Comment body is required");
  if (text.length > 2000) return badRequest("Comment too long");

  const ch = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!ch) return notFound("Chapter not found");

  const mediaIds = attachments.map((a) => String((a as any)?.mediaId || (a as any)?.id || "").trim()).filter(Boolean);
  const uniqueMediaIds = Array.from(new Set<string>(mediaIds)).slice(0, 3);
  const mediaRows = uniqueMediaIds.length ? await prisma.mediaObject.findMany({ where: { id: { in: uniqueMediaIds } }, select: { id: true, type: true } }) : [];
  if (mediaRows.length !== uniqueMediaIds.length) return badRequest("One or more attachments not found");
  for (const m of mediaRows) {
    if (m.type !== "COMMENT_IMAGE" && m.type !== "COMMENT_GIF") return badRequest("Invalid attachment type");
  }

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({ data: { targetType: "CHAPTER", targetId: chapterId, userId: session.user.id, body: text, isSpoiler } });
    if (mediaRows.length) {
      await tx.commentAttachment.createMany({
        data: mediaRows.map((m) => ({ commentId: comment.id, mediaId: m.id, type: m.type === "COMMENT_GIF" ? "GIF" : "IMAGE" })),
        skipDuplicates: true,
      });
    }
    return tx.comment.findUnique({ where: { id: comment.id }, include: commentListInclude });
  });

  await trackAnalyticsEventSafe({
    req,
    eventType: "COMMENT_CREATE",
    userId: session.user.id,
    chapterId,
    path: req.url,
    routeName: "chapter.comment.create",
    metadata: { isSpoiler, attachmentCount: mediaRows.length },
  });

  return json({ ok: true, comment: created }, { status: 201 });
});
