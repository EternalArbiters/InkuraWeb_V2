import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
}

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;

  const viewer = await getViewer();
  if (!viewer?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, ownerId: true },
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const workId = String(body?.workId || "").trim();
  if (!workId) return NextResponse.json({ error: "workId required" }, { status: 400 });

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, status: true } });
  if (!work || work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Work not found" }, { status: 404 });
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
      return NextResponse.json({ ok: true, added: false });
    }
    throw e;
  }

  // Touch list updatedAt so it rises to the top in /lists
  await prisma.readingList.update({ where: { id: listId }, data: { updatedAt: new Date() } });

  return NextResponse.json({ ok: true, added: true });
}
