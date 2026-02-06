import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { saveCoverUpload } from "@/lib/upload";

export const runtime = "nodejs";

function safeJsonArray(v: unknown): string[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

function safeBool(v: unknown) {
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "1" || s === "true" || s === "yes" || s === "on";
  }
  return false;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const works = await prisma.work.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ works });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fd = await req.formData();
    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const type = String(fd.get("type") || "NOVEL").toUpperCase();

    const language = String(fd.get("language") || "unknown").toLowerCase().trim() || "unknown";
    const origin = String(fd.get("origin") || "UNKNOWN").toUpperCase().trim() || "UNKNOWN";
    const completion = String(fd.get("completion") || "ONGOING").toUpperCase().trim() || "ONGOING";
    const isMature = safeBool(fd.get("isMature"));

    const genreIds = safeJsonArray(fd.get("genreIds"));
    const warningTagIds = safeJsonArray(fd.get("warningTagIds"));
    const tagNames = safeJsonArray(fd.get("tags"));

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const base = slugify(title);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    let coverImage: string | null = null;
    const cover = fd.get("cover");
    if (cover && typeof cover !== "string") {
      const file = cover as File;
      if (file.size > 0) {
        const saved = await saveCoverUpload(file, "covers");
        coverImage = saved.url;
      }
    }

    const work = await prisma.work.create({
      data: {
        slug,
        title,
        description: description || null,
        type: type === "COMIC" ? "COMIC" : "NOVEL",
        status: "DRAFT",
        coverImage,
        authorId: session.user.id,

        language,
        origin: origin as any,
        completion: completion as any,
        isMature,

        genres: genreIds.length ? { connect: genreIds.map((id) => ({ id })) } : undefined,
        warningTags: warningTagIds.length ? { connect: warningTagIds.map((id) => ({ id })) } : undefined,
        tags: tagNames.length
          ? {
              connectOrCreate: tagNames.slice(0, 50).map((name) => {
                const slug = slugify(name);
                return {
                  where: { slug },
                  create: { name, slug },
                };
              }),
            }
          : undefined,
      },
    });

    return NextResponse.json({ ok: true, work }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
