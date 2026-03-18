import "server-only";

import prisma from "@/server/db/prisma";
import { workCardSelect } from "@/server/db/selectors";
import { profileHotspot } from "@/server/observability/profiling";

function getDraftEntryAt(work: {
  createdAt?: Date | string | null;
  draftChapters?: Array<{ createdAt?: Date | string | null }>;
}) {
  const latestDraftChapterCreatedAt = Array.isArray(work.draftChapters) && work.draftChapters.length > 0
    ? work.draftChapters
        .map((chapter) => (chapter?.createdAt ? new Date(chapter.createdAt) : null))
        .filter((value): value is Date => !!value && Number.isFinite(value.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
    : null;

  const workCreatedAt = work.createdAt ? new Date(work.createdAt) : null;
  return latestDraftChapterCreatedAt ?? workCreatedAt ?? null;
}

export async function listDraftWorksForAdmin(options?: { take?: number }) {
  const take = Math.max(1, Math.min(120, Number(options?.take ?? 20) || 20));

  const works = await profileHotspot("listDraftWorks.findMany", { take }, () =>
    prisma.work.findMany({
      where: {
        OR: [{ status: "DRAFT" }, { chapters: { some: { status: "DRAFT" } } }],
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take,
      select: {
        ...workCardSelect,
        status: true,
        createdAt: true,
        chapters: {
          where: { status: "DRAFT" },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 6,
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })
  );

  return works
    .map((work: any) => {
      const draftEntryAt = getDraftEntryAt({
        createdAt: work.createdAt,
        draftChapters: work.chapters,
      });

      return {
        ...work,
        draftEntryAt,
        updatedAt: draftEntryAt ?? work.updatedAt ?? null,
        lastChapterPublishedAt: null,
      };
    })
    .sort((a: any, b: any) => {
      const ta = new Date(a.draftEntryAt ?? a.updatedAt ?? a.createdAt ?? 0).getTime();
      const tb = new Date(b.draftEntryAt ?? b.updatedAt ?? b.createdAt ?? 0).getTime();
      return tb - ta;
    });
}
