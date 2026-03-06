import "server-only";

import prisma from "@/server/db/prisma";
import { NSFW_TAG_CATALOG, slugifyTag } from "@/lib/warningCatalog";
import { getActiveWarningTagsBase } from "@/server/cache/taxonomy";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

let ensured = false;

async function ensureNsfwTagsExist() {
  if (ensured) return;
  const wanted = NSFW_TAG_CATALOG.map((name, idx) => ({ name, slug: slugifyTag(name), sortOrder: idx * 10 })).filter((x) => x.slug);
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
        data: missing.map((x) => ({ name: x.name, slug: x.slug, isSystem: true, isActive: true, sortOrder: x.sortOrder })),
        skipDuplicates: true,
      });
    }
  } finally {
    ensured = true;
  }
}

export const GET = async (req: Request) => {
  // Make the endpoint robust for existing DBs that still have NSFW tags in genres.
  // This ensures NSFW tags are present in WarningTag without requiring a manual reseed.
  await ensureNsfwTagsExist();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "100", 10) || 100));

  const base = await getActiveWarningTagsBase();
  const qLower = q.toLowerCase();
  const filtered = q
    ? base.filter((t) => t.name.toLowerCase().includes(qLower) || t.slug.toLowerCase().includes(qLower))
    : base;

  const warningTags = filtered.slice(0, take).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));

  return json(
    { warningTags },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
};
