import "server-only";

import prisma from "@/server/db/prisma";
import { savePublicUpload, deletePublicUpload } from "@/server/uploads/upload";
import { notifyNewChapter } from "@/server/services/notifyNewChapter";
import { ApiError } from "@/server/http";
import { CommentTargetType, Prisma, ReportTargetType } from "@prisma/client";
import { requireCreatorSession } from "./session";
import { normalizeNovelContentForStorage, novelContentHasMeaningfulContent } from "@/lib/novelContent";

function safeJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
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

function safeLabel(v: unknown) {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s || null;
}

async function recomputePublishedChapterCount(workId: string) {
  const count = await prisma.chapter.count({ where: { workId, status: "PUBLISHED" } as any });
  await prisma.work.update({ where: { id: workId }, data: { chapterCount: count } });
}

async function canEditWork(userId: string, role: string, workId: string) {
  if (role === "ADMIN") return true;
  const w = await prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } });
  if (!w) return false;
  return w.authorId === userId;
}

type PageMeta = { url: string; key?: string | null; order?: number | null };

export async function createStudioChapter(req: Request) {
  const { userId, role } = await requireCreatorSession();

  const ct = req.headers.get("content-type") || "";

  let workId = "";
  let title = "";
  let label: string | null | undefined = undefined;
  let number = 1;
  let status: "DRAFT" | "PUBLISHED" = "DRAFT";
  let isMature = false;
  let warningTagIds: string[] = [];
  let content = "";

  let files: File[] = [];
  let pagesMeta: PageMeta[] = [];

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    workId = String(body?.workId || "").trim();
    title = String(body?.title || "").trim();
    label = safeLabel(body?.label);
    number = Math.max(0, parseInt(String(body?.number ?? "1"), 10) || 0);
    status = safeStatus(body?.status);
    isMature = safeBool(body?.isMature);
    warningTagIds = Array.isArray(body?.warningTagIds) ? body.warningTagIds.map(String) : [];
    content = normalizeNovelContentForStorage(String(body?.content || ""));
    pagesMeta = Array.isArray(body?.pages)
      ? body.pages
          .map((p: any) => ({
            url: String(p?.url || "").trim(),
            key: p?.key ? String(p.key) : null,
            order: p?.order ? Number(p.order) : null,
          }))
          .filter((p: PageMeta) => !!p.url)
      : [];
  } else {
    const fd = await req.formData();
    workId = String(fd.get("workId") || "").trim();
    title = String(fd.get("title") || "").trim();
    label = safeLabel(fd.get("label"));
    const numberRaw = String(fd.get("number") || "").trim();
    number = Math.max(0, parseInt(numberRaw || "1", 10) || 0);
    status = safeStatus(fd.get("status"));
    isMature = safeBool(fd.get("isMature"));
    warningTagIds = safeJsonArray(fd.get("warningTagIds"));
    content = normalizeNovelContentForStorage(String(fd.get("content") || ""));
    files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];

    // optional: commit pages meta (if client uploaded via presign)
    const pagesJson = String(fd.get("pages") || "").trim();
    if (pagesJson) {
      try {
        const parsed = JSON.parse(pagesJson);
        if (Array.isArray(parsed)) {
          pagesMeta = parsed
            .map((p: any) => ({
              url: String(p?.url || "").trim(),
              key: p?.key ? String(p.key) : null,
              order: p?.order ? Number(p.order) : null,
            }))
            .filter((p: PageMeta) => !!p.url);
        }
      } catch {
        // ignore
      }
    }
  }

  if (!workId) return { status: 400, body: { error: "workId is required" } };
  if (!title) return { status: 400, body: { error: "title is required" } };

  const ok = await canEditWork(userId, role, workId);
  if (!ok) return { status: 403, body: { error: "Forbidden" } };

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, type: true } });
  if (!work) return { status: 404, body: { error: "Work not found" } };

  if (work.type === "NOVEL" && !novelContentHasMeaningfulContent(content)) {
    return { status: 400, body: { error: "content is required for NOVEL" } };
  }

  // Create chapter first (so we have chapterId for R2 key prefixes)
  let chapter;
  try {
    chapter = await prisma.chapter.create({
      data: {
        workId,
        title,
        number,
        ...(label !== undefined ? { label } : {}),
        status: status as any,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        ...(isMature ? { isMature: true } : {}),
        ...(warningTagIds.length ? { warningTags: { connect: warningTagIds.map((id) => ({ id })) } } : {}),
        ...(work.type === "NOVEL" ? { text: { create: { content } } } : {}),
      },
      select: { id: true, workId: true, number: true, label: true, title: true, status: true, work: { select: { slug: true } } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: { error: "Chapter order sudah dipakai di work ini." } };
    }
    throw error;
  }

  if (work.type === "COMIC") {
    // If old flow still sends files in the same request, upload them to R2 now.
    if (files.length) {
      const created = await Promise.all(
        files.map(async (file, idx) => {
          const saved = await savePublicUpload(file, "pages", {
            userId,
            workId,
            chapterId: chapter.id,
            scope: "pages",
          });
          return prisma.comicPage.create({
            data: { chapterId: chapter.id, order: idx + 1, imageUrl: saved.url, imageKey: saved.key },
            select: { id: true },
          });
        })
      );
      void created;
    }

    // If presign flow sends URLs/keys, just commit.
    if (pagesMeta.length) {
      // sort by order if provided, else keep array order
      const sorted = [...pagesMeta].sort((a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0));
      await prisma.comicPage.createMany({
        data: sorted.map((p, idx) => ({
          chapterId: chapter.id,
          order: (p.order && p.order > 0 ? p.order : idx + 1) as number,
          imageUrl: p.url,
          imageKey: p.key || null,
        })),
      });
    }
  }

  await recomputePublishedChapterCount(workId);

  // Notify favorite/bookmark readers when a chapter is published
  if (chapter.status === "PUBLISHED") {
    await notifyNewChapter({ workId, chapterId: chapter.id, actorId: userId });
  }

  return { status: 201, body: { ok: true, chapter: { ...chapter, workSlug: chapter.work.slug } } };
}

