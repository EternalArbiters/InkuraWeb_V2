import "server-only";

import prisma from "@/lib/prisma";

export type NotifyNewChapterArgs = {
  workId: string;
  chapterId: string;
  actorId: string;
};

export async function notifyNewChapter({ workId, chapterId, actorId }: NotifyNewChapterArgs) {
  // Load enough data for gating + routing.
  const [work, chapter] = await Promise.all([
    prisma.work.findUnique({
      where: { id: workId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        isMature: true,
        deviantLoveTags: { select: { id: true }, take: 1 },
      },
    }),
    prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        workId: true,
        title: true,
        number: true,
        status: true,
        isMature: true,
      },
    }),
  ]);

  if (!work) return { ok: false as const, reason: "work_not_found" as const };
  if (!chapter) return { ok: false as const, reason: "chapter_not_found" as const };
  if (chapter.workId !== work.id) return { ok: false as const, reason: "mismatch" as const };

  // Only notify for public content.
  if (work.status !== "PUBLISHED" || chapter.status !== "PUBLISHED") {
    return { ok: true as const, notified: 0, skipped: "not_published" as const };
  }

  const requiresAdult = !!(work.isMature || chapter.isMature);
  const requiresDeviantLove = work.deviantLoveTags.length > 0;

  const userGate: any = {};
  if (requiresAdult) userGate.adultConfirmed = true;
  if (requiresDeviantLove) {
    userGate.adultConfirmed = true;
    userGate.deviantLoveConfirmed = true;
  }

  const whereUserGate = Object.keys(userGate).length ? { user: userGate } : {};

  // People who explicitly opted-in via favorite/bookmark.
  const [likes, bookmarks] = await Promise.all([
    prisma.workLike.findMany({
      where: { workId, ...(whereUserGate as any) },
      select: { userId: true },
    }),
    prisma.bookmark.findMany({
      where: { workId, ...(whereUserGate as any) },
      select: { userId: true },
    }),
  ]);

  const recipients = new Set<string>();
  for (const r of likes) recipients.add(r.userId);
  for (const r of bookmarks) recipients.add(r.userId);
  recipients.delete(actorId);

  if (recipients.size === 0) return { ok: true as const, notified: 0 };

  const href = `/w/${work.slug}/read/${chapter.id}`;
  const title = `New chapter: ${work.title}`;
  const body = `Chapter ${chapter.number}: ${chapter.title}`;
  const dedupeKey = `new_chapter:${chapter.id}`;

  const data = Array.from(recipients).map((userId) => ({
    userId,
    type: "NEW_CHAPTER" as const,
    title,
    body,
    href,
    workId,
    chapterId: chapter.id,
    actorId,
    dedupeKey,
  }));

  await prisma.notification.createMany({
    data: data as any,
    skipDuplicates: true,
  });

  return { ok: true as const, notified: recipients.size };
}
