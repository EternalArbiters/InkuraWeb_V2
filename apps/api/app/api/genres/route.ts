import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uniqueGenreCatalog } from "@/lib/genreCatalog";

export const runtime = "nodejs";

function slugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureGenresSeeded() {
  const count = await prisma.genre.count();
  if (count > 0) return;
  const names = uniqueGenreCatalog();
  if (!names.length) return;
  await prisma.genre.createMany({
    data: names.map((name) => ({ name, slug: slugify(name) })),
    skipDuplicates: true,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  // If taxonomy is missing in a fresh DB (common on Vercel), seed it lazily.
  // This prevents "genre list empty" without requiring manual prisma seed.
  await ensureGenresSeeded();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q.toLowerCase(), mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const genres = await prisma.genre.findMany({
    where,
    orderBy: { name: "asc" },
    take,
    select: { id: true, name: true, slug: true, _count: { select: { works: true } } },
  });

  return NextResponse.json({ genres });
}
