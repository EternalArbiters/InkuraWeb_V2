import "server-only";

import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { normalizeWorkSubtitles, serializeWorkSubtitles } from "@/lib/workSubtitles";
import { assignWorkToSeries } from "@/server/services/studio/series";

export type AdminWorkItem = {
  id: string;
  title: string;
  slug: string;
  type: string;
  publishType: string;
  status: string;
  createdAt: string;
  author: {
    id: string;
    username: string | null;
    name: string | null;
  };
};

export async function searchAdminWorks({ query, take = 60 }: { query?: string; take?: number }): Promise<AdminWorkItem[]> {
  const where = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { author: { username: { contains: query, mode: "insensitive" as const } } },
          { author: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const works = await prisma.work.findMany({
    where,
    take,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      publishType: true,
      status: true,
      createdAt: true,
      author: { select: { id: true, username: true, name: true } },
    },
  });

  return works.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }));
}

export type AdminUserSearchItem = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

export async function searchAdminUsers({ query, take = 20 }: { query?: string; take?: number }): Promise<AdminUserSearchItem[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take,
    select: { id: true, username: true, name: true, image: true },
    orderBy: { username: "asc" },
  });
}

export type CreateAdminWorkInput = {
  creatorUserId: string;
  adminUserId: string;
  title: string;
  subtitles: string[];
  description: string;
  type: "COMIC" | "NOVEL";
  comicType: "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER";
  language: string;
  origin: string;
  completion: string;
  isMature: boolean;
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD";
  originalAuthorCredit: string | null;
  originalTranslatorCredit: string | null;
  sourceUrl: string | null;
  companyCredit: string | null;
  uploaderNote: string | null;
  coverUrl: string;
  coverKey: string | null;
  genreIds: string[];
  warningTagIds: string[];
  deviantLoveTagIds: string[];
  tagNames: string[];
  seriesTitle?: string;
  seriesOrder?: number | null;
};

export async function createAdminWorkOnBehalf(input: CreateAdminWorkInput): Promise<{ ok: boolean; workId: string; slug: string; work: { id: string; slug: string } }> {
  const {
    creatorUserId, adminUserId,
    title, subtitles, description,
    type, comicType, language, origin, completion, isMature,
    publishType, originalAuthorCredit, originalTranslatorCredit,
    sourceUrl, companyCredit, uploaderNote,
    coverUrl, coverKey,
    genreIds, warningTagIds, deviantLoveTagIds, tagNames,
    seriesTitle, seriesOrder,
  } = input;

  const creator = await prisma.user.findUnique({ where: { id: creatorUserId }, select: { id: true } });
  if (!creator) throw new Error("Creator user not found");

  const base = slugify(title).slice(0, 60) || "work";
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `${base}-${suffix}`;

  const authorId = creatorUserId;
  const translatorId = publishType === "TRANSLATION" ? creatorUserId : null;

  const normalizedSubtitles = normalizeWorkSubtitles(subtitles);
  const subtitle = normalizedSubtitles[0] || null;

  const work = await prisma.work.create({
    data: {
      slug,
      title: title.trim(),
      subtitle,
      subtitleJson: serializeWorkSubtitles(normalizedSubtitles, subtitle),
      description: description?.trim() || null,
      type,
      comicType: type === "COMIC" ? comicType : "UNKNOWN",
      status: "DRAFT",
      coverImage: coverUrl || null,
      coverKey: coverKey || null,
      authorId,
      translatorId,
      uploadedByAdminId: adminUserId,
      language: language || "other",
      origin: (origin || "UNKNOWN") as any,
      completion: (completion || "ONGOING") as any,
      isMature,

      publishType: publishType as any,
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
    select: { id: true, slug: true },
  });

  if (seriesTitle?.trim()) {
    await assignWorkToSeries(prisma, {
      workId: work.id,
      userId: authorId,
      seriesTitle,
      seriesOrder,
    }).catch(() => {});
  }

  return { ok: true, workId: work.id, slug: work.slug, work };
}

export async function patchAdminWorkPublishType(workId: string, publishType: string): Promise<{ ok: boolean }> {
  const valid = ["ORIGINAL", "TRANSLATION", "REUPLOAD"] as const;
  if (!(valid as readonly string[]).includes(publishType)) throw new Error("Invalid publishType");

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, authorId: true } });
  if (!work) throw new Error("Work not found");

  await prisma.work.update({
    where: { id: workId },
    data: {
      publishType: publishType as (typeof valid)[number],
      translatorId: publishType === "TRANSLATION" ? work.authorId : null,
    },
  });

  return { ok: true };
}
