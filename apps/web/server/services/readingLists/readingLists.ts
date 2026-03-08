import "server-only";

import { cache } from "react";
import prisma from "@/server/db/prisma";
import { workGridSelect } from "@/server/db/selectors";
import {
  PUBLIC_CONTENT_REVALIDATE,
  publicReadingListTag,
  publicReadingListsTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
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
    select: {
      id: true,
      slug: true,
      title: true,
      isPublic: true,
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

async function loadReadingListPageBaseBySlug(slug: string) {
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
              ...workGridSelect,
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
    items: Array.isArray(list.items)
      ? list.items.map((item: any) => ({
          id: item.id,
          addedAt: item.addedAt,
          sortOrder: item.sortOrder,
          work: item.work,
        }))
      : [],
  };
}

export async function getPublicReadingListPageDataBySlug(slug: string) {
  return withCachedPublicData(
    ["public-reading-list:v2", slug],
    [publicReadingListsTag(), publicReadingListTag(slug)],
    PUBLIC_CONTENT_REVALIDATE.readingList,
    async () => loadReadingListPageBaseBySlug(slug)
  );
}

export async function getViewerReadingListPayload(list: any, items: any[]) {
  const viewer = await getViewerBasic();
  const access = computeViewerAccess(viewer, list.ownerId);
  const isAdmin = viewer?.role === "ADMIN";

  if (!list.isPublic && !access.isOwner && !isAdmin) {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  const visibleItems = items.filter((item: any) => {
    const work = item.work;
    if (!work) return false;

    const requiresMatureGate = !!work.isMature && !access.canViewMature;
    const requiresDeviantGate = (workHasLegacyDeviantGenre(work.genres) || workHasDeviantLoveTags(work.deviantLoveTags)) && !access.canViewDeviantLove;

    return !(requiresMatureGate || requiresDeviantGate);
  });

  return {
    ok: true as const,
    items: visibleItems,
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

export async function getReadingListPageDataBySlug(slug: string) {
  const base = await getPublicReadingListPageDataBySlug(slug);
  if (!base.ok) return base;

  const viewerPayload = await getViewerReadingListPayload(base.list, base.items);
  if (!viewerPayload.ok) return viewerPayload;

  return {
    ok: true as const,
    list: base.list,
    items: viewerPayload.items,
    viewer: viewerPayload.viewer,
  };
}
