import "server-only";

import prisma from "@/server/db/prisma";
import { workGridSelect } from "@/server/db/selectors";
import { requireSessionUserId } from "@/server/http/auth";
import { profileHotspot } from "@/server/observability/profiling";

function attachChapterLoveCounts<T extends { id: string }>(works: T[], chapterLoveMap: Map<string, number>) {
  return works.map((work) => ({
    ...work,
    chapterLoveCount: chapterLoveMap.get(work.id) ?? 0,
  }));
}

export async function getViewerLibrary() {
  const userId = await requireSessionUserId();

  const [bookmarks, progress, favorites, lists] = await profileHotspot("library.viewer", { sections: 4 }, () => Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        work: {
          select: workGridSelect,
        },
      },
    }),
    prisma.readingProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        work: { select: { id: true, slug: true, title: true, coverImage: true, type: true } },
        chapter: { select: { id: true, number: true, label: true, title: true } },
      },
    }),
    prisma.workLike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        work: {
          select: workGridSelect,
        },
      },
    }),
    prisma.readingList.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublic: true,
        updatedAt: true,
        _count: { select: { items: true } },
        items: {
          orderBy: [{ sortOrder: "desc" }, { addedAt: "desc" }],
          take: 8,
          select: {
            id: true,
            sortOrder: true,
            addedAt: true,
            work: {
              select: workGridSelect,
            },
          },
        },
      },
    }),
  ]));

  const workIds = Array.from(
    new Set(
      [
        ...bookmarks.map((entry: any) => entry.work?.id),
        ...favorites.map((entry: any) => entry.work?.id),
        ...lists.flatMap((list: any) => (Array.isArray(list.items) ? list.items.map((item: any) => item.work?.id) : [])),
      ].filter(Boolean)
    )
  ) as string[];

  const chapterLoveRows = workIds.length
    ? await profileHotspot("library.chapterLoveSums", { workCount: workIds.length }, () =>
        prisma.chapter.groupBy({
          by: ["workId"],
          where: { workId: { in: workIds }, status: "PUBLISHED" },
          _sum: { likeCount: true },
        })
      )
    : [];
  const chapterLoveMap = new Map(chapterLoveRows.map((row: any) => [row.workId, Number(row._sum?.likeCount ?? 0)]));

  return {
    bookmarks: bookmarks.map((entry: any) => ({ ...entry, work: entry.work ? attachChapterLoveCounts([entry.work], chapterLoveMap)[0] : entry.work })),
    progress,
    favorites: favorites.map((entry: any) => ({ ...entry, work: entry.work ? attachChapterLoveCounts([entry.work], chapterLoveMap)[0] : entry.work })),
    lists: lists.map((list: any) => ({
      ...list,
      items: Array.isArray(list.items)
        ? list.items.map((item: any) => ({ ...item, work: item.work ? attachChapterLoveCounts([item.work], chapterLoveMap)[0] : item.work }))
        : list.items,
    })),
  };
}
