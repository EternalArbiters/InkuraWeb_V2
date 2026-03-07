import "server-only";

import prisma from "@/server/db/prisma";

export type ViewerWorkInteractions = {
  likedIds: Set<string>;
  bookmarkedIds: Set<string>;
};

export function emptyViewerWorkInteractions(): ViewerWorkInteractions {
  return {
    likedIds: new Set<string>(),
    bookmarkedIds: new Set<string>(),
  };
}

export async function getViewerWorkInteractions(
  userId: string,
  workIds: Iterable<string>
): Promise<ViewerWorkInteractions> {
  const ids = Array.from(new Set(Array.from(workIds).filter(Boolean)));
  if (ids.length === 0) return emptyViewerWorkInteractions();

  const [likes, bookmarks] = await Promise.all([
    prisma.workLike.findMany({
      where: { userId, workId: { in: ids } },
      select: { workId: true },
    }),
    prisma.bookmark.findMany({
      where: { userId, workId: { in: ids } },
      select: { workId: true },
    }),
  ]);

  return {
    likedIds: new Set(likes.map((entry) => entry.workId)),
    bookmarkedIds: new Set(bookmarks.map((entry) => entry.workId)),
  };
}

export function applyViewerWorkInteractions<T extends { id: string }>(
  works: T[],
  interactions: ViewerWorkInteractions
): Array<T & { viewerFavorited: boolean; viewerBookmarked: boolean }> {
  return works.map((work) => ({
    ...work,
    viewerFavorited: interactions.likedIds.has(work.id),
    viewerBookmarked: interactions.bookmarkedIds.has(work.id),
  }));
}
