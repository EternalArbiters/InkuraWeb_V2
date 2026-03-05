import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    include: {
      owner: { select: { id: true, username: true, name: true } },
      _count: { select: { items: true } },
      items: {
        orderBy: [{ sortOrder: "asc" }, { addedAt: "desc" }],
        where: { work: { status: "PUBLISHED" } },
        include: {
          work: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverImage: true,
              type: true,
              publishType: true,
              isMature: true,
              language: true,
              comicType: true,
              likeCount: true,
              ratingAvg: true,
              ratingCount: true,
              author: { select: { username: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ list });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, ownerId: true },
  });

  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const title = body?.title != null ? String(body.title).trim() : undefined;
  const description = body?.description != null ? String(body.description) : undefined;
  const isPublic = typeof body?.isPublic === "boolean" ? body.isPublic : undefined;

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
  }

  const updated = await prisma.readingList.update({
    where: { id: listId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ ok: true, list: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, ownerId: true },
  });

  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.readingList.delete({ where: { id: listId } });
  return NextResponse.json({ ok: true });
}
