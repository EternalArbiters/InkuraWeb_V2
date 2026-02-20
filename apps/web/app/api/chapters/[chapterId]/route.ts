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
    select: { id: true, role: true, adultConfirmed: true },
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
          warningTags: { select: { name: true, slug: true } },
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
  const isOwner = !!viewer?.id && viewer.id === chapter.work.authorId;
  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);

  const requiresMature = (chapter.work.isMature || chapter.isMature) && !canViewMature;

  if (requiresMature) {
    return NextResponse.json({
      gated: true,
      viewer: viewer
        ? {
            role: viewer.role,
            adultConfirmed: viewer.adultConfirmed,
            canViewMature,
            isOwner,
          }
        : null,
      work: {
        id: chapter.work.id,
        slug: chapter.work.slug,
        title: chapter.work.title,
        type: chapter.work.type,
        isMature: chapter.work.isMature,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        isMature: chapter.isMature,
      },
    });
  }

  return NextResponse.json({
    gated: false,
    viewer: viewer
      ? {
          role: viewer.role,
          adultConfirmed: viewer.adultConfirmed,
          canViewMature,
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
    },
    work: {
      id: chapter.work.id,
      slug: chapter.work.slug,
      title: chapter.work.title,
      type: chapter.work.type,
      isMature: chapter.work.isMature,
      warningTags: chapter.work.warningTags,
      chapters: chapter.work.chapters,
    },
  });
}
