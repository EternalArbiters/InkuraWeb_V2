import "server-only";

import prisma from "@/server/db/prisma";
import { chapterListItemSelect, comicPageSelect, nameSlugSelect, userPublicSelect } from "@/server/db/selectors";
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

export async function getPublishedChapterReaderData(chapterId: string): Promise<ReadChapterResult> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      workId: true,
      title: true,
      number: true,
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
    return { ok: false, status: 404, error: "Not found" };
  }

  const viewer = await getViewerBasic();
  const viewerLiked = viewer?.id
    ? !!(await prisma.chapterLike.findUnique({ where: { userId_chapterId: { userId: viewer.id, chapterId } } }))
    : false;

  const gate = computeChapterGate({
    viewer,
    work: {
      authorId: chapter.work.authorId,
      isMature: !!chapter.work.isMature,
      genres: (chapter.work as any).genres,
      deviantLoveTags: chapter.work.deviantLoveTags,
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
      ok: true,
      gated: true,
      gateReason: gate.gateReason,
      viewer: viewerOut,
      work: {
        id: chapter.work.id,
        slug: chapter.work.slug,
        title: chapter.work.title,
        type: chapter.work.type,
        isMature: chapter.work.isMature,
        publishType: (chapter.work as any).publishType,
        author: (chapter.work as any).author,
        translator: (chapter.work as any).translator,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        isMature: chapter.isMature,
        likeCount: chapter.likeCount,
        viewerLiked,
        authorNote: chapter.authorNote,
      },
    };
  }

  return {
    ok: true,
    gated: false,
    viewer: viewerOut,
    chapter: {
      id: chapter.id,
      title: chapter.title,
      number: chapter.number,
      warningTags: chapter.warningTags,
      text: chapter.text,
      pages: chapter.pages,
      isMature: chapter.isMature,
      likeCount: chapter.likeCount,
      viewerLiked,
      authorNote: chapter.authorNote ?? null,
    },
    work: {
      id: chapter.work.id,
      slug: chapter.work.slug,
      title: chapter.work.title,
      type: chapter.work.type,
      isMature: chapter.work.isMature,
      publishType: (chapter.work as any).publishType,
      author: (chapter.work as any).author,
      translator: (chapter.work as any).translator,
      warningTags: chapter.work.warningTags,
      deviantLoveTags: chapter.work.deviantLoveTags,
      chapters: chapter.work.chapters,
    },
  };
}
