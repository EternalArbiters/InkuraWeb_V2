import "server-only";

import { getChapterDisplayTitle } from "@/lib/chapterLabel";
import prisma from "@/server/db/prisma";
import { safeCommentSort, type CommentSortMode } from "@/server/services/comments/tree";
import { safeReviewSort, type ReviewSortMode } from "@/server/services/reviews/listWorkReviews";

type ViewerReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isSpoiler: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  work: {
    title: string | null;
    slug: string | null;
  } | null;
};

type ChapterCommentContext = {
  id: string;
  number: number;
  title: string | null;
  label: string | null;
  work: {
    slug: string | null;
    title: string | null;
  } | null;
};

type WorkCommentContext = {
  id: string;
  slug: string | null;
  title: string | null;
};

export type ViewerCommentItem = {
  id: string;
  body: string;
  isSpoiler: boolean;
  isHidden: boolean;
  isReply: boolean;
  likeCount: number;
  dislikeCount: number;
  createdAt: Date;
  editedAt: Date | null;
  targetType: "WORK" | "CHAPTER";
  href: string | null;
  workTitle: string;
  contextLabel: string;
};

function clampTake(value: number | undefined, fallback: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(1, Math.min(100, Math.floor(next)));
}

function reviewOrderBy(sort: ReviewSortMode) {
  if (sort === "newest") return [{ createdAt: "desc" as const }, { id: "desc" as const }];
  if (sort === "oldest") return [{ createdAt: "asc" as const }, { id: "asc" as const }];
  if (sort === "top") return [{ rating: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
  if (sort === "bottom") return [{ rating: "asc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
  return [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
}

function commentOrderBy(sort: CommentSortMode) {
  if (sort === "oldest") return [{ createdAt: "asc" as const }, { id: "asc" as const }];
  if (sort === "top") return [{ likeCount: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
  if (sort === "bottom") return [{ likeCount: "asc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
  return [{ createdAt: "desc" as const }, { id: "desc" as const }];
}

export async function getViewerReviews(userId: string, options?: { sort?: unknown; take?: number }) {
  const sort = safeReviewSort(options?.sort);
  const take = clampTake(options?.take, 20);

  const [total, items] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.review.findMany({
      where: { userId },
      orderBy: reviewOrderBy(sort),
      take,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        isSpoiler: true,
        helpfulCount: true,
        createdAt: true,
        updatedAt: true,
        work: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    sort,
    items: items as ViewerReviewItem[],
  };
}

export async function getViewerComments(userId: string, options?: { sort?: unknown; take?: number }) {
  const sort = safeCommentSort(options?.sort);
  const take = clampTake(options?.take, 20);

  const [total, rawComments] = await Promise.all([
    prisma.comment.count({ where: { userId } }),
    prisma.comment.findMany({
      where: { userId },
      orderBy: commentOrderBy(sort),
      take,
      select: {
        id: true,
        body: true,
        isSpoiler: true,
        isHidden: true,
        parentId: true,
        likeCount: true,
        dislikeCount: true,
        createdAt: true,
        editedAt: true,
        targetType: true,
        targetId: true,
      },
    }),
  ]);

  const chapterIds = rawComments.filter((item) => item.targetType === "CHAPTER").map((item) => item.targetId);
  const workIds = rawComments.filter((item) => item.targetType === "WORK").map((item) => item.targetId);

  const [chapters, works] = await Promise.all([
    chapterIds.length
      ? prisma.chapter.findMany({
          where: { id: { in: chapterIds } },
          select: {
            id: true,
            number: true,
            title: true,
            label: true,
            work: {
              select: {
                slug: true,
                title: true,
              },
            },
          },
        })
      : Promise.resolve([] as ChapterCommentContext[]),
    workIds.length
      ? prisma.work.findMany({
          where: { id: { in: workIds } },
          select: {
            id: true,
            slug: true,
            title: true,
          },
        })
      : Promise.resolve([] as WorkCommentContext[]),
  ]);

  const chapterMap = new Map<string, ChapterCommentContext>(chapters.map((chapter) => [chapter.id, chapter]));
  const workMap = new Map<string, WorkCommentContext>(works.map((work) => [work.id, work]));

  const items: ViewerCommentItem[] = rawComments.map((item) => {
    if (item.targetType === "CHAPTER") {
      const chapter = chapterMap.get(item.targetId);
      const workTitle = chapter?.work?.title || "Untitled work";
      return {
        id: item.id,
        body: item.body,
        isSpoiler: item.isSpoiler,
        isHidden: item.isHidden,
        isReply: !!item.parentId,
        likeCount: item.likeCount,
        dislikeCount: item.dislikeCount,
        createdAt: item.createdAt,
        editedAt: item.editedAt,
        targetType: "CHAPTER",
        href: chapter?.work?.slug ? `/w/${chapter.work.slug}/read/${chapter.id}/comments` : null,
        workTitle,
        contextLabel: chapter
          ? `Chapter · ${getChapterDisplayTitle(chapter.number, chapter.title, chapter.label, { short: true })}`
          : "Chapter comment",
      };
    }

    const work = workMap.get(item.targetId);
    return {
      id: item.id,
      body: item.body,
      isSpoiler: item.isSpoiler,
      isHidden: item.isHidden,
      isReply: !!item.parentId,
      likeCount: item.likeCount,
      dislikeCount: item.dislikeCount,
      createdAt: item.createdAt,
      editedAt: item.editedAt,
      targetType: "WORK",
      href: work?.slug ? `/w/${work.slug}` : null,
      workTitle: work?.title || "Untitled work",
      contextLabel: "Work comment",
    };
  });

  return {
    total,
    sort,
    items,
  };
}
