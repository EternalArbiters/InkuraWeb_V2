import "server-only";

import prisma from "@/server/db/prisma";
import { chapterListItemSelect, comicPageSelect, nameSlugSelect, userPublicSelect } from "@/server/db/selectors";
import {
  PUBLIC_CONTENT_REVALIDATE,
  publicChapterTag,
  publicWorksTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import { computeChapterGate } from "@/server/services/works/gating";
import { getViewerBasic } from "@/server/services/works/viewer";

export type ReadChapterResult =
  | { ok: false; status: 404; error: "Not found" }
  | {
      ok: true;
      gated: boolean;
      gateReason?: "MATURE" | "DEVIANT_LOVE" | "BOTH";
      viewer: any;
      work: any;
      chapter: any;
    };

function mapChapterReaderPayload(chapter: any) {
  return {
    ok: true as const,
    chapter: {
      id: chapter.id,
      title: chapter.title,
      number: chapter.number,
      label: chapter.label,
      warningTags: chapter.warningTags,
      text: chapter.text,
      pages: chapter.pages,
      isMature: chapter.isMature,
      likeCount: chapter.likeCount,
      authorNote: chapter.authorNote ?? null,
      status: chapter.status,
    },
    work: {
      id: chapter.work.id,
      slug: chapter.work.slug,
      title: chapter.work.title,
      type: chapter.work.type,
      isMature: chapter.work.isMature,
      publishType: chapter.work.publishType,
      authorId: chapter.work.authorId,
      author: chapter.work.author,
      translator: chapter.work.translator,
      warningTags: chapter.work.warningTags,
      deviantLoveTags: chapter.work.deviantLoveTags,
      genres: chapter.work.genres,
      chapters: chapter.work.chapters,
      status: chapter.work.status,
    },
  };
}

async function loadPublicChapterReaderData(chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      workId: true,
      title: true,
      number: true,
      label: true,
      status: true,
      isMature: true,
      likeCount: true,
      authorNote: true,
      warningTags: { select: nameSlugSelect },
      text: { select: { content: true } },
      pages: { orderBy: { order: "asc" }, select: comicPageSelect },
      work: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          type: true,
          publishType: true,
          isMature: true,
          authorId: true,
          author: { select: userPublicSelect },
          translator: { select: userPublicSelect },
          warningTags: { select: nameSlugSelect },
          deviantLoveTags: { select: nameSlugSelect },
          genres: { select: { slug: true } },
          chapters: {
            where: { status: "PUBLISHED" },
            orderBy: [{ number: "asc" }, { createdAt: "asc" }],
            select: chapterListItemSelect,
          },
        },
      },
    },
  });

  if (!chapter || chapter.status !== "PUBLISHED" || chapter.work.status !== "PUBLISHED") {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  return mapChapterReaderPayload(chapter);
}

async function loadAdminChapterReaderData(chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      workId: true,
      title: true,
      number: true,
      label: true,
      status: true,
      isMature: true,
      likeCount: true,
      authorNote: true,
      warningTags: { select: nameSlugSelect },
      text: { select: { content: true } },
      pages: { orderBy: { order: "asc" }, select: comicPageSelect },
      work: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          type: true,
          publishType: true,
          isMature: true,
          authorId: true,
          author: { select: userPublicSelect },
          translator: { select: userPublicSelect },
          warningTags: { select: nameSlugSelect },
          deviantLoveTags: { select: nameSlugSelect },
          genres: { select: { slug: true } },
          chapters: {
            orderBy: [{ number: "asc" }, { createdAt: "asc" }],
            select: chapterListItemSelect,
          },
        },
      },
    },
  });

  if (!chapter) {
    return { ok: false as const, status: 404 as const, error: "Not found" as const };
  }

  return mapChapterReaderPayload(chapter);
}

export async function getPublicChapterReaderData(chapterId: string) {
  return withCachedPublicData(
    ["public-chapter-reader:v2", chapterId],
    [publicWorksTag(), publicChapterTag(chapterId)],
    PUBLIC_CONTENT_REVALIDATE.chapter,
    async () => loadPublicChapterReaderData(chapterId)
  );
}

export async function getViewerChapterReaderPayload(chapterId: string, work: any, chapter: any) {
  const viewer = await getViewerBasic();
  const viewerLiked = viewer?.id
    ? !!(await prisma.chapterLike.findUnique({ where: { userId_chapterId: { userId: viewer.id, chapterId } } }))
    : false;

  const gate = computeChapterGate({
    viewer,
    work: {
      authorId: work.authorId,
      isMature: !!work.isMature,
      genres: work.genres,
      deviantLoveTags: work.deviantLoveTags,
    },
    chapter: { isMature: !!chapter.isMature },
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
        type: work.type,
        isMature: work.isMature,
        publishType: work.publishType,
        author: work.author,
        translator: work.translator,
        status: work.status,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        label: chapter.label,
        title: chapter.title,
        isMature: chapter.isMature,
        likeCount: chapter.likeCount,
        viewerLiked,
        authorNote: chapter.authorNote,
        status: chapter.status,
      },
    };
  }

  return {
    gated: false as const,
    viewer: viewerOut,
    chapter: {
      ...chapter,
      viewerLiked,
    },
    work,
  };
}

export async function getChapterReaderData(chapterId: string): Promise<ReadChapterResult> {
  const viewer = await getViewerBasic();
  const base = viewer?.role === "ADMIN" ? await loadAdminChapterReaderData(chapterId) : await getPublicChapterReaderData(chapterId);
  if (!base.ok) return base;

  const viewerPayload = await getViewerChapterReaderPayload(chapterId, base.work, base.chapter);
  if (viewerPayload.gated) {
    return {
      ok: true,
      gated: true,
      gateReason: viewerPayload.gateReason,
      viewer: viewerPayload.viewer,
      work: viewerPayload.work,
      chapter: viewerPayload.chapter,
    };
  }

  return {
    ok: true,
    gated: false,
    viewer: viewerPayload.viewer,
    chapter: viewerPayload.chapter,
    work: viewerPayload.work,
  };
}


export async function getPublishedChapterReaderData(chapterId: string): Promise<ReadChapterResult> {
  return getChapterReaderData(chapterId);
}