async function loadChapterForEdit(userId: string, role: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      work: { select: { id: true, slug: true, title: true, type: true, authorId: true } },
      text: true,
      warningTags: true,
      pages: { orderBy: { order: "asc" } },
    },
  });

  if (!chapter) return { kind: "not_found" as const };
  if (role !== "ADMIN" && chapter.work.authorId !== userId) return { kind: "forbidden" as const };
  return { kind: "ok" as const, chapter };
}

export async function getStudioChapterForEdit(chapterId: string) {
  const { userId, role } = await requireCreatorSession();
  const res = await loadChapterForEdit(userId, role, chapterId);
  if (res.kind === "not_found") throw new ApiError(404, "Not found");
  if (res.kind === "forbidden") throw new ApiError(403, "Forbidden");

  return { chapter: res.chapter };
}

export async function patchStudioChapter(req: Request, chapterId: string) {
  const { userId, role } = await requireCreatorSession();

  const owned = await loadChapterForEdit(userId, role, chapterId);
  if (owned.kind === "not_found") return { status: 404, body: { error: "Chapter not found" } };
  if (owned.kind === "forbidden") return { status: 403, body: { error: "Forbidden" } };

  const body = await req.json().catch(() => ({} as any));

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const label = safeLabel(body.label);
  const numberRaw = body.number;
  const number =
    typeof numberRaw === "number" && Number.isFinite(numberRaw)
      ? Math.max(0, Math.floor(numberRaw))
      : undefined;
  const content = typeof body.content === "string" ? normalizeNovelContentForStorage(body.content) : undefined;
  const authorNote =
    typeof body.authorNote === "string" ? body.authorNote : body.authorNote === null ? null : undefined;

  const thumbnailImage =
    typeof body.thumbnailImage === "string" ? body.thumbnailImage.trim() : body.thumbnailImage === null ? null : undefined;
  const thumbnailKey =
    typeof body.thumbnailKey === "string" ? body.thumbnailKey.trim() : body.thumbnailKey === null ? null : undefined;

  const thumbnailFocusX =
    body.thumbnailFocusX === null
      ? null
      : body.thumbnailFocusX === undefined
        ? undefined
        : Number(body.thumbnailFocusX);
  const thumbnailFocusY =
    body.thumbnailFocusY === null
      ? null
      : body.thumbnailFocusY === undefined
        ? undefined
        : Number(body.thumbnailFocusY);
  const thumbnailZoom =
    body.thumbnailZoom === null
      ? null
      : body.thumbnailZoom === undefined
        ? undefined
        : Number(body.thumbnailZoom);

  const isMature = typeof body.isMature === "boolean" ? body.isMature : undefined;
  const warningTagIds = safeJsonArray(body.warningTagIds);

  const status = typeof body.status === "string" ? safeStatus(body.status) : undefined;

  if (title !== undefined && title.length === 0) {
    return { status: 400, body: { error: "title cannot be empty" } };
  }

  if (owned.chapter.work.type === "NOVEL" && content !== undefined && !novelContentHasMeaningfulContent(content)) {
    return { status: 400, body: { error: "content is required for NOVEL" } };
  }

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (label !== undefined) data.label = label;
  if (number !== undefined) data.number = number;
  if (isMature !== undefined) data.isMature = isMature;
  if (warningTagIds) data.warningTags = { set: warningTagIds.map((id) => ({ id })) };
  if (authorNote !== undefined) data.authorNote = authorNote;
  if (thumbnailImage !== undefined) data.thumbnailImage = thumbnailImage;
  if (thumbnailKey !== undefined) data.thumbnailKey = thumbnailKey;
  if (thumbnailFocusX !== undefined) {
    data.thumbnailFocusX =
      thumbnailFocusX === null || Number.isNaN(thumbnailFocusX)
        ? null
        : Math.max(0, Math.min(100, Math.round(thumbnailFocusX)));
  }
  if (thumbnailFocusY !== undefined) {
    data.thumbnailFocusY =
      thumbnailFocusY === null || Number.isNaN(thumbnailFocusY)
        ? null
        : Math.max(0, Math.min(100, Math.round(thumbnailFocusY)));
  }
  if (thumbnailZoom !== undefined) {
    data.thumbnailZoom =
      thumbnailZoom === null || Number.isNaN(thumbnailZoom)
        ? null
        : Math.max(1, Math.min(2.5, thumbnailZoom));
  }

  if (status !== undefined) {
    data.status = status;
    data.publishedAt = status === "PUBLISHED" ? owned.chapter.publishedAt || new Date() : null;
  }

  // Best-effort delete old thumbnail if it was a dedicated upload (thumbnailKey set).
  if ((thumbnailImage !== undefined || thumbnailKey !== undefined) && (owned.chapter as any).thumbnailKey) {
    const oldKey = String((owned.chapter as any).thumbnailKey);
    const nextKey = thumbnailKey ? String(thumbnailKey) : "";
    if (!nextKey || nextKey !== oldKey) {
      await deletePublicUpload(oldKey);
    }
  }

  let updated;
  try {
    updated = await prisma.chapter.update({
      where: { id: chapterId },
      data,
      select: { id: true, title: true, number: true, label: true, status: true, workId: true, work: { select: { slug: true } } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: { error: "Chapter order sudah dipakai di work ini." } };
    }
    throw error;
  }

  if (owned.chapter.work.type === "NOVEL" && content !== undefined) {
    if (owned.chapter.text) {
      await prisma.chapterText.update({ where: { chapterId }, data: { content } });
    } else {
      await prisma.chapterText.create({ data: { chapterId, content } });
    }
  }

  await recomputePublishedChapterCount(updated.workId);

  // Notify favorite/bookmark readers if this PATCH just published the chapter
  const wasPublished = owned.chapter.status === "PUBLISHED";
  const nowPublished = updated.status === "PUBLISHED";
  if (!wasPublished && nowPublished) {
    await notifyNewChapter({ workId: updated.workId, chapterId: updated.id, actorId: userId });
  }

  return { status: 200, body: { ok: true, chapter: { ...updated, workSlug: updated.work.slug } } };
}

export async function deleteStudioChapter(chapterId: string) {
  const { userId, role } = await requireCreatorSession();

  const owned = await loadChapterForEdit(userId, role, chapterId);
  if (owned.kind === "not_found") throw new ApiError(404, "Not found");
  if (owned.kind === "forbidden") throw new ApiError(403, "Forbidden");

  const chapter = owned.chapter;

  const comments = await prisma.comment.findMany({
    where: { targetType: CommentTargetType.CHAPTER, targetId: chapterId },
    select: { id: true },
  });
  const commentIds = comments.map((comment) => comment.id);

  await prisma.$transaction(async (tx) => {
    if (commentIds.length) {
      await tx.report.deleteMany({
        where: { targetType: ReportTargetType.COMMENT, targetId: { in: commentIds } },
      });
      await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
    }

    await tx.notification.deleteMany({ where: { chapterId } });
    await tx.chapter.delete({ where: { id: chapterId } });
  });

  await recomputePublishedChapterCount(chapter.work.id);

  const toDelete: string[] = [];
  if (chapter.thumbnailKey) toDelete.push(String(chapter.thumbnailKey));
  for (const page of chapter.pages || []) {
    if (page.imageKey) toDelete.push(String(page.imageKey));
    else if (page.imageUrl) toDelete.push(String(page.imageUrl));
  }

  const uniq = Array.from(new Set(toDelete)).filter(Boolean);
  await Promise.all(uniq.map((item) => deletePublicUpload(item)));

  return {
    ok: true,
    chapterId,
    workId: chapter.work.id,
    workSlug: chapter.work.slug,
  };
}
