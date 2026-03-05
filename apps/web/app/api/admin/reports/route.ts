import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

type TargetType = "WORK" | "CHAPTER";

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  const commentIds = Array.from(new Set(reports.map((r) => r.targetId))).filter(Boolean);

  const comments = commentIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: {
          id: true,
          body: true,
          isHidden: true,
          createdAt: true,
          targetType: true,
          targetId: true,
          user: { select: { id: true, username: true, name: true, image: true } },
        },
      })
    : [];

  const workIds = Array.from(new Set(comments.filter((c) => c.targetType === "WORK").map((c) => c.targetId)));
  const chapterIds = Array.from(new Set(comments.filter((c) => c.targetType === "CHAPTER").map((c) => c.targetId)));

  const works = workIds.length
    ? await prisma.work.findMany({ where: { id: { in: workIds } }, select: { id: true, title: true, slug: true } })
    : [];
  const chapters = chapterIds.length
    ? await prisma.chapter.findMany({
        where: { id: { in: chapterIds } },
        select: { id: true, title: true, number: true, work: { select: { id: true, title: true, slug: true } } },
      })
    : [];

  const workMap = new Map(works.map((w) => [w.id, w]));
  const chapterMap = new Map(chapters.map((ch) => [ch.id, ch]));

  const commentMap = new Map(
    comments.map((c) => {
      const targetType = c.targetType as TargetType;
      const target =
        targetType === "WORK"
          ? { type: "WORK", work: workMap.get(c.targetId) || null }
          : { type: "CHAPTER", chapter: chapterMap.get(c.targetId) || null };
      return [c.id, { ...c, target }];
    })
  );

  return json({
    ok: true,
    reports: reports.map((r) => ({
      ...r,
      comment: commentMap.get(r.targetId) || null,
    })),
  });
});
