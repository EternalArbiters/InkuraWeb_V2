import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, adultConfirmed: true, deviantLoveConfirmed: true },
  });
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
      sourceUrl: true,
      uploaderNote: true,
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
        orderBy: [{ number: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          number: true,
          createdAt: true,
          isMature: true,
          warningTags: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!work || work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewer = await getViewer();
  const isOwner = !!viewer?.id && viewer.id === work.authorId;
  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove =
    isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  const requiresMatureGate = work.isMature && !canViewMature;
  const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  const hasLegacyDeviantGenre = Array.isArray(work.genres) && work.genres.some((g: any) => legacyDeviant.has(String(g.slug || "")));
  const hasDeviantTags = Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0;
  const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviantGenre) && !canViewDeviantLove;

  // If gated and viewer can't access, return only limited metadata.
  if (requiresMatureGate || requiresDeviantGate) {
    return NextResponse.json({
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

  // Viewer interactions (like/bookmark/rating)
  let viewerLiked = false;
  let viewerBookmarked = false;
  let viewerRating: number | null = null;
  if (viewer?.id) {
    const [like, bookmark, rating] = await Promise.all([
      prisma.workLike.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { userId: true } }),
      prisma.bookmark.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { userId: true } }),
      prisma.workRating.findUnique({ where: { userId_workId: { userId: viewer.id, workId: work.id } }, select: { value: true } }),
    ]);
    viewerLiked = !!like;
    viewerBookmarked = !!bookmark;
    viewerRating = rating?.value ?? null;
  }

  return NextResponse.json({
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
    interactions: {
      liked: viewerLiked,
      bookmarked: viewerBookmarked,
      myRating: viewerRating,
    },
    work,
  });
}
