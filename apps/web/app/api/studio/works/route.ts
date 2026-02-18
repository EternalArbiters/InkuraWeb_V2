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

function roleToPublishType(creatorRole: string): "ORIGINAL" | "TRANSLATION" | "REUPLOAD" {
  const r = (creatorRole || "").toUpperCase();
  if (r === "TRANSLATOR") return "TRANSLATION";
  if (r === "UPLOADER") return "REUPLOAD";
  return "ORIGINAL";
}

async function getCreator(sessionUserId: string) {
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, creatorRole: true },
  });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "ADMIN" && me.creatorRole === "READER") {
    return NextResponse.json({ error: "Creator role required" }, { status: 403 });
  }

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
  if (me.role !== "ADMIN" && me.creatorRole === "READER") {
    return NextResponse.json({ error: "Creator role required" }, { status: 403 });
  }

  try {
    const ct = req.headers.get("content-type") || "";

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

    let publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" = roleToPublishType(me.creatorRole);
    let originalAuthorCredit: string | null = null;
    let sourceUrl: string | null = null;
    let uploaderNote: string | null = null;

    // R2 cover (preferred): presigned upload on client, then commit here.
    let coverImage: string | null = null;
    let coverKey: string | null = null;

    // fallback: upload via server (still writes to R2)
    let coverFile: File | null = null;

    if (ct.includes("application/json")) {
      const body = await req.json();
      title = String(body?.title || "").trim();
      description = String(body?.description || "").trim();
      type = String(body?.type || "NOVEL").toUpperCase();
      comicType = safeComicType(body?.comicType);

      language = String(body?.language || "unknown").toLowerCase().trim() || "unknown";
      origin = String(body?.origin || "UNKNOWN").toUpperCase().trim() || "UNKNOWN";
      completion = String(body?.completion || "ONGOING").toUpperCase().trim() || "ONGOING";
      isMature = safeBool(body?.isMature);

      genreIds = toStringArray(body?.genreIds);
      warningTagIds = toStringArray(body?.warningTagIds);
      tagNames = toStringArray(body?.tags);

      if (me.role === "ADMIN") {
        const pt = String(body?.publishType || "").toUpperCase();
        if (pt === "ORIGINAL" || pt === "TRANSLATION" || pt === "REUPLOAD") publishType = pt as any;
      }

      originalAuthorCredit = String(body?.originalAuthorCredit || "").trim() || null;
      sourceUrl = String(body?.sourceUrl || "").trim() || null;
      uploaderNote = String(body?.uploaderNote || "").trim() || null;

      coverImage = String(body?.coverUrl || body?.coverImage || "").trim() || null;
      coverKey = String(body?.coverKey || "").trim() || null;
    } else {
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

      if (me.role === "ADMIN") {
        const pt = String(fd.get("publishType") || "").toUpperCase();
        if (pt === "ORIGINAL" || pt === "TRANSLATION" || pt === "REUPLOAD") publishType = pt as any;
      }

      originalAuthorCredit = String(fd.get("originalAuthorCredit") || "").trim() || null;
      sourceUrl = String(fd.get("sourceUrl") || "").trim() || null;
      uploaderNote = String(fd.get("uploaderNote") || "").trim() || null;

      coverImage = String(fd.get("coverUrl") || fd.get("coverImage") || "").trim() || null;
      coverKey = String(fd.get("coverKey") || "").trim() || null;

      const cover = fd.get("cover");
      if (cover && typeof cover !== "string") {
        const file = cover as File;
        if (file.size > 0) coverFile = file;
      }
    }

    // Enforce publishType by creator role (except admin)
    if (me.role !== "ADMIN") {
      publishType = roleToPublishType(me.creatorRole);
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (publishType === "TRANSLATION" || publishType === "REUPLOAD") {
      if (!originalAuthorCredit) {
        return NextResponse.json({ error: "Original author credit is required" }, { status: 400 });
      }
      if (!sourceUrl) {
        return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
      }
    }

    const base = slugify(title);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    const work = await prisma.work.create({
      data: {
        slug,
        title,
        description: description || null,
        type: type === "COMIC" ? "COMIC" : "NOVEL",
        comicType: type === "COMIC" ? comicType : "UNKNOWN",
        status: "DRAFT",
        coverImage,
        coverKey,
        authorId: session.user.id,

        language,
        origin: origin as any,
        completion: completion as any,
        isMature,

        publishType: publishType as any,
        translatorId: publishType === "TRANSLATION" ? session.user.id : null,
        originalAuthorCredit,
        sourceUrl,
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

    // Fallback: upload cover via server and update work.
    if (coverFile) {
      const saved = await saveCoverUpload(coverFile, "covers", { userId: session.user.id, workId: work.id });
      await prisma.work.update({ where: { id: work.id }, data: { coverImage: saved.url, coverKey: saved.key } });
    }

    const full = await prisma.work.findUnique({ where: { id: work.id } });

    return NextResponse.json({ ok: true, work: full }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
