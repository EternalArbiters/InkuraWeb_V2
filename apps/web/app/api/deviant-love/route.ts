import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uniqueDeviantLoveCatalog } from "@/lib/deviantLoveCatalog";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

let ensured = false;

async function ensureDeviantLoveTagsExist() {
  if (ensured) return;
  try {
    const names = uniqueDeviantLoveCatalog();
    const wanted = names.map((name) => ({ name, slug: slugify(name) })).filter((x) => x.slug);
    const slugs = wanted.map((x) => x.slug);
    if (!slugs.length) return;

    const existing = await prisma.deviantLoveTag.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
    const have = new Set(existing.map((x) => x.slug));
    const missing = wanted.filter((x) => !have.has(x.slug));
    if (missing.length) {
      await prisma.deviantLoveTag.createMany({
        data: missing.map((x) => ({ name: x.name, slug: x.slug })),
        skipDuplicates: true,
      });
    }
  } finally {
    ensured = true;
  }
}

export async function GET(req: Request) {
  // Ensure base tags exist for older DBs.
  await ensureDeviantLoveTagsExist();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q.toLowerCase(), mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const deviantLoveTags = await prisma.deviantLoveTag.findMany({
    where,
    orderBy: { name: "asc" },
    take,
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ deviantLoveTags });
}
