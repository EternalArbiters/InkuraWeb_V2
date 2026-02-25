// Deprecated (v16): chapter comments are now polymorphic via /api/comments.
// This route is kept for backward compatibility.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

async function canModerate(session: any, chapterId: string) {
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  const ch = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { work: { select: { authorId: true } } } });
  return !!ch && ch.work.authorId === session.user.id;
}

export async function GET(_req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  const canMod = await canModerate(session, chapterId);

  const comments = await prisma.comment.findMany({
    where: {
      targetType: "CHAPTER",
      targetId: chapterId,
      ...(canMod ? {} : { isHidden: false }),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: { include: { media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } } } },
    },
  });

  return NextResponse.json({ ok: true, canModerate: canMod, comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const text = String(body?.body || "").trim();
  const isSpoiler = !!body?.isSpoiler;
  const attachments: unknown[] = Array.isArray(body?.attachments) ? (body.attachments as unknown[]) : [];

  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const ch = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!ch) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const mediaIds: string[] = attachments
    .map((a) => String((a as any)?.mediaId || (a as any)?.id || "").trim())
    .filter((v) => v.length > 0);
  const uniqueMediaIds: string[] = Array.from(new Set<string>(mediaIds)).slice(0, 3);
  const mediaRows = uniqueMediaIds.length
    ? await prisma.mediaObject.findMany({ where: { id: { in: uniqueMediaIds } }, select: { id: true, type: true } })
    : [];

  if (mediaRows.length !== uniqueMediaIds.length) {
    return NextResponse.json({ error: "One or more attachments not found" }, { status: 400 });
  }
  for (const m of mediaRows) {
    if (m.type !== "COMMENT_IMAGE" && m.type !== "COMMENT_GIF") {
      return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        targetType: "CHAPTER",
        targetId: chapterId,
        userId: session.user.id,
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
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        attachments: { include: { media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } } } },
      },
    });
  });

  return NextResponse.json({ ok: true, comment: created }, { status: 201 });
}
