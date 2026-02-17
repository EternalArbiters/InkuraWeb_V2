import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uniqueWarningCatalog } from "@/lib/warningCatalog";

export const runtime = "nodejs";

function slugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureWarningsSeeded() {
  const count = await prisma.warningTag.count();
  if (count > 0) return;
  const names = uniqueWarningCatalog();
  if (!names.length) return;
  await prisma.warningTag.createMany({
    data: names.map((name) => ({ name, slug: slugify(name) })),
    skipDuplicates: true,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "100", 10) || 100));

  // If taxonomy is missing in a fresh DB (common on Vercel), seed it lazily.
  await ensureWarningsSeeded();

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
