import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nsfwTagSlugs } from "@/lib/warningCatalog";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  // Genres should not include NSFW/18+ tags (they live in warningTags so they can be age-locked).
  const NSFW_SLUGS = nsfwTagSlugs();
  // Also exclude comic-type labels (Manga/Manhwa/Manhua) from Genres.
  // They live in a separate ComicType filter.
  const COMIC_TYPE_SLUGS = ["manga", "manhwa", "manhua"];
  const baseFilter: any = { slug: { notIn: [...NSFW_SLUGS, ...COMIC_TYPE_SLUGS] } };

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
