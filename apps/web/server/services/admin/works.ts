import "server-only";

import prisma from "@/server/db/prisma";

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
