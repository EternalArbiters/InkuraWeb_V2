import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";
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

  const list = await prisma.readingList.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, name: true } },
      _count: { select: { items: true } },
      items: {
        orderBy: [{ sortOrder: "asc" }, { addedAt: "desc" }],
        where: { work: { status: "PUBLISHED" } },
        include: {
          work: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverImage: true,
              type: true,
              publishType: true,
              isMature: true,
              language: true,
              comicType: true,
              likeCount: true,
              ratingAvg: true,
              ratingCount: true,
              author: { select: { username: true, name: true } },
              genres: { select: { slug: true } },
              deviantLoveTags: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewer = await getViewer();
  const isOwner = !!viewer?.id && viewer.id === list.ownerId;
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  if (!list.isPublic && !isOwner && viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);

  const items = Array.isArray(list.items) ? list.items : [];
  const visibleItems = items.filter((it: any) => {
    const w = it.work;
    if (!w) return false;

    const requiresMatureGate = !!w.isMature && !canViewMature;

    const hasLegacyDeviantGenre =
      Array.isArray(w.genres) && w.genres.some((g: any) => legacyDeviant.has(String(g.slug || "")));
    const hasDeviantTags = Array.isArray(w.deviantLoveTags) && w.deviantLoveTags.length > 0;
    const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviantGenre) && !canViewDeviantLove;

    return !(requiresMatureGate || requiresDeviantGate);
  });

  return NextResponse.json({
    list: {
      id: list.id,
      slug: list.slug,
      title: list.title,
      description: list.description,
      isPublic: list.isPublic,
      ownerId: list.ownerId,
      owner: list.owner,
      itemCount: list._count.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    },
    items: visibleItems.map((it: any) => ({
      id: it.id,
      addedAt: it.addedAt,
      sortOrder: it.sortOrder,
      work: it.work,
    })),
    viewer: viewer
      ? {
          id: viewer.id,
          role: viewer.role,
          adultConfirmed: viewer.adultConfirmed,
          deviantLoveConfirmed: viewer.deviantLoveConfirmed,
          canViewMature,
          canViewDeviantLove,
          isOwner,
        }
      : null,
  });
}
