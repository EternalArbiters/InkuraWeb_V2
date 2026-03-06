import "server-only";

import prisma from "@/server/db/prisma";
import { uniqueDeviantLoveCatalog } from "@/lib/deviantLoveCatalog";
import { slugify } from "@/lib/slugify";
import { getActiveDeviantLoveTagsBase } from "@/server/cache/taxonomy";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

let ensured = false;

async function ensureDeviantLoveTagsExist() {
  if (ensured) return;
  try {
    const names = uniqueDeviantLoveCatalog();
    const wanted = names.map((name, idx) => ({ name, slug: slugify(name), sortOrder: idx * 10 })).filter((x) => x.slug);
    const slugs = wanted.map((x) => x.slug);
    if (!slugs.length) return;

    const existing = await prisma.deviantLoveTag.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
    const have = new Set(existing.map((x) => x.slug));
    const missing = wanted.filter((x) => !have.has(x.slug));
    if (missing.length) {
      await prisma.deviantLoveTag.createMany({
        data: missing.map((x) => ({ name: x.name, slug: x.slug, isSystem: true, isActive: true, sortOrder: x.sortOrder })),
        skipDuplicates: true,
      });
    }
  } finally {
    ensured = true;
  }
}

export const GET = async (req: Request) => {
  // Ensure base tags exist for older DBs.
  await ensureDeviantLoveTagsExist();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  const base = await getActiveDeviantLoveTagsBase();
  const qLower = q.toLowerCase();
  const filtered = q
    ? base.filter((t) => t.name.toLowerCase().includes(qLower) || t.slug.toLowerCase().includes(qLower))
    : base;

  const deviantLoveTags = filtered.slice(0, take).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));

  return json(
    { deviantLoveTags },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
};
