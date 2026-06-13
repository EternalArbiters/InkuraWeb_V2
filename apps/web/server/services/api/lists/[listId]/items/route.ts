import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, forbidden, badRequest, notFound } from "@/server/http";
import { revalidatePublicReadingList } from "@/server/cache/publicContent";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
}

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ listId: string }> }) => {
  const { listId } = await params;

  const viewer = await getViewer();
  if (!viewer?.id) return unauthorized();

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, slug: true, ownerId: true },
  });
  if (!list) return notFound("List not found");

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return forbidden();

  const body = await req.json().catch(() => ({} as any));
  const workId = String(body?.workId || "").trim();
  if (!workId) return badRequest("workId required");

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, status: true } });
  if (!work || work.status !== "PUBLISHED") {
    return notFound("Work not found");
  }

  const last = await prisma.readingListItem.findFirst({
    where: { listId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextOrder = (last?.sortOrder ?? 0) + 1;

  try {
    await prisma.readingListItem.create({
      data: { listId, workId, sortOrder: nextOrder },
    });
  } catch (e: any) {
    // Unique constraint: already exists
    if (e?.code === "P2002") {
      await prisma.readingList.update({ where: { id: listId }, data: { updatedAt: new Date() } });
      revalidatePublicReadingList(list.slug);
      return json({ ok: true, added: false });
    }
    throw e;
  }

  // Touch list updatedAt so it rises to the top in /lists
  await prisma.readingList.update({ where: { id: listId }, data: { updatedAt: new Date() } });
  revalidatePublicReadingList(list.slug);

  return json({ ok: true, added: true });
});
