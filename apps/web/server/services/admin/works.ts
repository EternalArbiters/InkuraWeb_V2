import "server-only";

import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";

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
  title: string;
  type: "COMIC" | "NOVEL";
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD";
  language: string;
  creatorUserId: string;
  adminUserId: string;
  description?: string;
};

export async function createAdminWorkOnBehalf(input: CreateAdminWorkInput): Promise<{ ok: boolean; workId: string; slug: string }> {
  const { title, type, publishType, language, creatorUserId, adminUserId, description } = input;

  const creator = await prisma.user.findUnique({ where: { id: creatorUserId }, select: { id: true } });
  if (!creator) throw new Error("Creator user not found");

  // Generate unique slug: slugify title + short random suffix
  const base = slugify(title).slice(0, 60) || "work";
  const suffix = Math.random().toString(36).slice(2, 7);
  const slug = `${base}-${suffix}`;

  const authorId = publishType === "TRANSLATION" ? adminUserId : creatorUserId;
  const translatorId = publishType === "TRANSLATION" ? creatorUserId : null;

  const work = await prisma.work.create({
    data: {
      title: title.trim(),
      slug,
      type,
      publishType,
      language: language || "unknown",
      description: description?.trim() || null,
      authorId,
      translatorId,
      uploadedByAdminId: adminUserId,
      status: "DRAFT",
    },
    select: { id: true, slug: true },
  });

  return { ok: true, workId: work.id, slug: work.slug };
}

export async function patchAdminWorkPublishType(workId: string, publishType: string): Promise<{ ok: boolean }> {
  const valid = ["ORIGINAL", "TRANSLATION", "REUPLOAD"] as const;
  if (!(valid as readonly string[]).includes(publishType)) throw new Error("Invalid publishType");

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) throw new Error("Work not found");

  await prisma.work.update({
    where: { id: workId },
    data: { publishType: publishType as (typeof valid)[number] },
  });

  return { ok: true };
}
