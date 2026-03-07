import "server-only";

import prisma from "@/server/db/prisma";

export async function getWorkSlugById(workId: string) {
  if (!workId) return null;
  return prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, slug: true, status: true },
  });
}
