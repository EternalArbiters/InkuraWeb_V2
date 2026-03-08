import "server-only";

import prisma from "@/server/db/prisma";
import { workGridSelect } from "@/server/db/selectors";
import { requireSessionUserId } from "@/server/http/auth";
import { profileHotspot } from "@/server/observability/profiling";

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
        chapter: { select: { id: true, number: true, title: true } },
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

  return { bookmarks, progress, favorites, lists };
}
