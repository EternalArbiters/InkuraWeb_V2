import "server-only";

import prisma from "@/server/db/prisma";
import { deletePublicUpload } from "@/server/uploads/upload";
import { getSession } from "@/server/auth/session";
import { json } from "@/server/http";


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

export const DELETE = async (_req: Request, { params }: { params: Promise<{ pageId: string }> }) => {
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
};
export const PATCH = async (req: Request, { params }: { params: Promise<{ pageId: string }> }) => {
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

  await prisma.comicPage.update({ where: { id: pageId }, data: { order } });
  await renumberChapterPages(page.chapterId);

  return json({ ok: true });
};
