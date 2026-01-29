import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const hide = body?.hide !== undefined ? !!body.hide : true;
  const note = String(body?.reason || "").trim().slice(0, 200);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isHidden: true, chapter: { select: { work: { select: { authorId: true } } } } },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const isOwner = comment.chapter.work.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      isHidden: hide,
      hiddenAt: hide ? new Date() : null,
      hiddenById: hide ? session.user.id : null,
      // store moderation note in the related reports using resolver note; keep minimal here
    },
  });

  return NextResponse.json({ ok: true, isHidden: updated.isHidden, note });
}
