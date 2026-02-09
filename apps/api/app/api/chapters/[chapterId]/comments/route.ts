import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  // Determine if requester can moderate (ADMIN or work owner)
  let canModerate = false;
  if (userId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { work: { select: { authorId: true } } },
    });
    const isOwner = chapter?.work?.authorId === userId;
    const isAdmin = session?.user?.role === "ADMIN";
    canModerate = !!(isOwner || isAdmin);
  }

  const comments = await prisma.comment.findMany({
    where: {
      chapterId,
      ...(canModerate ? {} : { isHidden: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
    },
  });
  return NextResponse.json({ ok: true, canModerate, comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const text = String(body?.body || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      chapterId,
      userId: session.user.id,
      body: text,
    },
    include: { user: { select: { id: true, username: true, name: true, image: true } } },
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
