import "server-only";

import prisma from "@/server/db/prisma";
import { publicUrlForKey } from "@/server/uploads/upload";
import {
  PUBLIC_CONTENT_REVALIDATE,
  publicWorkTag,
  publicWorksTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import { computeWorkGate } from "@/server/services/works/gating";
import { getViewerBasic } from "@/server/services/works/viewer";
import { profileHotspot } from "@/server/observability/profiling";

function stablePick(id: string, candidates: string[]) {
  if (!candidates.length) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return candidates[h % candidates.length] || null;
}

function resolveChapterThumb(ch: any) {
  const img = typeof ch.thumbnailImage === "string" ? ch.thumbnailImage.trim() : "";
  if (img) return img;
  const key = typeof ch.thumbnailKey === "string" ? ch.thumbnailKey.trim() : "";
  if (key) return publicUrlForKey(key);
  const candidates = Array.isArray(ch.pages) ? ch.pages.map((p: any) => String(p.imageUrl || "").trim()).filter(Boolean) : [];
  return stablePick(String(ch.id), candidates);
}

export type WorkPageResult =
  | {
      ok: false;
      status: 404;
      error: "Not found";
    }
  | {
      ok: true;
      gated: true;
      gateReason: "MATURE" | "DEVIANT_LOVE" | "BOTH";
      viewer: any;
      work: any;
    }
  | {
      ok: true;
      gated: false;
      viewer: any;
      progress: { lastReadChapterNumber: number | null };
      interactions: { liked: boolean; bookmarked: boolean; myRating: number | null };
      work: any;
    };

async function loadPublicWorkPageDataBySlug(slug: string) {
  const work = await prisma.work.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      type: true,
      comicType: true,
      status: true,
      isMature: true,
      language: true,
      origin: true,
      completion: true,
      publishType: true,
      originalAuthorCredit: true,
      originalTranslatorCredit: true,
      sourceUrl: true,
      uploaderNote: true,
      translatorCredit: true,
      companyCredit: true,
      prevArcUrl: true,
      nextArcUrl: true,
      seriesId: true,
      seriesOrder: true,
      series: {
        select: {
          id: true,
          title: true,
          works: {
            where: { status: "PUBLISHED" },
            orderBy: [{ seriesOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              slug: true,
              title: true,
              coverImage: true,
              seriesOrder: true,
            },
          },
        },
      },
      likeCount: true,
      ratingAvg: true,
      ratingCount: true,
      chapterCount: true,
      createdAt: true,
      updatedAt: true,
      warningTags: { select: { name: true, slug: true } },
      deviantLoveTags: { select: { name: true, slug: true } },
      genres: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
      authorId: true,
      author: { select: { username: true, name: true } },
      translator: { select: { username: true, name: true } },
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: [{ number: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          number: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          isMature: true,
          thumbnailImage: true,
          thumbnailKey: true,
          thumbnailFocusX: true,
          thumbnailFocusY: true,
          thumbnailZoom: true,
          pages: {
            orderBy: { order: "asc" },
            take: 3,
            select: { imageUrl: true },
          },
          warningTags: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!work || work.status !== "PUBLISHED") {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  const visibleChapters = Array.isArray(work.chapters)
    ? work.chapters.map((chapter: any) => ({
        ...chapter,
        thumbnailUrl: resolveChapterThumb(chapter),
      }))
    : [];

  const seriesWorks = Array.isArray(work.series?.works)
    ? work.series.works.filter((item: any) => String(item.id) !== String(work.id))
    : [];

  const orderedSeries = Array.isArray(work.series?.works) ? work.series.works : [];
  const currentIndex = orderedSeries.findIndex((item: any) => String(item.id) === String(work.id));
  const previousSeriesWork = currentIndex > 0 ? orderedSeries[currentIndex - 1] : null;
  const nextSeriesWork = currentIndex >= 0 && currentIndex < orderedSeries.length - 1 ? orderedSeries[currentIndex + 1] : null;

  const previousArc = previousSeriesWork
    ? { href: `/w/${previousSeriesWork.slug}`, title: previousSeriesWork.title, coverImage: previousSeriesWork.coverImage, label: "Previous Arc" }
    : work.prevArcUrl
      ? { href: work.prevArcUrl, title: "Previous Arc", coverImage: null, label: "Previous Arc" }
      : null;

  const nextArc = nextSeriesWork
    ? { href: `/w/${nextSeriesWork.slug}`, title: nextSeriesWork.title, coverImage: nextSeriesWork.coverImage, label: "Next Arc" }
    : work.nextArcUrl
      ? { href: work.nextArcUrl, title: "Next Arc", coverImage: null, label: "Next Arc" }
      : null;

  return {
    ok: true as const,
    work: {
      ...work,
      chapters: visibleChapters,
      seriesTitle: work.series?.title || null,
      seriesWorks,
      previousArc,
      nextArc,
    },
  };
}

export async function getPublicWorkPageDataBySlug(slug: string) {
  return withCachedPublicData(
    ["public-work-page:v2", slug],
    [publicWorksTag(), publicWorkTag(slug)],
    PUBLIC_CONTENT_REVALIDATE.work,
    async () => profileHotspot("workPage.public", { slug }, () => loadPublicWorkPageDataBySlug(slug))
  );
}

export async function getViewerWorkPagePayload(work: any) {
  const viewer = await profileHotspot("workPage.viewerPayload", { workId: work.id, chapterCount: Array.isArray(work.chapters) ? work.chapters.length : 0 }, () => getViewerBasic());
  const gate = computeWorkGate({
    viewer,
    work: {
      authorId: work.authorId,
      isMature: !!work.isMature,
      genres: work.genres,
      deviantLoveTags: work.deviantLoveTags,
    },
  });

  const viewerOut = viewer
    ? {
        role: viewer.role,
        adultConfirmed: viewer.adultConfirmed,
        deviantLoveConfirmed: viewer.deviantLoveConfirmed,
        canViewMature: gate.canViewMature,
        canViewDeviantLove: gate.canViewDeviantLove,
        isOwner: gate.isOwner,
      }
    : null;

  if (gate.gateReason) {
    return {
      gated: true as const,
      gateReason: gate.gateReason,
      viewer: viewerOut,
      work: {
        id: work.id,
        slug: work.slug,
        title: work.title,
        coverImage: work.coverImage,
        type: work.type,
        comicType: work.comicType,
        isMature: work.isMature,
        authorId: work.authorId,
        author: work.author,
      },
    };
  }

  let viewerLiked = false;
  let viewerBookmarked = false;
  let viewerRating: number | null = null;
  let lastReadChapterNumber: number | null = null;

  if (viewer?.id) {
    const [like, bookmark, rating, progress] = await Promise.all([
      prisma.workLike.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { userId: true } }),
      prisma.bookmark.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { userId: true } }),
      prisma.workRating.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { value: true } }),
      prisma.readingProgress.findUnique({
        where: { userId_workId: { userId: viewer.id, workId: work.id } },
        select: { chapter: { select: { number: true } } },
      }),
    ]);

    viewerLiked = !!like;
    viewerBookmarked = !!bookmark;
    viewerRating = rating?.value ?? null;
    lastReadChapterNumber = progress?.chapter?.number ?? null;
  }

  return {
    gated: false as const,
    viewer: viewerOut,
    progress: { lastReadChapterNumber },
    interactions: {
      liked: viewerLiked,
      bookmarked: viewerBookmarked,
      myRating: viewerRating,
    },
  };
}

export async function getWorkPageDataBySlug(slug: string): Promise<WorkPageResult> {
  const base = await getPublicWorkPageDataBySlug(slug);
  if (!base.ok) return base;

  const viewerPayload = await getViewerWorkPagePayload(base.work);
  if (viewerPayload.gated) {
    return {
      ok: true,
      gated: true,
      gateReason: viewerPayload.gateReason,
      viewer: viewerPayload.viewer,
      work: viewerPayload.work,
    };
  }

  return {
    ok: true,
    gated: false,
    viewer: viewerPayload.viewer,
    progress: viewerPayload.progress,
    interactions: viewerPayload.interactions,
    work: base.work,
  };
}
