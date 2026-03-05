import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
}

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ listId: string; workId: string }> }) => {
  const { listId, workId } = await params;

  const viewer = await getViewer();
  if (!viewer?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.readingList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) return json({ error: "List not found" }, { status: 404 });

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return json({ error: "Forbidden" }, { status: 403 });

  await prisma.readingListItem.deleteMany({ where: { listId, workId } });
  await prisma.readingList.update({ where: { id: listId }, data: { updatedAt: new Date() } });

  return json({ ok: true });
});
