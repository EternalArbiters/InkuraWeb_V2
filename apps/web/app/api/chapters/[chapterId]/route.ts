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

export async function GET(_req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;

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
      warningTags: { select: { name: true, slug: true } },
      text: { select: { content: true } },
      pages: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
      work: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          type: true,
          isMature: true,
          authorId: true,
          author: { select: { id: true, username: true, name: true, image: true } },
          warningTags: { select: { name: true, slug: true } },
          deviantLoveTags: { select: { name: true, slug: true } },
          genres: { select: { slug: true } },
          chapters: {
            where: { status: "PUBLISHED" },
            orderBy: [{ number: "asc" }, { createdAt: "asc" }],
            select: { id: true, number: true, title: true },
          },
        },
      },
    },
  });

  if (!chapter || chapter.status !== "PUBLISHED" || chapter.work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewer = await getViewer();
  const viewerLiked = viewer?.id
    ? !!(await prisma.chapterLike.findUnique({ where: { userId_chapterId: { userId: viewer.id, chapterId } } }))
    : false;
  const isOwner = !!viewer?.id && viewer.id === chapter.work.authorId;
  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove =
    isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  const requiresMature = (chapter.work.isMature || chapter.isMature) && !canViewMature;
  const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  const hasLegacyDeviantGenre = Array.isArray((chapter.work as any).genres) && (chapter.work as any).genres.some((g: any) => legacyDeviant.has(String(g.slug || "")));
  const hasDeviantTags = Array.isArray(chapter.work.deviantLoveTags) && chapter.work.deviantLoveTags.length > 0;
  const requiresDeviant = (hasDeviantTags || hasLegacyDeviantGenre) && !canViewDeviantLove;

  if (requiresMature || requiresDeviant) {
    return NextResponse.json({
      gated: true,
      gateReason: requiresMature && requiresDeviant ? "BOTH" : requiresDeviant ? "DEVIANT_LOVE" : "MATURE",
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
        id: chapter.work.id,
        slug: chapter.work.slug,
        title: chapter.work.title,
        type: chapter.work.type,
        isMature: chapter.work.isMature,
        author: (chapter.work as any).author || null,
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
    });
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
      authorNote: chapter.authorNote,
    },
    work: {
      id: chapter.work.id,
      slug: chapter.work.slug,
      title: chapter.work.title,
      type: chapter.work.type,
      isMature: chapter.work.isMature,
      author: (chapter.work as any).author || null,
      warningTags: chapter.work.warningTags,
      deviantLoveTags: chapter.work.deviantLoveTags,
      chapters: chapter.work.chapters,
    },
  });
}
