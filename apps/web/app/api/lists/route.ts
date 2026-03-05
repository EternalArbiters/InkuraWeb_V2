import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
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

  return json({ lists });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const title = String(body?.title || "").trim();
  const description = body?.description == null ? null : String(body.description);
  const isPublic = !!body?.isPublic;

  if (!title) {
    return json({ error: "title required" }, { status: 400 });
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

  return json({ ok: true, list }, { status: 201 });
});
