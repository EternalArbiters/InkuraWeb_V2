import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, forbidden, notFound, badRequest } from "@/server/http";
import { revalidatePublicReadingList } from "@/server/cache/publicContent";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
}

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ listId: string }> }) => {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return unauthorized();

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
              author: { select: { username: true, name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!list) return notFound();

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return forbidden();
  }

  return json({ list });
});

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ listId: string }> }) => {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return unauthorized();

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, slug: true, ownerId: true },
  });

  if (!list) return notFound();

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return forbidden();

  const body = await req.json().catch(() => ({} as any));
  const title = body?.title != null ? String(body.title).trim() : undefined;
  const description = body?.description != null ? String(body.description) : undefined;
  const isPublic = typeof body?.isPublic === "boolean" ? body.isPublic : undefined;

  if (title !== undefined && !title) {
    return badRequest("title cannot be empty");
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

  revalidatePublicReadingList(updated.slug);
  return json({ ok: true, list: updated });
});

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ listId: string }> }) => {
  const { listId } = await params;
  const viewer = await getViewer();
  if (!viewer?.id) return unauthorized();

  const list = await prisma.readingList.findUnique({
    where: { id: listId },
    select: { id: true, slug: true, ownerId: true },
  });

  if (!list) return notFound();

  const isOwner = list.ownerId === viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin) return forbidden();

  await prisma.readingList.delete({ where: { id: listId } });
  revalidatePublicReadingList(list.slug);
  return json({ ok: true });
});
