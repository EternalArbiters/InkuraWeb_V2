import "server-only";

import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { deletePublicUpload, saveCoverUpload } from "@/server/uploads/upload";
import { ApiError } from "@/server/http";
import { CommentTargetType, Prisma, ReportTargetType } from "@prisma/client";
import { isOwnerOrAdmin } from "./creator";
import { requireCreatorSession } from "./session";
import { assignWorkToSeries } from "./series";

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
    const clash = await prisma.work.findFirst({
      where: { slug: candidate, NOT: { id: workId } },
      select: { id: true },
    });
    if (!clash) return candidate;
    i += 1;
    candidate = `${base}-${i + 1}`;
  }
}

export async function getStudioWorkById(workId: string) {
  const { userId, role } = await requireCreatorSession();

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      authorId: true,
      slug: true,
      title: true,
      description: true,
      type: true,
      comicType: true,
      coverImage: true,
      language: true,
      origin: true,
      completion: true,
      isMature: true,
      publishType: true,
      originalAuthorCredit: true,
      originalTranslatorCredit: true,
      sourceUrl: true,
      uploaderNote: true,
      translatorCredit: true,
      companyCredit: true,
      prevArcUrl: true,
      nextArcUrl: true,
      seriesId: true,
      seriesOrder: true,
      series: { select: { id: true, title: true } },
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

  if (!work) throw new ApiError(404, "Not found");
  if (!isOwnerOrAdmin(role, userId, work.authorId)) throw new ApiError(403, "Forbidden");

  return { work };
}

export async function patchStudioWorkById(req: Request, workId: string) {
  const { userId, role } = await requireCreatorSession();

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
      seriesId: true,
      seriesOrder: true,
    },
  });

  if (!existing) throw new ApiError(404, "Not found");
  if (!isOwnerOrAdmin(role, userId, existing.authorId)) throw new ApiError(403, "Forbidden");

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

    return { status: 200, body: { ok: true, work: updated } };
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
  const seriesTitleRaw = String(fd.get("seriesTitle") || "").trim();
  const seriesOrderRaw = String(fd.get("seriesOrder") || "").trim();
  const seriesOrder = seriesOrderRaw ? Number(seriesOrderRaw) : null;

  if (!title) return { status: 400, body: { error: "Title is required" } };

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
  const publishType =
    publishTypeRaw === "ORIGINAL" || publishTypeRaw === "TRANSLATION" || publishTypeRaw === "REUPLOAD"
      ? publishTypeRaw
      : String(existing.publishType || "ORIGINAL").toUpperCase();

  const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

  const nextOriginalAuthorCredit = needsSource
    ? originalAuthorCreditRaw || existing.originalAuthorCredit || ""
    : null;
  const nextOriginalTranslatorCredit = publishType === "REUPLOAD"
    ? originalTranslatorCreditRaw || (existing as any).originalTranslatorCredit || ""
    : null;
  const nextSourceUrl = needsSource ? sourceUrlRaw || existing.sourceUrl || "" : null;
  const nextUploaderNote = publishType === "REUPLOAD" ? uploaderNoteRaw : null;

  if (needsSource) {
    if (!String(nextOriginalAuthorCredit || "").trim()) {
      return { status: 400, body: { error: "Original author credit is required" } };
    }
    if (!String(nextSourceUrl || "").trim()) {
      return { status: 400, body: { error: "Source URL is required" } };
    }
  }

  if (publishType === "REUPLOAD") {
    if (!String(nextOriginalTranslatorCredit || "").trim()) {
      return { status: 400, body: { error: "Original translator credit is required for Reupload" } };
    }
  }

  // Cover updates (R2)
  const removeCover = String(fd.get("removeCover") || "").toLowerCase() === "true";
  const coverUrl = String(fd.get("coverUrl") || (fd.get("coverImage") as any) || "").trim();
  const coverKey = String(fd.get("coverKey") || "").trim();

  let nextCoverImage: string | null | undefined = undefined;
  let nextCoverKey: string | null | undefined = undefined;

  // File upload fallback
  const cover = fd.get("cover");
  if (cover && typeof cover !== "string") {
    const file = cover as File;
    if (file.size > 0) {
      const saved = await saveCoverUpload(file, "covers", { userId, workId });
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
      translatorId: publishType === "TRANSLATION" ? userId : null,
      ...(needsSource
        ? {
            originalAuthorCredit: nextOriginalAuthorCredit,
            originalTranslatorCredit: publishType === "REUPLOAD" ? nextOriginalTranslatorCredit : null,
            sourceUrl: nextSourceUrl,
            uploaderNote: nextUploaderNote,
            translatorCredit: publishType === "TRANSLATION" ? translatorCreditRaw || null : null,
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

  await assignWorkToSeries(prisma, {
    workId,
    userId: existing.authorId,
    seriesTitle: seriesTitleRaw,
    seriesOrder,
  });

  return { status: 200, body: { ok: true, work: updated } };
}

export async function deleteStudioWorkById(workId: string) {
  const { userId, role } = await requireCreatorSession();

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

  if (!work) throw new ApiError(404, "Not found");
  if (!isOwnerOrAdmin(role, userId, work.authorId)) throw new ApiError(403, "Forbidden");

  const chapterIds = (work.chapters || []).map((c) => c.id);

  // Delete polymorphic comments + reports for those comments
  const commentOr: Prisma.CommentWhereInput[] = [{ targetType: CommentTargetType.WORK, targetId: workId }];
  if (chapterIds.length) {
    commentOr.push({ targetType: CommentTargetType.CHAPTER, targetId: { in: chapterIds } });
  }

  const comments = await prisma.comment.findMany({
    where: {
      OR: commentOr,
    },
    select: { id: true },
  });
  const commentIds = comments.map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    if (commentIds.length) {
      await tx.report.deleteMany({
        where: { targetType: ReportTargetType.COMMENT, targetId: { in: commentIds } },
      });
      await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
    }

    // Delete notifications referencing this work/chapters
    await tx.notification.deleteMany({
      where: {
        OR: [{ workId }, ...(chapterIds.length ? [{ chapterId: { in: chapterIds } }] : [])],
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

  return { ok: true };
}
