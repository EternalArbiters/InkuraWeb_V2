import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const text = body?.body !== undefined ? String(body.body).trim() : null;
  const isSpoiler = body?.isSpoiler !== undefined ? !!body.isSpoiler : null;

  if (text !== null && !text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (text !== null && text.length > 2000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const existing = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true } });
  if (!existing) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = existing.userId === session.user.id;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(text !== null ? { body: text, editedAt: new Date() } : {}),
      ...(isSpoiler !== null ? { isSpoiler } : {}),
    },
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: { include: { media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } } } },
    },
  });

  return NextResponse.json({ ok: true, comment: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true } });
  if (!existing) return NextResponse.json({ ok: true });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = existing.userId === session.user.id;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
