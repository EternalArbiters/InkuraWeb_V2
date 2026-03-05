import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

type TargetType = "WORK" | "CHAPTER";

async function isWorkOwner(userId: string, targetType: TargetType, targetId: string) {
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({ where: { id: targetId }, select: { authorId: true } });
    return !!w && w.authorId === userId;
  }
  const ch = await prisma.chapter.findUnique({ where: { id: targetId }, select: { work: { select: { authorId: true } } } });
  return !!ch && ch.work.authorId === userId;
}

export async function POST(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const hide = body?.hide !== undefined ? !!body.hide : true;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isHidden: true, targetType: true, targetId: true },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const owner = await isWorkOwner(session.user.id, comment.targetType as TargetType, comment.targetId);
  if (!owner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      isHidden: hide,
      hiddenAt: hide ? new Date() : null,
      hiddenById: hide ? session.user.id : null,
    },
  });

  return NextResponse.json({ ok: true, isHidden: updated.isHidden });
}
