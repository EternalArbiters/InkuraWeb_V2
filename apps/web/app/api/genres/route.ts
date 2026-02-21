import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nsfwTagSlugs } from "@/lib/warningCatalog";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  // Genres should not include NSFW/18+ tags (they live in warningTags so they can be age-locked).
  const NSFW_SLUGS = nsfwTagSlugs();
  const DEVIANT_SLUGS = deviantLoveTagSlugs();
  // Also exclude comic-type labels (Manga/Manhwa/Manhua) from Genres.
  // They live in a separate ComicType filter.
  const COMIC_TYPE_SLUGS = ["manga", "manhwa", "manhua"];
  // Also exclude format labels that have their own filters.
  // Also exclude legacy labels that were moved out of Genres.
  const FORMAT_SLUGS = ["comic", "light-novel", "lgbtq", "bara-ml", "alpha-beta-omega"];
  const baseFilter: any = { slug: { notIn: [...NSFW_SLUGS, ...DEVIANT_SLUGS, ...COMIC_TYPE_SLUGS, ...FORMAT_SLUGS] } };

  const where: any = q
    ? {
        AND: [
          baseFilter,
          {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q.toLowerCase(), mode: "insensitive" as const } },
            ],
          },
        ],
      }
    : baseFilter;

  const genres = await prisma.genre.findMany({
    where,
    orderBy: { name: "asc" },
    take,
    select: { id: true, name: true, slug: true, _count: { select: { works: true } } },
  });

  return NextResponse.json({ genres });
}
