import "server-only";

import prisma from "@/server/db/prisma";
import { studioWorkRowSelect } from "@/server/db/selectors";
import { slugify } from "@/lib/slugify";
import { deletePublicUpload, saveCoverUpload } from "@/server/uploads/upload";
import { requireCreatorSession } from "./session";
import { assignWorkToSeries } from "./series";
import { profileHotspot } from "@/server/observability/profiling";

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

export async function listStudioWorksForViewer(input?: { all?: boolean }) {
  const { userId, role } = await requireCreatorSession();
  const all = !!input?.all;

  const works = await profileHotspot("studioWorks.list", { scope: role === "ADMIN" && all ? "all" : "mine", isAdmin: role === "ADMIN" }, () =>
    prisma.work.findMany({
      where: role === "ADMIN" && all ? {} : { authorId: userId },
      orderBy: { updatedAt: "desc" },
      select: studioWorkRowSelect,
    })
  );

  return { works };
}

export async function listStudioWorks(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1" || url.searchParams.get("scope") === "all";
  return listStudioWorksForViewer({ all });
}

export async function createStudioWork(req: Request) {
  const { userId } = await requireCreatorSession();

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return { status: 400, body: { error: "Use multipart/form-data for create work" } };
  }

  const fd = await req.formData();

  const title = String(fd.get("title") || "").trim();
  const subtitle = String(fd.get("subtitle") || "").trim() || null;
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
  const publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" =
    pt === "TRANSLATION" || pt === "REUPLOAD" ? (pt as any) : "ORIGINAL";

  const originalAuthorCredit = String(fd.get("originalAuthorCredit") || "").trim() || null;
  const originalTranslatorCredit = String(fd.get("originalTranslatorCredit") || "").trim() || null;
  const sourceUrl = String(fd.get("sourceUrl") || "").trim() || null;
  const uploaderNote = String(fd.get("uploaderNote") || "").trim() || null;

  const companyCredit = String(fd.get("companyCredit") || "").trim() || null;
  const seriesTitle = String(fd.get("seriesTitle") || "").trim();
  const seriesOrderRaw = String(fd.get("seriesOrder") || "").trim();
  const seriesOrder = seriesOrderRaw ? Number(seriesOrderRaw) : null;

  const cover = fd.get("cover");
  const coverFile = cover && typeof cover !== "string" ? (cover as File) : null;
  const coverUrl = String(fd.get("coverUrl") || (fd.get("coverImage") as any) || "").trim();
  const coverKey = String(fd.get("coverKey") || "").trim() || null;
  const hasUploadedCover = !!coverUrl;

  async function cleanupIncomingCover() {
    if (coverKey || coverUrl) {
      await deletePublicUpload(coverKey || coverUrl).catch(() => {});
    }
  }

  if (!title) {
    await cleanupIncomingCover();
    return { status: 400, body: { error: "Title is required" } };
  }
  if ((!coverFile || coverFile.size <= 0) && !hasUploadedCover) {
    return { status: 400, body: { error: "Cover is required (max 2MB)." } };
  }
  if (!hasUploadedCover && coverFile && coverFile.size > 2 * 1024 * 1024) {
    return { status: 400, body: { error: "Cover too large (max 2MB)." } };
  }

  const needsSource = publishType !== "ORIGINAL";
  if (needsSource) {
    if (!originalAuthorCredit) {
      await cleanupIncomingCover();
      return { status: 400, body: { error: "Original author credit is required" } };
    }
    if (!sourceUrl) {
      await cleanupIncomingCover();
      return { status: 400, body: { error: "Source URL is required" } };
    }
  }

  if (publishType === "REUPLOAD") {
    if (!originalTranslatorCredit) {
      await cleanupIncomingCover();
      return {
        status: 400,
        body: { error: "Original translator credit is required for Reupload" },
      };
    }
  }

  const base = slugify(title);
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `${base}-${suffix}`;

  const created = await prisma.work.create({
    data: {
      slug,
      title,
      subtitle,
      description: description || null,
      type,
      comicType: type === "COMIC" ? comicType : "UNKNOWN",
      status: "DRAFT",
      coverImage: hasUploadedCover ? coverUrl : null,
      coverKey: hasUploadedCover ? coverKey : null,
      authorId: userId,
      language,
      origin: origin as any,
      completion: completion as any,
      isMature,

      publishType: publishType as any,
      translatorId: publishType === "TRANSLATION" ? userId : null,
      originalAuthorCredit: publishType === "ORIGINAL" ? null : originalAuthorCredit,
      originalTranslatorCredit: publishType === "REUPLOAD" ? originalTranslatorCredit : null,
      sourceUrl: publishType === "ORIGINAL" ? null : sourceUrl,
      uploaderNote: publishType === "REUPLOAD" ? uploaderNote : null,

      translatorCredit: null,
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

  await assignWorkToSeries(prisma, { workId: created.id, userId, seriesTitle, seriesOrder });

  if (!hasUploadedCover && coverFile && coverFile.size > 0) {
    try {
      const saved = await saveCoverUpload(coverFile, "covers", {
        userId,
        workId: created.id,
      });
      await prisma.work.update({
        where: { id: created.id },
        data: { coverImage: saved.url, coverKey: saved.key },
      });
    } catch (err) {
      await prisma.work.delete({ where: { id: created.id } }).catch(() => {});
      throw err;
    }
  }

  const full = await prisma.work.findUnique({ where: { id: created.id } });
  return { status: 201, body: { ok: true, work: full } };
}
