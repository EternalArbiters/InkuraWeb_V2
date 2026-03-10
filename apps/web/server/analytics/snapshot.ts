import "server-only";

import prisma from "@/server/db/prisma";

export type AnalyticsWorkSnapshot = {
  workId: string;
  ownerUserId: string | null;
  workType: "NOVEL" | "COMIC" | null;
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" | null;
  comicType: string | null;
  workOrigin: string | null;
  translationLanguage: string | null;
  isMature: boolean | null;
  isDeviantLove: boolean | null;
  genreIds: string[];
  primaryGenreId: string | null;
};

const workSnapshotSelect = {
  id: true,
  authorId: true,
  type: true,
  publishType: true,
  comicType: true,
  origin: true,
  language: true,
  isMature: true,
  deviantLoveTags: { select: { id: true } },
  genres: { select: { id: true } },
} as const;

export async function getAnalyticsWorkSnapshot(workId: string): Promise<AnalyticsWorkSnapshot | null> {
  if (!workId) return null;
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: workSnapshotSelect,
  });
  if (!work) return null;

  const genreIds = work.genres.map((genre) => genre.id);
  return {
    workId: work.id,
    ownerUserId: work.authorId ?? null,
    workType: work.type ?? null,
    publishType: work.publishType ?? null,
    comicType: work.comicType ?? null,
    workOrigin: work.origin ?? null,
    translationLanguage: work.language ?? null,
    isMature: work.isMature ?? null,
    isDeviantLove: work.deviantLoveTags.length > 0,
    genreIds,
    primaryGenreId: genreIds[0] ?? null,
  };
}

export async function getAnalyticsChapterSnapshot(chapterId: string): Promise<(AnalyticsWorkSnapshot & { chapterId: string }) | null> {
  if (!chapterId) return null;
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      work: { select: workSnapshotSelect },
    },
  });
  if (!chapter?.work) return null;

  const base = await getAnalyticsWorkSnapshot(chapter.work.id);
  if (!base) return null;
  return {
    ...base,
    chapterId: chapter.id,
  };
}
