import "server-only";

import { cache } from "react";
import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { getViewerBasic } from "@/server/services/works/viewer";
import { computeViewerAccess, workHasDeviantLoveTags, workHasLegacyDeviantGenre } from "@/server/services/works/gating";

export const listReadingListsForViewer = cache(async function listReadingListsForViewer() {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return null;

  const lists = await prisma.readingList.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: 3,
        select: {
          work: { select: { id: true, slug: true, title: true, coverImage: true } },
        },
      },
    },
  });

  return { lists };
});

export async function listReadingListOptionsForViewer() {
  const data = await listReadingListsForViewer();
  if (!data) return null;

  return data.lists.map((list) => ({
    id: list.id,
    slug: list.slug,
    title: list.title,
    isPublic: list.isPublic,
    _count: { items: list._count?.items ?? 0 },
  }));
}

export async function getReadingListPageDataBySlug(slug: string) {
  const list = await prisma.readingList.findUnique({
    where: { slug },
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
              genres: { select: { slug: true } },
              deviantLoveTags: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  if (!list) {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  const viewer = await getViewerBasic();
  const access = computeViewerAccess(viewer, list.ownerId);
  const isAdmin = viewer?.role === "ADMIN";

  if (!list.isPublic && !access.isOwner && !isAdmin) {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  const items = Array.isArray(list.items) ? list.items : [];
  const visibleItems = items.filter((item: any) => {
    const work = item.work;
    if (!work) return false;

    const requiresMatureGate = !!work.isMature && !access.canViewMature;
    const requiresDeviantGate = (workHasLegacyDeviantGenre(work.genres) || workHasDeviantLoveTags(work.deviantLoveTags)) && !access.canViewDeviantLove;

    return !(requiresMatureGate || requiresDeviantGate);
  });

  return {
    ok: true as const,
    list: {
      id: list.id,
      slug: list.slug,
      title: list.title,
      description: list.description,
      isPublic: list.isPublic,
      ownerId: list.ownerId,
      owner: list.owner,
      itemCount: list._count.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    },
    items: visibleItems.map((item: any) => ({
      id: item.id,
      addedAt: item.addedAt,
      sortOrder: item.sortOrder,
      work: item.work,
    })),
    viewer: viewer
      ? {
          id: viewer.id,
          role: viewer.role,
          adultConfirmed: viewer.adultConfirmed,
          deviantLoveConfirmed: viewer.deviantLoveConfirmed,
          canViewMature: access.canViewMature,
          canViewDeviantLove: access.canViewDeviantLove,
          isOwner: access.isOwner,
        }
      : null,
  };
}
