import "server-only";

import prisma from "@/server/db/prisma";
import { chapterListItemSelect, commentListInclude } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { getCommunityUserIdentityMap } from "@/server/services/community/identity";
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

function attachChapterContextToTree(nodes: any[], byId: Map<string, any>): any[] {
  return (nodes || []).map((node) => ({
    ...node,
    chapter: String(node?.targetType || "").toUpperCase() === "CHAPTER"
      ? (byId.get(String(node?.targetId || "")) ?? null)
      : (node?.chapter ?? null),
    replies: Array.isArray(node?.replies) ? attachChapterContextToTree(node.replies, byId) : [],
  }));
}

async function enrichCommentRows(rows: any[], viewerUserId?: string | null, options?: { includeUserRating?: boolean; workIdForRating?: string | null }) {
  if (!rows.length) return rows;

  let enriched: any[] = rows as any[];

  if (viewerUserId) {
    const ids = rows.map((c) => c.id);
    const [likes, dislikes] = await Promise.all([
      prisma.commentLike.findMany({
        where: { userId: viewerUserId, commentId: { in: ids } },
        select: { commentId: true },
      }),
      prisma.commentDislike.findMany({
        where: { userId: viewerUserId, commentId: { in: ids } },
        select: { commentId: true },
      }),
    ]);
    const likedSet = new Set(likes.map((x) => x.commentId));
    const dislikedSet = new Set(dislikes.map((x) => x.commentId));
    enriched = enriched.map((c: any) => ({
      ...c,
      viewerLiked: likedSet.has(c.id),
      viewerDisliked: dislikedSet.has(c.id),
    }));
  }

  if (options?.includeUserRating && options.workIdForRating) {
    const userIds = Array.from(new Set(rows.map((c: any) => String(c.userId || "")).filter(Boolean)));
    if (userIds.length) {
      const ratings = await prisma.workRating.findMany({
        where: { workId: options.workIdForRating, userId: { in: userIds } },
        select: { userId: true, value: true },
      });
      const map = new Map(ratings.map((r) => [String(r.userId), r.value]));
      enriched = enriched.map((c: any) => ({ ...c, userRating: map.get(String(c.userId)) ?? null }));
    }
  }

  const identityMap = await getCommunityUserIdentityMap(
    Array.from(new Set(rows.map((c: any) => String(c.userId || "")).filter(Boolean)))
  );

  return enriched.map((row: any) => ({
    ...row,
    user: row.user
      ? {
          ...row.user,
          badges: identityMap.get(String(row.userId || ""))?.badges || [],
        }
      : row.user,
  }));
}

export type FetchCommentsOptions = {
  scope?: string | null;
  targetType?: CommentTargetTypeString | null;
  targetId?: string | null;
  workId?: string | null;
  take?: number;
  max?: number;
  sort?: unknown;
  includeUserRating?: boolean;
};

export async function fetchComments(options: FetchCommentsOptions) {
  const scope = String(options.scope || "")
    .trim()
    .toLowerCase();

  const targetType = safeTargetType(options.targetType);
  const targetId = String(options.targetId || "").trim();
  const workId = String(options.workId || "").trim();

  const take = clampInt(options.take, 40, 1, 100);
  const max = clampInt(options.max, 500, 1, 800);
  const sort = safeCommentSort(options.sort);
  const includeUserRating = !!options.includeUserRating;

  const session = await getSession();

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

    const chapterRows = await prisma.chapter.findMany({
      where: { workId: wid },
      select: chapterListItemSelect,
    });
    const chapterIds = chapterRows.map((c) => c.id);

    if (!chapterIds.length) {
      return { status: 200, body: { ok: true, canModerate, comments: [] } };
    }

    const where: any = {
      targetType: "CHAPTER",
      targetId: { in: chapterIds },
      ...(canModerate ? {} : { isHidden: false }),
    };

    const rows = await prisma.comment.findMany({
      where,
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
      take: max,
      include: commentListInclude,
    });

    const enriched = await enrichCommentRows(rows, session?.user?.id || null);
    const chapterMap = new Map(chapterRows.map((chapter) => [String(chapter.id), chapter]));
    const roots = attachChapterContextToTree(
      sortRootComments(sort, buildCommentTree(enriched)).slice(0, take),
      chapterMap,
    );
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

  const rows = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    take: max,
    include: commentListInclude,
  });

  const enriched = await enrichCommentRows(rows, session?.user?.id || null, {
    includeUserRating: includeUserRating && targetType === "WORK",
    workIdForRating: targetType === "WORK" ? targetId : null,
  });

  const roots = sortRootComments(sort, buildCommentTree(enriched)).slice(0, take);
  return { status: 200, body: { ok: true, canModerate, comments: roots } };
}

export async function fetchCommentsFromRequest(req: Request) {
  const url = new URL(req.url);
  const rawTake = url.searchParams.get("take");
  const rawMax = url.searchParams.get("max");
  const take = rawTake == null ? undefined : Number.parseInt(rawTake, 10);
  const max = rawMax == null ? undefined : Number.parseInt(rawMax, 10);

  return fetchComments({
    scope: url.searchParams.get("scope"),
    targetType: url.searchParams.get("targetType") as CommentTargetTypeString | null,
    targetId: url.searchParams.get("targetId"),
    workId: url.searchParams.get("workId"),
    take: Number.isFinite(take) ? take : undefined,
    max: Number.isFinite(max) ? max : undefined,
    sort: url.searchParams.get("sort"),
    includeUserRating: url.searchParams.get("includeUserRating") === "1",
  });
}
