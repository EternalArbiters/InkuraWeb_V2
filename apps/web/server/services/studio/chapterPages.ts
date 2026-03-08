import "server-only";

import prisma from "@/server/db/prisma";
import { savePublicUpload, deletePublicUpload } from "@/server/uploads/upload";
import { requireCreatorSession } from "./session";
import { isOwnerOrAdmin } from "./creator";

async function renumberChapterPages(chapterId: string) {
  const pages = await prisma.comicPage.findMany({
    where: { chapterId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const ids = pages.map((p) => p.id);
  if (!ids.length) return;

  await prisma.$transaction([
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: -(i + 1) } })),
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: i + 1 } })),
  ]);
}

type PageMeta = { url: string; key?: string | null; order?: number | null };

function normalizeReplace(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v || "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on" || s === "replace";
}

export async function uploadOrReplaceChapterPages(req: Request, chapterId: string) {
  const { userId, role } = await requireCreatorSession();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { work: { select: { id: true, slug: true, authorId: true } } },
  });

  if (!chapter) return { status: 404, body: { error: "Not found" } };
  if (!isOwnerOrAdmin(role, userId, chapter.work.authorId)) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const ct = req.headers.get("content-type") || "";

  let pagesMeta: PageMeta[] = [];
  let files: File[] = [];
  let replace = false;

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    replace = normalizeReplace(body?.replace ?? body?.mode);
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
    replace = normalizeReplace(fd.get("replace") || fd.get("mode"));
    files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];

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

  if (!files.length && !pagesMeta.length) {
    return { status: 400, body: { error: "No pages provided" } };
  }

  // Replace mode: delete existing page rows and best-effort delete their R2 objects.
  // This prevents duplicates accumulating when re-uploading a chapter.
  if (replace) {
    const existing = await prisma.comicPage.findMany({
      where: { chapterId },
      select: { id: true, imageKey: true, imageUrl: true },
    });

    if (existing.length) {
      await prisma.comicPage.deleteMany({ where: { chapterId } });
      await Promise.all(
        existing.map(async (p) => {
          const keyOrUrl = p.imageKey || p.imageUrl;
          if (!keyOrUrl) return;
          await deletePublicUpload(keyOrUrl);
        })
      );
    }
  }

  // Upload files (fallback flow)
  if (files.length) {
    await Promise.all(
      files.map(async (file, idx) => {
        const saved = await savePublicUpload(file, "pages", {
          userId,
          workId: chapter.work.id,
          chapterId,
          scope: "pages",
        });
        return prisma.comicPage.create({
          data: { chapterId, order: idx + 1, imageUrl: saved.url, imageKey: saved.key },
          select: { id: true },
        });
      })
    );
  }

  // Commit already-uploaded pages
  if (pagesMeta.length) {
    const sorted = [...pagesMeta].sort((a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0));
    await prisma.comicPage.createMany({
      data: sorted.map((p, idx) => ({
        chapterId,
        order: (p.order && p.order > 0 ? p.order : idx + 1) as number,
        imageUrl: p.url,
        imageKey: p.key || null,
      })),
    });
  }

  await renumberChapterPages(chapterId);

  return { status: 200, body: { ok: true, chapterId, workSlug: chapter.work.slug } };
}
