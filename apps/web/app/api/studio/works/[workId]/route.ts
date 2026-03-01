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
      deviantLoveTags: true,
      chapters: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          thumbnailImage: true,
          thumbnailFocusX: true,
          thumbnailFocusY: true,
          thumbnailZoom: true,
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
      originalTranslatorCredit: true,
      sourceUrl: true,
      uploaderNote: true,
      translatorId: true,
      translatorCredit: true,
      companyCredit: true,
      prevArcUrl: true,
      nextArcUrl: true,
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
    const deviantLoveTagIds = safeJsonArray(fd.get("deviantLoveTagIds"));
    const tagNames = safeJsonArray(fd.get("tags"));

    const originalAuthorCreditRaw = String(fd.get("originalAuthorCredit") || "").trim();
    const originalTranslatorCreditRaw = String(fd.get("originalTranslatorCredit") || "").trim();
    const sourceUrlRaw = String(fd.get("sourceUrl") || "").trim();
    const uploaderNoteRaw = String(fd.get("uploaderNote") || "");
    const translatorCreditRaw = String(fd.get("translatorCredit") || "").trim();
    const companyCreditRaw = String(fd.get("companyCredit") || "").trim();
    const prevArcUrlRaw = String(fd.get("prevArcUrl") || "").trim();
    const nextArcUrlRaw = String(fd.get("nextArcUrl") || "").trim();

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    // Slug is optional; if provided, make sure unique.
    const slugInput = String(fd.get("slug") || "").trim();
    let nextSlug = existing.slug;
    if (slugInput) {
      const base = slugify(slugInput);
      nextSlug = await ensureUniqueSlug(base, workId);
    }

    // publishType rules:
// - ORIGINAL: no credit/source
// - TRANSLATION: original author + source required, uploader becomes translator
// - REUPLOAD: original author + source required, uploader becomes reuploader
const publishTypeRaw = String(fd.get("publishType") || "").toUpperCase().trim();
const publishType = (publishTypeRaw === "ORIGINAL" || publishTypeRaw === "TRANSLATION" || publishTypeRaw === "REUPLOAD") ? publishTypeRaw : String(existing.publishType || "ORIGINAL").toUpperCase();
const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

    const nextOriginalAuthorCredit = needsSource ? (originalAuthorCreditRaw || existing.originalAuthorCredit || "") : null;
    const nextOriginalTranslatorCredit = publishType === "REUPLOAD" ? (originalTranslatorCreditRaw || (existing as any).originalTranslatorCredit || "") : null;
    const nextSourceUrl = needsSource ? (sourceUrlRaw || existing.sourceUrl || "") : null;
    const nextUploaderNote = publishType === "REUPLOAD" ? uploaderNoteRaw : null;

    if (needsSource) {
      if (!String(nextOriginalAuthorCredit || "").trim()) return NextResponse.json({ error: "Original author credit is required" }, { status: 400 });
      if (!String(nextSourceUrl || "").trim()) return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    if (publishType === "REUPLOAD") {
      if (!String(nextOriginalTranslatorCredit || "").trim()) {
        return NextResponse.json({ error: "Original translator credit is required for Reupload" }, { status: 400 });
      }
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

        publishType: publishType as any,
        translatorId: publishType === "TRANSLATION" ? session.user.id : null,
        ...(needsSource
          ? {
              originalAuthorCredit: nextOriginalAuthorCredit,
              originalTranslatorCredit: publishType === "REUPLOAD" ? nextOriginalTranslatorCredit : null,
              sourceUrl: nextSourceUrl,
              uploaderNote: nextUploaderNote,
              translatorCredit: publishType === "TRANSLATION" ? (translatorCreditRaw || null) : null,
              companyCredit: companyCreditRaw || null,
            }
          : {
              originalAuthorCredit: null,
              originalTranslatorCredit: null,
              sourceUrl: null,
              uploaderNote: null,
              translatorCredit: null,
              companyCredit: null,
            }),
        prevArcUrl: prevArcUrlRaw || null,
        nextArcUrl: nextArcUrlRaw || null,

        genres: { set: genreIds.map((id) => ({ id })) },
        warningTags: { set: warningTagIds.map((id) => ({ id })) },
        deviantLoveTags: { set: deviantLoveTagIds.map((id) => ({ id })) },
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


export async function DELETE(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      authorId: true,
      coverKey: true,
      coverImage: true,
      chapters: {
        select: {
          id: true,
          thumbnailKey: true,
          thumbnailImage: true,
          pages: { select: { imageKey: true, imageUrl: true } },
        },
      },
    },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, work.authorId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const chapterIds = (work.chapters || []).map((c) => c.id);

    // Delete polymorphic comments + reports for those comments
    const comments = await prisma.comment.findMany({
      where: {
        OR: [
          { targetType: "WORK", targetId: workId },
          ...(chapterIds.length ? [{ targetType: "CHAPTER", targetId: { in: chapterIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const commentIds = comments.map((c) => c.id);

    await prisma.$transaction(async (tx) => {
      if (commentIds.length) {
        await tx.report.deleteMany({ where: { targetType: "COMMENT", targetId: { in: commentIds } } });
        await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
      }

      // Delete notifications referencing this work/chapters
      await tx.notification.deleteMany({
        where: {
          OR: [
            { workId },
            ...(chapterIds.length ? [{ chapterId: { in: chapterIds } }] : []),
          ],
        },
      });

      // Finally delete the work (cascades most relational data)
      await tx.work.delete({ where: { id: workId } });
    });

    // Best-effort delete R2 objects (cover + pages + thumbnails)
    const toDelete: string[] = [];
    if (work.coverKey || work.coverImage) toDelete.push(String(work.coverKey || work.coverImage));

    for (const ch of work.chapters || []) {
      if (ch.thumbnailKey) toDelete.push(String(ch.thumbnailKey));
      // We intentionally do NOT delete thumbnailImage if thumbnailKey is null (it may be a page image).
      for (const p of ch.pages || []) {
        if (p.imageKey) toDelete.push(String(p.imageKey));
        else if (p.imageUrl) toDelete.push(String(p.imageUrl));
      }
    }

    // Dedupe
    const uniq = Array.from(new Set(toDelete)).filter(Boolean);
    await Promise.all(uniq.map((x) => deletePublicUpload(x)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
