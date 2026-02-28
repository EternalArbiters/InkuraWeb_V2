import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lists = await prisma.readingList.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: 3,
        select: {
          work: { select: { id: true, slug: true, title: true, coverImage: true } },
        },
      },
    },
  });

  return NextResponse.json({ lists });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const title = String(body?.title || "").trim();
  const description = body?.description == null ? null : String(body.description);
  const isPublic = !!body?.isPublic;

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const baseSlug = slugify(title) || "list";
  let slug = baseSlug;

  for (let i = 0; i < 8; i++) {
    const exists = await prisma.readingList.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) break;
    const suffix = Math.random().toString(36).slice(2, 6);
    slug = `${baseSlug}-${suffix}`;
  }

  const list = await prisma.readingList.create({
    data: {
      ownerId: session.user.id,
      slug,
      title,
      description: description || null,
      isPublic,
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ ok: true, list }, { status: 201 });
}
