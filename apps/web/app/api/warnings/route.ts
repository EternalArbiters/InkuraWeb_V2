import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NSFW_TAG_CATALOG, slugifyTag } from "@/lib/warningCatalog";

let ensured = false;

async function ensureNsfwTagsExist() {
  if (ensured) return;
  const wanted = NSFW_TAG_CATALOG.map((name) => ({ name, slug: slugifyTag(name) })).filter((x) => x.slug);
  const slugs = wanted.map((x) => x.slug);
  if (!slugs.length) {
    ensured = true;
    return;
  }

  try {
    const existing = await prisma.warningTag.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const have = new Set(existing.map((x) => x.slug));
    const missing = wanted.filter((x) => !have.has(x.slug));
    if (missing.length) {
      await prisma.warningTag.createMany({
        data: missing.map((x) => ({ name: x.name, slug: x.slug })),
        skipDuplicates: true,
      });
    }
  } finally {
    ensured = true;
  }
}

export async function GET(req: Request) {
  // Make the endpoint robust for existing DBs that still have NSFW tags in genres.
  // This ensures NSFW tags are present in WarningTag without requiring a manual reseed.
  await ensureNsfwTagsExist();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "100", 10) || 100));

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q.toLowerCase(), mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const warningTags = await prisma.warningTag.findMany({
    where,
    orderBy: { name: "asc" },
    take,
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ warningTags });
}
