import "server-only";

import prisma from "@/server/db/prisma";
import { deletePublicUpload } from "@/server/uploads/upload";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

async function setChapterPageOrder(ids: string[]) {
  if (!ids.length) return;
  await prisma.$transaction([
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: -(i + 1) } })),
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: i + 1 } })),
  ]);
}

async function renumberChapterPages(chapterId: string) {
  const pages = await prisma.comicPage.findMany({
    where: { chapterId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  await setChapterPageOrder(pages.map((p) => p.id));
}

async function getMe(sessionUserId: string) {
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

function isOwnerOrAdmin(role: string, userId: string, ownerId: string) {
  return role === "ADMIN" || userId === ownerId;
}

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ pageId: string }> }) => {
  const { pageId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

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

  if (!page) return json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, page.chapter.work.authorId)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comicPage.delete({ where: { id: pageId } });

  // Best-effort delete from R2
  const keyOrUrl = page.imageKey || page.imageUrl;
  if (keyOrUrl) await deletePublicUpload(keyOrUrl);

  await renumberChapterPages(page.chapterId);

  return json({ ok: true });
});

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ pageId: string }> }) => {
  const { pageId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const order = typeof body?.order === "number" ? body.order : parseInt(String(body?.order || ""), 10);

  if (!order || order < 1) return json({ error: "Invalid order" }, { status: 400 });

  const page = await prisma.comicPage.findUnique({
    where: { id: pageId },
    select: { id: true, chapterId: true, chapter: { select: { work: { select: { authorId: true } } } } },
  });

  if (!page) return json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, page.chapter.work.authorId)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const chapterPages = await prisma.comicPage.findMany({
    where: { chapterId: page.chapterId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const ids = chapterPages.map((item) => item.id);
  const currentIndex = ids.indexOf(pageId);
  if (currentIndex === -1) return json({ error: "Not found" }, { status: 404 });

  const targetIndex = Math.max(0, Math.min(ids.length - 1, order - 1));
  const [picked] = ids.splice(currentIndex, 1);
  ids.splice(targetIndex, 0, picked);
  await setChapterPageOrder(ids);

  return json({ ok: true });
});
