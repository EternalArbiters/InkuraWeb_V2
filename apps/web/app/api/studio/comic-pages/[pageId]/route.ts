import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deletePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

async function renumberChapterPages(chapterId: string) {
  const pages = await prisma.comicPage.findMany({
    where: { chapterId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const ids = pages.map((p) => p.id);
  await prisma.$transaction([
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: -(i + 1) } })),
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: i + 1 } })),
  ]);
}

async function getMe(sessionUserId: string) {
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

function isOwnerOrAdmin(role: string, userId: string, ownerId: string) {
  return role === "ADMIN" || userId === ownerId;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = await prisma.comicPage.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      chapterId: true,
      imageUrl: true,
      imageKey: true,
      chapter: { select: { work: { select: { authorId: true } } } },
    },
  });

  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, page.chapter.work.authorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comicPage.delete({ where: { id: pageId } });

  // Best-effort delete from R2
  const keyOrUrl = page.imageKey || page.imageUrl;
  if (keyOrUrl) await deletePublicUpload(keyOrUrl);

  await renumberChapterPages(page.chapterId);

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const order = typeof body?.order === "number" ? body.order : parseInt(String(body?.order || ""), 10);

  if (!order || order < 1) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const page = await prisma.comicPage.findUnique({
    where: { id: pageId },
    select: { id: true, chapterId: true, chapter: { select: { work: { select: { authorId: true } } } } },
  });

  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, page.chapter.work.authorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comicPage.update({ where: { id: pageId }, data: { order } });
  await renumberChapterPages(page.chapterId);

  return NextResponse.json({ ok: true });
}
