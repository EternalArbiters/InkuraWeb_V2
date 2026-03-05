import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

function clampText(s: unknown): string {
  return String(s ?? "").trim();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const text = clampText(body?.body);
  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true, isHidden: true } });
  if (!c) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;

  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (c.isHidden && !isAdmin) return NextResponse.json({ error: "Comment is hidden" }, { status: 403 });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: text, editedAt: new Date() },
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

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true } });
  if (!c) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    // best effort: clear reports
    await tx.report.deleteMany({ where: { targetType: "COMMENT", targetId: commentId } });
    await tx.comment.delete({ where: { id: commentId } });
  });

  return NextResponse.json({ ok: true });
}
