import "server-only";

import { unstable_cache } from "next/cache";
import prisma from "@/server/db/prisma";

export type ActiveGenreBase = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  worksCount: number;
};

export type ActiveTaxonomyBase = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

// NOTE:
// - Base taxonomy reads stay cached here so page render + API route share the same hot path.
// - Public GET routes may also send CDN cache headers, but DB invalidation still happens here.
// - Admin mutations call `revalidateTag('taxonomy')` to bust this cache.

export const getActiveGenresBase = unstable_cache(
  async (): Promise<ActiveGenreBase[]> => {
    const rows = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        _count: { select: { works: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sortOrder: r.sortOrder,
      worksCount: r._count.works,
    }));
  },
  ["taxonomy:genres:v1"],
  { tags: ["taxonomy"], revalidate: 60 }
);

export const getActiveTagsBase = unstable_cache(
  async (): Promise<ActiveTaxonomyBase[]> => {
    return prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, sortOrder: true },
    });
  },
  ["taxonomy:tags:v1"],
  { tags: ["taxonomy"], revalidate: 60 }
);

export const getActiveWarningTagsBase = unstable_cache(
  async (): Promise<ActiveTaxonomyBase[]> => {
    return prisma.warningTag.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, sortOrder: true },
    });
  },
  ["taxonomy:warnings:v1"],
  { tags: ["taxonomy"], revalidate: 60 }
);

export const getActiveDeviantLoveTagsBase = unstable_cache(
  async (): Promise<ActiveTaxonomyBase[]> => {
    return prisma.deviantLoveTag.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, sortOrder: true },
    });
  },
  ["taxonomy:deviant-love:v1"],
  { tags: ["taxonomy"], revalidate: 60 }
);
