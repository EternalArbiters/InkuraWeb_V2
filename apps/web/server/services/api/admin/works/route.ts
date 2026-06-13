import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json, badRequest, safeBool, safeJsonArray } from "@/server/http";
import { searchAdminWorks, createAdminWorkOnBehalf } from "@/server/services/admin/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || undefined;
  const take = Math.min(100, Number(url.searchParams.get("take") || 60));
  const works = await searchAdminWorks({ query, take });
  return json({ ok: true, works });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await requireAdminSession();

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return badRequest("Use multipart/form-data");
  }

  const fd = await req.formData();

  const creatorUserId = String(fd.get("creatorUserId") || "").trim();
  if (!creatorUserId) return badRequest("creatorUserId is required");

  const title = String(fd.get("title") || "").trim();
  if (!title) return badRequest("Title is required");

  const typeRaw = String(fd.get("type") || "NOVEL").toUpperCase().trim();
  const type: "NOVEL" | "COMIC" = typeRaw === "COMIC" ? "COMIC" : "NOVEL";

  const comicTypeRaw = String(fd.get("comicType") || "UNKNOWN").toUpperCase().trim();
  const COMIC_TYPES = ["MANGA", "MANHWA", "MANHUA", "WEBTOON", "WESTERN", "OTHER"] as const;
  const comicType = (COMIC_TYPES as readonly string[]).includes(comicTypeRaw)
    ? (comicTypeRaw as typeof COMIC_TYPES[number])
    : "UNKNOWN";

  const language = String(fd.get("language") || "other").toLowerCase().trim() || "other";
  const origin = String(fd.get("origin") || "UNKNOWN").toUpperCase().trim() || "UNKNOWN";
  const completion = String(fd.get("completion") || "ONGOING").toUpperCase().trim() || "ONGOING";
  const description = String(fd.get("description") || "").trim();
  const subtitles = safeJsonArray(fd.get("subtitleEntries"));
  const isMature = safeBool(fd.get("isMature"));

  const ptRaw = String(fd.get("publishType") || "ORIGINAL").toUpperCase().trim();
  const publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" =
    ptRaw === "TRANSLATION" || ptRaw === "REUPLOAD" ? (ptRaw as any) : "ORIGINAL";

  const originalAuthorCredit = String(fd.get("originalAuthorCredit") || "").trim() || null;
  const originalTranslatorCredit = String(fd.get("originalTranslatorCredit") || "").trim() || null;
  const sourceUrl = String(fd.get("sourceUrl") || "").trim() || null;
  const companyCredit = String(fd.get("companyCredit") || "").trim() || null;
  const uploaderNote = String(fd.get("uploaderNote") || "").trim() || null;

  const coverUrl = String(fd.get("coverUrl") || "").trim();
  const coverKey = String(fd.get("coverKey") || "").trim() || null;
  if (!coverUrl) return badRequest("Cover is required");

  const genreIds = safeJsonArray(fd.get("genreIds"));
  const warningTagIds = safeJsonArray(fd.get("warningTagIds"));
  const deviantLoveTagIds = safeJsonArray(fd.get("deviantLoveTagIds"));
  const tagNames = safeJsonArray(fd.get("tags"));

  const seriesTitle = String(fd.get("seriesTitle") || "").trim();
  const seriesOrderRaw = String(fd.get("seriesOrder") || "").trim();
  const seriesOrder = seriesOrderRaw ? Number(seriesOrderRaw) : null;

  const needsSource = publishType !== "ORIGINAL";
  if (needsSource) {
    if (!originalAuthorCredit) return badRequest("Original author credit is required");
    if (!sourceUrl) return badRequest("Source URL is required");
  }
  if (publishType === "REUPLOAD" && !originalTranslatorCredit) {
    return badRequest("Original translator credit is required for Reupload");
  }

  try {
    const result = await createAdminWorkOnBehalf({
      creatorUserId,
      adminUserId: session.userId,
      title,
      subtitles,
      description,
      type,
      comicType,
      language,
      origin,
      completion,
      isMature,
      publishType,
      originalAuthorCredit,
      originalTranslatorCredit,
      sourceUrl,
      companyCredit,
      uploaderNote,
      coverUrl,
      coverKey,
      genreIds,
      warningTagIds,
      deviantLoveTagIds,
      tagNames,
      seriesTitle,
      seriesOrder,
    });
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create work";
    if (message === "Creator user not found") return badRequest(message);
    throw err;
  }
});
