import "server-only";

import prisma from "@/server/db/prisma";
import { requireSessionUserId } from "@/server/http/auth";

export async function getViewerLibrary() {
  const userId = await requireSessionUserId();

  const [bookmarks, progress, favorites, lists] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        work: {
          select: {
            id: true,
            slug: true,
            title: true,
            coverImage: true,
            type: true,
            likeCount: true,
            ratingAvg: true,
            ratingCount: true,
            isMature: true,
            author: { select: { username: true, name: true } },
            translator: { select: { username: true, name: true } },
            publishType: true,
          },
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
      include: {
        work: {
          select: {
            id: true,
            slug: true,
            title: true,
            coverImage: true,
            type: true,
            likeCount: true,
            ratingAvg: true,
            ratingCount: true,
            isMature: true,
            updatedAt: true,
            author: { select: { username: true, name: true } },
            translator: { select: { username: true, name: true } },
            publishType: true,
          },
        },
      },
    }),
    prisma.readingList.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: [{ sortOrder: "desc" }, { addedAt: "desc" }],
          take: 8,
          include: {
            work: {
              select: {
                id: true,
                slug: true,
                title: true,
                coverImage: true,
                type: true,
                likeCount: true,
                ratingAvg: true,
                ratingCount: true,
                isMature: true,
                updatedAt: true,
                author: { select: { username: true, name: true } },
                translator: { select: { username: true, name: true } },
                publishType: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return { bookmarks, progress, favorites, lists };
}
