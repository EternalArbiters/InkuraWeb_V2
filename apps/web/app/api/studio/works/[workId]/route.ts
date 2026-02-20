import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { deletePublicUpload, saveCoverUpload } from "@/lib/upload";

export const runtime = "nodejs";

async function getCreator(sessionUserId: string) {
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });
}

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
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "1" || s === "true" || s === "yes" || s === "on";
  }
  return false;
}

function safeStatus(v: unknown): "DRAFT" | "PUBLISHED" {
  const s = String(v || "").toUpperCase().trim();
  return s === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function safeComicType(v: unknown): "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER" {
  const s = String(v || "UNKNOWN").toUpperCase().trim();
  if (s === "MANGA" || s === "MANHWA" || s === "MANHUA" || s === "WEBTOON" || s === "WESTERN" || s === "OTHER") return s;
  return "UNKNOWN";
}

async function ensureUniqueSlug(base: string, workId: string) {
  let candidate = base;
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.work.findFirst({ where: { slug: candidate, NOT: { id: workId } }, select: { id: true } });
    if (!clash) return candidate;
    i += 1;
    candidate = `${base}-${i + 1}`;
  }
}

function isOwnerOrAdmin(meRole: string, sessionUserId: string, ownerId: string) {
  return meRole === "ADMIN" || ownerId === sessionUserId;
}

export async function GET(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      genres: true,
      tags: true,
      warningTags: true,
      chapters: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          publishedAt: true,
          status: true,
          isMature: true,
          warningTags: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, work.authorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ work });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      authorId: true,
      slug: true,
      coverImage: true,
      coverKey: true,
      status: true,
      publishType: true,
      originalAuthorCredit: true,
      sourceUrl: true,
      uploaderNote: true,
    },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, existing.authorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // JSON PATCH (used by PublishToggle)
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      const status = safeStatus(body?.status);

      const updated = await prisma.work.update({
        where: { id: workId },
        data: { status: status as any },
        select: { id: true, slug: true, status: true },
      });

      return NextResponse.json({ ok: true, work: updated });
    }

    // FormData PATCH (metadata edit)
    const fd = await req.formData();

    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "");

    const typeRaw = String(fd.get("type") || "").toUpperCase().trim();
    const type = typeRaw === "COMIC" || typeRaw === "NOVEL" ? (typeRaw as any) : undefined;

    const comicTypeRaw = fd.get("comicType");
    const hasComicType = comicTypeRaw != null;
    const comicType = safeComicType(comicTypeRaw);

    const language = String(fd.get("language") || "").toLowerCase().trim() || undefined;
    const origin = String(fd.get("origin") || "").toUpperCase().trim() || undefined;
    const completion = String(fd.get("completion") || "").toUpperCase().trim() || undefined;
    const isMature = fd.get("isMature") != null ? safeBool(fd.get("isMature")) : undefined;

    const genreIds = safeJsonArray(fd.get("genreIds"));
    const warningTagIds = safeJsonArray(fd.get("warningTagIds"));
    const tagNames = safeJsonArray(fd.get("tags"));

    const originalAuthorCreditRaw = String(fd.get("originalAuthorCredit") || "").trim();
    const sourceUrlRaw = String(fd.get("sourceUrl") || "").trim();
    const uploaderNoteRaw = String(fd.get("uploaderNote") || "");

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    // Slug is optional; if provided, make sure unique.
    const slugInput = String(fd.get("slug") || "").trim();
    let nextSlug = existing.slug;
    if (slugInput) {
      const base = slugify(slugInput);
      nextSlug = await ensureUniqueSlug(base, workId);
    }

    // publishType rules:
    // - TRANSLATION: credit + source required
    // - REUPLOAD: source required
    const publishType = String(existing.publishType || "ORIGINAL").toUpperCase();
    const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

    const nextOriginalAuthorCredit = publishType === "TRANSLATION" ? (originalAuthorCreditRaw || existing.originalAuthorCredit || "") : null;
    const nextSourceUrl = needsSource ? (sourceUrlRaw || existing.sourceUrl || "") : null;
    const nextUploaderNote = publishType === "REUPLOAD" ? uploaderNoteRaw : null;

    if (publishType === "TRANSLATION") {
      if (!String(nextOriginalAuthorCredit || "").trim()) return NextResponse.json({ error: "Original author credit is required" }, { status: 400 });
      if (!String(nextSourceUrl || "").trim()) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }
    if (publishType === "REUPLOAD") {
      if (!String(nextSourceUrl || "").trim()) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    // Cover updates (R2)
    const removeCover = String(fd.get("removeCover") || "").toLowerCase() === "true";
    const coverUrl = String(fd.get("coverUrl") || fd.get("coverImage") || "").trim();
    const coverKey = String(fd.get("coverKey") || "").trim();

    let nextCoverImage: string | null | undefined = undefined;
    let nextCoverKey: string | null | undefined = undefined;

    // File upload fallback
    const cover = fd.get("cover");
    if (cover && typeof cover !== "string") {
      const file = cover as File;
      if (file.size > 0) {
        const saved = await saveCoverUpload(file, "covers", { userId: session.user.id, workId });
        nextCoverImage = saved.url;
        nextCoverKey = saved.key;
      }
    }

    // Presigned commit (client uploaded to R2)
    if (!nextCoverImage && coverUrl) {
      nextCoverImage = coverUrl;
      nextCoverKey = coverKey || null;
    }

    if (removeCover) {
      nextCoverImage = null;
      nextCoverKey = null;
    }

    // Delete old cover if replaced/removed.
    if (nextCoverImage !== undefined) {
      const oldKeyOrUrl = existing.coverKey || existing.coverImage;
      if (oldKeyOrUrl) {
        // best-effort: don't delete if it's exactly the same key/url
        if (nextCoverKey && oldKeyOrUrl === nextCoverKey) {
          // no-op
        } else if (nextCoverImage && oldKeyOrUrl === nextCoverImage) {
          // no-op
        } else {
          await deletePublicUpload(oldKeyOrUrl);
        }
      }
    }

    const updated = await prisma.work.update({
      where: { id: workId },
      data: {
        title,
        slug: nextSlug,
        description: description || null,
        ...(type ? { type } : {}),
        ...(type
          ? { comicType: type === "COMIC" ? comicType : "UNKNOWN" }
          : hasComicType
          ? { comicType }
          : {}),

        ...(nextCoverImage !== undefined ? { coverImage: nextCoverImage, coverKey: nextCoverKey } : {}),

        ...(language ? { language } : {}),
        ...(origin ? { origin: origin as any } : {}),
        ...(completion ? { completion: completion as any } : {}),
        ...(isMature !== undefined ? { isMature } : {}),

        ...(needsSource
          ? {
              originalAuthorCredit: nextOriginalAuthorCredit,
              sourceUrl: nextSourceUrl,
              uploaderNote: nextUploaderNote,
            }
          : {}),

        genres: { set: genreIds.map((id) => ({ id })) },
        warningTags: { set: warningTagIds.map((id) => ({ id })) },
        tags: tagNames.length
          ? {
              set: [],
              connectOrCreate: tagNames.slice(0, 50).map((name) => {
                const s = slugify(name);
                return { where: { slug: s }, create: { name, slug: s } };
              }),
            }
          : { set: [] },
      },
      select: { id: true, title: true, slug: true, status: true },
    });

    return NextResponse.json({ ok: true, work: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
