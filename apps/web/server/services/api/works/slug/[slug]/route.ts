import "server-only";

import prisma from "@/server/db/prisma";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import { publicUrlForKey } from "@/server/uploads/upload";
import { getSession } from "@/server/auth/session";
import { json } from "@/server/http";


async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, adultConfirmed: true, deviantLoveConfirmed: true },
  });
  return user;
}

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

export const GET = async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const viewer = await getViewer();

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
          // Thumbnail candidates
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
    return json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = !!viewer?.id && viewer.id === work.authorId;
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  const requiresMatureGate = !!work.isMature && !canViewMature;
  const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  const hasLegacyDeviantGenre = Array.isArray(work.genres) && work.genres.some((g: any) => legacyDeviant.has(String(g.slug || "")));
  const hasDeviantTags = Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0;
  const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviantGenre) && !canViewDeviantLove;

  if (requiresMatureGate || requiresDeviantGate) {
    return json({
      gated: true,
      gateReason: requiresMatureGate && requiresDeviantGate ? "BOTH" : requiresDeviantGate ? "DEVIANT_LOVE" : "MATURE",
      viewer: viewer
        ? {
            role: viewer.role,
            adultConfirmed: viewer.adultConfirmed,
            deviantLoveConfirmed: viewer.deviantLoveConfirmed,
            canViewMature,
            canViewDeviantLove,
            isOwner,
          }
        : null,
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
    });
  }

  // Viewer interactions
  let viewerLiked = false;
  let viewerBookmarked = false;
  let viewerRating: number | null = null;

  // Viewer reading progress
  let lastReadChapterNumber: number | null = null;

  if (viewer?.id) {
    const [like, bookmark, rating, prog] = await Promise.all([
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
    lastReadChapterNumber = prog?.chapter?.number ?? null;
  }

  const visibleChapters = Array.isArray(work.chapters)
    ? work.chapters
        .filter((c: any) => (isOwner || viewer?.role === "ADMIN") ? true : c.status === "PUBLISHED")
        .map((c: any) => ({
          ...c,
          thumbnailUrl: resolveChapterThumb(c),
        }))
    : [];

  const workOut = {
    ...work,
    chapters: visibleChapters,
  };

  return json({
    gated: false,
    viewer: viewer
      ? {
          role: viewer.role,
          adultConfirmed: viewer.adultConfirmed,
          deviantLoveConfirmed: viewer.deviantLoveConfirmed,
          canViewMature,
          canViewDeviantLove,
          isOwner,
        }
      : null,
    progress: { lastReadChapterNumber },
    interactions: {
      liked: viewerLiked,
      bookmarked: viewerBookmarked,
      myRating: viewerRating,
    },
    work: workOut,
  });
};
