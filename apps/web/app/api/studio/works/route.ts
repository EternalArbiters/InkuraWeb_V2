import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";
import { slugify } from "@/lib/slugify";
import { saveCoverUpload } from "@/server/uploads/upload";

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
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1" || url.searchParams.get("scope") === "all";

  const works = await prisma.work.findMany({
    where: me.role === "ADMIN" && all ? {} : { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      status: true,
      updatedAt: true,
      publishType: true,
      authorId: true,
      coverImage: true,
    },
  });

  return NextResponse.json({ works });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data for create work" }, { status: 400 });
    }

    const fd = await req.formData();

    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "").trim();

    const typeRaw = String(fd.get("type") || "NOVEL").toUpperCase().trim();
    const type: "NOVEL" | "COMIC" = typeRaw === "COMIC" ? "COMIC" : "NOVEL";
    const comicType = safeComicType(fd.get("comicType"));

    const language = String(fd.get("language") || "unknown").toLowerCase().trim() || "unknown";
    const origin = String(fd.get("origin") || "UNKNOWN").toUpperCase().trim() || "UNKNOWN";
    const completion = String(fd.get("completion") || "ONGOING").toUpperCase().trim() || "ONGOING";
    const isMature = safeBool(fd.get("isMature"));

    const genreIds = toStringArray(fd.get("genreIds"));
    const warningTagIds = toStringArray(fd.get("warningTagIds"));
    const deviantLoveTagIds = toStringArray(fd.get("deviantLoveTagIds"));
    const tagNames = toStringArray(fd.get("tags"));

    const pt = String(fd.get("publishType") || "ORIGINAL").toUpperCase().trim();
    const publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" = (pt === "TRANSLATION" || pt === "REUPLOAD") ? (pt as any) : "ORIGINAL";

    const originalAuthorCredit = String(fd.get("originalAuthorCredit") || "").trim() || null;
    const originalTranslatorCredit = String(fd.get("originalTranslatorCredit") || "").trim() || null;
    const sourceUrl = String(fd.get("sourceUrl") || "").trim() || null;
    const uploaderNote = String(fd.get("uploaderNote") || "").trim() || null;

    const translatorCredit = String(fd.get("translatorCredit") || "").trim() || null;
    const companyCredit = String(fd.get("companyCredit") || "").trim() || null;

    const cover = fd.get("cover");
    const coverFile = cover && typeof cover !== "string" ? (cover as File) : null;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!coverFile || coverFile.size <= 0) return NextResponse.json({ error: "Cover is required (max 2MB)." }, { status: 400 });
    if (coverFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Cover too large (max 2MB)." }, { status: 400 });

    const needsSource = publishType !== "ORIGINAL";
    if (needsSource) {
      if (!originalAuthorCredit) return NextResponse.json({ error: "Original author credit is required" }, { status: 400 });
      if (!sourceUrl) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    if (publishType === "REUPLOAD") {
      if (!originalTranslatorCredit) {
        return NextResponse.json({ error: "Original translator credit is required for Reupload" }, { status: 400 });
      }
    }

    const base = slugify(title);
    const suffix = Math.random().toString(36).slice(2, 8);
    const slug = `${base}-${suffix}`;

    const created = await prisma.work.create({
      data: {
        slug,
        title,
        description: description || null,
        type,
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
        originalTranslatorCredit: publishType === "REUPLOAD" ? originalTranslatorCredit : null,
        sourceUrl: publishType === "ORIGINAL" ? null : sourceUrl,
        uploaderNote: publishType === "REUPLOAD" ? uploaderNote : null,

        translatorCredit: publishType === "TRANSLATION" ? translatorCredit : null,
        companyCredit: publishType === "ORIGINAL" ? null : companyCredit,

        genres: genreIds.length ? { connect: genreIds.map((id) => ({ id })) } : undefined,
        warningTags: warningTagIds.length ? { connect: warningTagIds.map((id) => ({ id })) } : undefined,
        deviantLoveTags: deviantLoveTagIds.length ? { connect: deviantLoveTagIds.map((id) => ({ id })) } : undefined,
        tags: tagNames.length
          ? {
              connectOrCreate: tagNames.slice(0, 50).map((name) => {
                const s = slugify(name);
                return { where: { slug: s }, create: { name, slug: s } };
              }),
            }
          : undefined,
      },
      select: { id: true },
    });

    try {
      const saved = await saveCoverUpload(coverFile, "covers", { userId: session.user.id, workId: created.id });
      await prisma.work.update({ where: { id: created.id }, data: { coverImage: saved.url, coverKey: saved.key } });
    } catch (err) {
      await prisma.work.delete({ where: { id: created.id } }).catch(() => {});
      throw err;
    }

    const full = await prisma.work.findUnique({ where: { id: created.id } });
    return NextResponse.json({ ok: true, work: full }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
