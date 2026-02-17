import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, matureOptIn: true, adultConfirmed: true },
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
      chapterCount: true,
      warningTags: { select: { name: true, slug: true } },
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
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.matureOptIn);

  // If mature and viewer can't access, return only limited metadata.
  if (work.isMature && !canViewMature) {
    return NextResponse.json({
      gated: true,
      viewer: viewer
        ? {
            role: viewer.role,
            adultConfirmed: viewer.adultConfirmed,
            matureOptIn: viewer.matureOptIn,
            canViewMature,
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

  return NextResponse.json({
    gated: false,
    viewer: viewer
      ? {
          role: viewer.role,
          adultConfirmed: viewer.adultConfirmed,
          matureOptIn: viewer.matureOptIn,
          canViewMature,
          isOwner,
        }
      : null,
    work,
  });
}
