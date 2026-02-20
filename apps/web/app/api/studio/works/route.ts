import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { saveCoverUpload } from "@/lib/upload";

export const runtime = "nodejs";

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    const raw = v.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      // ignore
    }
  }
  return [];
}

function safeBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "1" || s === "true" || s === "yes" || s === "on";
  }
  return false;
}

function safeComicType(v: unknown): "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER" {
  const s = String(v || "UNKNOWN").toUpperCase().trim();
  if (s === "MANGA" || s === "MANHWA" || s === "MANHUA" || s === "WEBTOON" || s === "WESTERN" || s === "OTHER") return s;
  return "UNKNOWN";
}

async function getCreator(sessionUserId: string) {
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1" || url.searchParams.get("scope") === "all";

  const works = await prisma.work.findMany({
    where: me.role === "ADMIN" && all ? {} : { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, type: true, status: true, updatedAt: true, publishType: true, authorId: true },
  });

  return NextResponse.json({ works });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ct = req.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      return NextResponse.json(
        { error: "Use multipart/form-data for create work (cover upload required)." },
        { status: 400 }
      );
    }

    let title = "";
    let description = "";
    let type = "NOVEL";
    let comicType: any = "UNKNOWN";

    let language = "unknown";
    let origin = "UNKNOWN";
    let completion = "ONGOING";
    let isMature = false;

    let genreIds: string[] = [];
    let warningTagIds: string[] = [];
    let tagNames: string[] = [];

    let publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" = "ORIGINAL";
    let originalAuthorCredit: string | null = null;
    let sourceUrl: string | null = null;
    let uploaderNote: string | null = null;

    // v14: cover upload is required at creation (max 2MB). Server uploads to R2.
    let coverFile: File | null = null;

    {
      const fd = await req.formData();
      title = String(fd.get("title") || "").trim();
      description = String(fd.get("description") || "").trim();
      type = String(fd.get("type") || "NOVEL").toUpperCase();
      comicType = safeComicType(fd.get("comicType"));

      language = String(fd.get("language") || "unknown").toLowerCase().trim() || "unknown";
      origin = String(fd.get("origin") || "UNKNOWN").toUpperCase().trim() || "UNKNOWN";
      completion = String(fd.get("completion") || "ONGOING").toUpperCase().trim() || "ONGOING";
      isMature = safeBool(fd.get("isMature"));

      genreIds = toStringArray(fd.get("genreIds"));
      warningTagIds = toStringArray(fd.get("warningTagIds"));
      tagNames = toStringArray(fd.get("tags"));

      const pt = String(fd.get("publishType") || "ORIGINAL").toUpperCase();
      if (pt === "ORIGINAL" || pt === "TRANSLATION" || pt === "REUPLOAD") publishType = pt as any;

      originalAuthorCredit = String(fd.get("originalAuthorCredit") || "").trim() || null;
      sourceUrl = String(fd.get("sourceUrl") || "").trim() || null;
      uploaderNote = String(fd.get("uploaderNote") || "").trim() || null;

      const cover = fd.get("cover");
      if (cover && typeof cover !== "string") {
        const file = cover as File;
        if (file.size > 0) coverFile = file;
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!coverFile) {
      return NextResponse.json({ error: "Cover is required (max 2MB)." }, { status: 400 });
    }
    if (coverFile.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Cover too large (max 2MB)." }, { status: 400 });
    }

    if (publishType === "TRANSLATION") {
      if (!originalAuthorCredit) return NextResponse.json({ error: "Original author credit is required" }, { status: 400 });
      if (!sourceUrl) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }
    if (publishType === "REUPLOAD") {
      if (!sourceUrl) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    const base = slugify(title);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    // Create first (so we can build a stable R2 key using workId), then upload cover, then update.
    const work = await prisma.work.create({
      data: {
        slug,
        title,
        description: description || null,
        type: type === "COMIC" ? "COMIC" : "NOVEL",
        comicType: type === "COMIC" ? comicType : "UNKNOWN",
        status: "DRAFT",
        coverImage: null,
        coverKey: null,
        authorId: session.user.id,

        language,
        origin: origin as any,
        completion: completion as any,
        isMature,

        publishType: publishType as any,
        translatorId: publishType === "TRANSLATION" ? session.user.id : null,
        originalAuthorCredit: publishType === "ORIGINAL" ? null : originalAuthorCredit,
        sourceUrl: publishType === "ORIGINAL" ? null : sourceUrl,
        uploaderNote: publishType === "REUPLOAD" ? uploaderNote : null,

        genres: genreIds.length ? { connect: genreIds.map((id) => ({ id })) } : undefined,
        warningTags: warningTagIds.length ? { connect: warningTagIds.map((id) => ({ id })) } : undefined,
        tags: tagNames.length
          ? {
              connectOrCreate: tagNames.slice(0, 50).map((name) => {
                const s = slugify(name);
                return { where: { slug: s }, create: { name, slug: s } };
              }),
            }
          : undefined,
      },
      select: { id: true, slug: true },
    });

    try {
      const saved = await saveCoverUpload(coverFile, "covers", { userId: session.user.id, workId: work.id });
      await prisma.work.update({ where: { id: work.id }, data: { coverImage: saved.url, coverKey: saved.key } });
    } catch (err) {
      // Avoid leaving orphan draft if cover upload fails.
      await prisma.work.delete({ where: { id: work.id } }).catch(() => {});
      throw err;
    }

    const full = await prisma.work.findUnique({ where: { id: work.id } });

    return NextResponse.json({ ok: true, work: full }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
