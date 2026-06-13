import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, forbidden, notFound } from "@/server/http";
import { revalidatePublicReadingList } from "@/server/cache/publicContent";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
}

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ listId: string; workId: string }> }) => {
  const { listId, workId } = await params;

  const viewer = await getViewer();
  if (!viewer?.id) return unauthorized();

  const list = await prisma.readingList.findUnique({ where: { id: listId }, select: { slug: true, ownerId: true } });
  if (!list) return notFound("List not found");

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return forbidden();

  await prisma.readingListItem.deleteMany({ where: { listId, workId } });
  await prisma.readingList.update({ where: { id: listId }, data: { updatedAt: new Date() } });
  revalidatePublicReadingList(list.slug);

  return json({ ok: true });
});
