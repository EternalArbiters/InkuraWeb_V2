import "server-only";

import prisma from "@/server/db/prisma";
import { commentListInclude } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { canModerateForTarget, CommentTargetTypeString } from "./moderation";
import { buildCommentTree, safeCommentSort, sortRootComments } from "./tree";

function safeTargetType(v: unknown): CommentTargetTypeString | null {
  const s = String(v || "").toUpperCase().trim();
  if (s === "WORK" || s === "CHAPTER") return s;
  return null;
}

function clampInt(v: unknown, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function fetchCommentsFromRequest(req: Request) {
  const url = new URL(req.url);

  const scope = String(url.searchParams.get("scope") || "")
    .trim()
    .toLowerCase();

  const targetType = safeTargetType(url.searchParams.get("targetType"));
  const targetId = String(url.searchParams.get("targetId") || "").trim();
  const workId = String(url.searchParams.get("workId") || "").trim();

  // take applies to ROOT comments. Replies are returned under roots.
  const take = clampInt(url.searchParams.get("take"), 40, 1, 100);
  const sort = safeCommentSort(url.searchParams.get("sort"));

  const includeUserRating = url.searchParams.get("includeUserRating") === "1";

  const session = await getSession();

  // Special scope: all comments from all chapters in a work.
  if (scope === "workchapters") {
    const wid = workId || targetId;
    if (!wid) {
      return { status: 400, body: { error: "workId is required" } };
    }

    const canModerate = await canModerateForTarget({
      session,
      targetType: "WORK",
      targetId: wid,
    });

    const chapterIds = (
      await prisma.chapter.findMany({
        where: { workId: wid },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (!chapterIds.length) {
      return { status: 200, body: { ok: true, canModerate, comments: [] } };
    }

    const where: any = {
      targetType: "CHAPTER",
      targetId: { in: chapterIds },
      ...(canModerate ? {} : { isHidden: false }),
    };

    // Fetch enough rows to build the reply tree.
    const query: any = {
      where,
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
      take: clampInt(url.searchParams.get("max"), 500, 1, 800),
      include: commentListInclude,
    };

    const rows = await prisma.comment.findMany(query);
    let enriched: any[] = rows as any;

    if (session?.user?.id && rows.length) {
      const ids = rows.map((c) => c.id);
      const [likes, dislikes] = await Promise.all([
        prisma.commentLike.findMany({
          where: { userId: session.user.id, commentId: { in: ids } },
          select: { commentId: true },
        }),
        prisma.commentDislike.findMany({
          where: { userId: session.user.id, commentId: { in: ids } },
          select: { commentId: true },
        }),
      ]);
      const likedSet = new Set(likes.map((x) => x.commentId));
      const dislikedSet = new Set(dislikes.map((x) => x.commentId));
      enriched = rows.map((c: any) => ({
        ...c,
        viewerLiked: likedSet.has(c.id),
        viewerDisliked: dislikedSet.has(c.id),
      }));
    }

    const roots = sortRootComments(sort, buildCommentTree(enriched)).slice(0, take);
    return { status: 200, body: { ok: true, canModerate, comments: roots } };
  }

  if (!targetType || !targetId) {
    return { status: 400, body: { error: "targetType and targetId are required" } };
  }

  const canModerate = await canModerateForTarget({
    session,
    targetType,
    targetId,
  });

  const where: any = {
    targetType,
    targetId,
    ...(canModerate ? {} : { isHidden: false }),
  };

  const query: any = {
    where,
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    take: clampInt(url.searchParams.get("max"), 500, 1, 800),
    include: commentListInclude,
  };

  const rows = await prisma.comment.findMany(query);
  let enriched: any[] = rows as any;

  if (session?.user?.id && rows.length) {
    const ids = rows.map((c) => c.id);
    const [likes, dislikes] = await Promise.all([
      prisma.commentLike.findMany({
        where: { userId: session.user.id, commentId: { in: ids } },
        select: { commentId: true },
      }),
      prisma.commentDislike.findMany({
        where: { userId: session.user.id, commentId: { in: ids } },
        select: { commentId: true },
      }),
    ]);
    const likedSet = new Set(likes.map((x) => x.commentId));
    const dislikedSet = new Set(dislikes.map((x) => x.commentId));
    enriched = rows.map((c: any) => ({
      ...c,
      viewerLiked: likedSet.has(c.id),
      viewerDisliked: dislikedSet.has(c.id),
    }));
  }

  if (includeUserRating && targetType === "WORK" && rows.length) {
    const userIds = Array.from(new Set(rows.map((c: any) => String(c.userId))));
    const ratings = await prisma.workRating.findMany({
      where: { workId: targetId, userId: { in: userIds } },
      select: { userId: true, value: true },
    });
    const map = new Map(ratings.map((r) => [String(r.userId), r.value]));
    enriched = enriched.map((c: any) => ({ ...c, userRating: map.get(String(c.userId)) ?? null }));
  }

  const roots = sortRootComments(sort, buildCommentTree(enriched)).slice(0, take);

  return { status: 200, body: { ok: true, canModerate, comments: roots } };
}
