import "server-only";

import prisma from "@/server/db/prisma";
import { requireSessionUserId } from "@/server/http/auth";

export async function listViewerProgress(input?: { take?: number }) {
  const userId = await requireSessionUserId();
  const take = Math.min(100, Math.max(1, Number(input?.take ?? 50) || 50));

  const progress = await prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      work: { select: { id: true, slug: true, title: true, type: true } },
      chapter: { select: { id: true, number: true, label: true, title: true } },
    },
  });

  return { progress };
}
