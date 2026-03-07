import "server-only";

import prisma from "@/server/db/prisma";
import { getActiveDeviantLoveTagsBase, getActiveGenresBase, getActiveTagsBase, getActiveWarningTagsBase } from "@/server/cache/taxonomy";
import { uniqueDeviantLoveCatalog } from "@/lib/deviantLoveCatalog";
import { slugify } from "@/lib/slugify";
import { NSFW_TAG_CATALOG, slugifyTag } from "@/lib/warningCatalog";

const MAX_GENRES = 200;
const MAX_WARNINGS = 100;
const MAX_DEVIANT = 200;

let warningTagsEnsured = false;
let deviantLoveTagsEnsured = false;

function normalizeTake(take: number | undefined, max: number, fallback: number) {
  return Math.min(max, Math.max(1, take ?? fallback));
}

export async function listActiveGenres(options: { q?: string; take?: number } = {}) {
  const take = normalizeTake(options.take, MAX_GENRES, MAX_GENRES);
  const q = (options.q || "").trim().toLowerCase();

  const base = await getActiveGenresBase();
  const filtered = q
    ? base.filter((genre) => genre.name.toLowerCase().includes(q) || genre.slug.toLowerCase().includes(q))
    : base;

  return filtered.slice(0, take).map((genre) => ({
    id: genre.id,
    name: genre.name,
    slug: genre.slug,
    _count: { works: genre.worksCount },
  }));
}

export async function listActiveTags(options: { q?: string; take?: number } = {}) {
  const take = normalizeTake(options.take, 200, 20);
  const q = (options.q || "").trim().toLowerCase();

  const base = await getActiveTagsBase();
  const filtered = q
    ? base.filter((tag) => tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q))
    : base;

  return filtered.slice(0, take).map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

async function ensureWarningTagsExist() {
  if (warningTagsEnsured) return;

  const wanted = NSFW_TAG_CATALOG.map((name, idx) => ({
    name,
    slug: slugifyTag(name),
    sortOrder: idx * 10,
  })).filter((tag) => tag.slug);

  const slugs = wanted.map((tag) => tag.slug);
  if (!slugs.length) {
    warningTagsEnsured = true;
    return;
  }

  try {
    const existing = await prisma.warningTag.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((tag) => tag.slug));
    const missing = wanted.filter((tag) => !existingSlugs.has(tag.slug));

    if (missing.length) {
      await prisma.warningTag.createMany({
        data: missing.map((tag) => ({
          name: tag.name,
          slug: tag.slug,
          isSystem: true,
          isActive: true,
          sortOrder: tag.sortOrder,
        })),
        skipDuplicates: true,
      });
    }
  } finally {
    warningTagsEnsured = true;
  }
}

export async function listActiveWarningTags(options: { q?: string; take?: number } = {}) {
  await ensureWarningTagsExist();

  const take = normalizeTake(options.take, MAX_WARNINGS, MAX_WARNINGS);
  const q = (options.q || "").trim().toLowerCase();

  const base = await getActiveWarningTagsBase();
  const filtered = q
    ? base.filter((tag) => tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q))
    : base;

  return filtered.slice(0, take).map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

async function ensureDeviantLoveTagsExist() {
  if (deviantLoveTagsEnsured) return;

  try {
    const wanted = uniqueDeviantLoveCatalog()
      .map((name, idx) => ({ name, slug: slugify(name), sortOrder: idx * 10 }))
      .filter((tag) => tag.slug);
    const slugs = wanted.map((tag) => tag.slug);
    if (!slugs.length) return;

    const existing = await prisma.deviantLoveTag.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((tag) => tag.slug));
    const missing = wanted.filter((tag) => !existingSlugs.has(tag.slug));

    if (missing.length) {
      await prisma.deviantLoveTag.createMany({
        data: missing.map((tag) => ({
          name: tag.name,
          slug: tag.slug,
          isSystem: true,
          isActive: true,
          sortOrder: tag.sortOrder,
        })),
        skipDuplicates: true,
      });
    }
  } finally {
    deviantLoveTagsEnsured = true;
  }
}

export async function listActiveDeviantLoveTags(options: { q?: string; take?: number } = {}) {
  await ensureDeviantLoveTagsExist();

  const take = normalizeTake(options.take, MAX_DEVIANT, MAX_DEVIANT);
  const q = (options.q || "").trim().toLowerCase();

  const base = await getActiveDeviantLoveTagsBase();
  const filtered = q
    ? base.filter((tag) => tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q))
    : base;

  return filtered.slice(0, take).map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}
