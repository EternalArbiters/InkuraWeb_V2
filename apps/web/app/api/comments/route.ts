import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyCommentEvents } from "@/server/services/notifyCommentEvents";

export const runtime = "nodejs";

type TargetType = "WORK" | "CHAPTER";

type SortMode = "latest" | "top" | "oldest";

function safeTargetType(v: unknown): TargetType | null {
  const s = String(v || "").toUpperCase().trim();
  if (s === "WORK" || s === "CHAPTER") return s;
  return null;
}

function safeSort(v: unknown): SortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "top") return "top";
  if (s === "oldest" || s === "bottom") return "oldest";
  // legacy: new
  return "latest";
}

function clampInt(v: unknown, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function sortRoots(mode: SortMode, items: any[]) {
  const pinned = items.filter((x) => !!x?.isPinned);
  const rest = items.filter((x) => !x?.isPinned);

  pinned.sort((a, b) => {
    const ta = +(a.pinnedAt ? new Date(a.pinnedAt) : new Date(a.createdAt));
    const tb = +(b.pinnedAt ? new Date(b.pinnedAt) : new Date(b.createdAt));
    if (tb !== ta) return tb - ta;
    const t2 = +new Date(b.createdAt) - +new Date(a.createdAt);
    if (t2 !== 0) return t2;
    return String(b.id).localeCompare(String(a.id));
  });

  const sorted = (() => {
    if (mode === "top") {
      return rest.sort((a, b) => {
        const lc = (b.likeCount ?? 0) - (a.likeCount ?? 0);
        if (lc !== 0) return lc;
        const t = +new Date(b.createdAt) - +new Date(a.createdAt);
        if (t !== 0) return t;
        return String(b.id).localeCompare(String(a.id));
      });
    }
    if (mode === "oldest") {
      return rest.sort((a, b) => {
        const t = +new Date(a.createdAt) - +new Date(b.createdAt);
        if (t !== 0) return t;
        return String(a.id).localeCompare(String(b.id));
      });
    }
    // latest
    return rest.sort((a, b) => {
      const t = +new Date(b.createdAt) - +new Date(a.createdAt);
      if (t !== 0) return t;
      return String(b.id).localeCompare(String(a.id));
    });
  })();

  return [...pinned, ...sorted];
}

function buildTree(all: any[]) {
  const byId = new Map<string, any>();
  for (const c of all) byId.set(String(c.id), { ...c, replies: [] as any[] });

  const roots: any[] = [];
  for (const node of byId.values()) {
    const pid = node.parentId ? String(node.parentId) : "";
    if (pid && byId.has(pid)) {
      byId.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // replies in chronological order
  const sortReplies = (n: any) => {
    if (Array.isArray(n.replies) && n.replies.length) {
      n.replies.sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt));
      for (const r of n.replies) sortReplies(r);
    }
  };
  for (const r of roots) sortReplies(r);

  return roots;
}

async function canModerateForTarget(session: any, targetType: TargetType, targetId: string) {
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const userId = session.user.id as string;
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({ where: { id: targetId }, select: { authorId: true } });
    return !!w && w.authorId === userId;
  }
  const ch = await prisma.chapter.findUnique({
    where: { id: targetId },
    select: { work: { select: { authorId: true } } },
  });
  return !!ch && ch.work.authorId === userId;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = String(url.searchParams.get("scope") || "")
    .trim()
    .toLowerCase();
  const targetType = safeTargetType(url.searchParams.get("targetType"));
  const targetId = String(url.searchParams.get("targetId") || "").trim();
  const workId = String(url.searchParams.get("workId") || "").trim();
  const cursor = String(url.searchParams.get("cursor") || "").trim() || null;
  // take applies to ROOT comments. Replies are returned under roots.
  const take = clampInt(url.searchParams.get("take"), 40, 1, 100);
  const sort = safeSort(url.searchParams.get("sort"));

  const includeUserRating = url.searchParams.get("includeUserRating") === "1";

  const session = await getServerSession(authOptions);

  // Special scope: all comments from all chapters in a work.
  if (scope === "workchapters") {
    const wid = workId || targetId;
    if (!wid) return NextResponse.json({ error: "workId is required" }, { status: 400 });

    const canModerate = await canModerateForTarget(session, "WORK", wid);
    const chapterIds = (
      await prisma.chapter.findMany({
        where: { workId: wid },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (!chapterIds.length) {
      return NextResponse.json({ ok: true, canModerate, comments: [] });
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
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        attachments: {
          include: {
            media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
          },
        },
      },
    };

    const rows = await prisma.comment.findMany(query);
    let enriched: any[] = rows as any;
    if (session?.user?.id && rows.length) {
      const ids = rows.map((c) => c.id);
      const [likes, dislikes] = await Promise.all([
        prisma.commentLike.findMany({ where: { userId: session.user.id, commentId: { in: ids } }, select: { commentId: true } }),
        prisma.commentDislike.findMany({ where: { userId: session.user.id, commentId: { in: ids } }, select: { commentId: true } }),
      ]);
      const likedSet = new Set(likes.map((x) => x.commentId));
      const dislikedSet = new Set(dislikes.map((x) => x.commentId));
      enriched = rows.map((c: any) => ({ ...c, viewerLiked: likedSet.has(c.id), viewerDisliked: dislikedSet.has(c.id) }));
    }

    const roots = sortRoots(sort, buildTree(enriched)).slice(0, take);
    return NextResponse.json({ ok: true, canModerate, comments: roots });
  }

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
  }

  const canModerate = await canModerateForTarget(session, targetType, targetId);

  const where: any = {
    targetType,
    targetId,
    ...(canModerate ? {} : { isHidden: false }),
  };

  const query: any = {
    where,
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    take: clampInt(url.searchParams.get("max"), 500, 1, 800),
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: {
        include: {
          media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
        },
      },
    },
  };

  const rows = await prisma.comment.findMany(query);
  let enriched: any[] = rows as any;
  if (session?.user?.id && rows.length) {
    const ids = rows.map((c) => c.id);
    const [likes, dislikes] = await Promise.all([
      prisma.commentLike.findMany({ where: { userId: session.user.id, commentId: { in: ids } }, select: { commentId: true } }),
      prisma.commentDislike.findMany({ where: { userId: session.user.id, commentId: { in: ids } }, select: { commentId: true } }),
    ]);
    const likedSet = new Set(likes.map((x) => x.commentId));
    const dislikedSet = new Set(dislikes.map((x) => x.commentId));
    enriched = rows.map((c: any) => ({ ...c, viewerLiked: likedSet.has(c.id), viewerDisliked: dislikedSet.has(c.id) }));
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


  const roots = sortRoots(sort, buildTree(enriched)).slice(0, take);

  return NextResponse.json({ ok: true, canModerate, comments: roots });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const targetType = safeTargetType(body?.targetType);
  const targetId = String(body?.targetId || "").trim();
  const parentId = body?.parentId ? String(body.parentId).trim() : null;
  const text = String(body?.body || "").trim();
  const isSpoiler = !!body?.isSpoiler;

  if (!targetType || !targetId) return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  // Validate target exists
  if (targetType === "WORK") {
    const w = await prisma.work.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!w) return NextResponse.json({ error: "Work not found" }, { status: 404 });
  } else {
    const ch = await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!ch) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Validate parent (if reply)
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, targetType: true, targetId: true, parentId: true, isHidden: true },
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    if (parent.isHidden) return NextResponse.json({ error: "Cannot reply to hidden comment" }, { status: 403 });
    if (parent.targetType !== targetType || parent.targetId !== targetId) {
      return NextResponse.json({ error: "Invalid parent for this target" }, { status: 400 });
    }
    // Limit reply depth to avoid abuse (max 5 levels)
    let depth = 1;
    let cur: string | null = parent.parentId ? String(parent.parentId) : null;
    while (cur) {
      depth += 1;
      if (depth > 5) return NextResponse.json({ error: "Reply thread too deep" }, { status: 400 });
      const next = await prisma.comment.findUnique({ where: { id: cur }, select: { parentId: true } });
      cur = next?.parentId ? String(next.parentId) : null;
    }
  }

  const rawAttachments: unknown[] = Array.isArray(body?.attachments) ? (body.attachments as unknown[]) : [];
  const mediaIds: string[] = rawAttachments
    .map((a) => String((a as any)?.mediaId || (a as any)?.id || "").trim())
    .filter((v) => v.length > 0);

  const uniqueMediaIds: string[] = Array.from(new Set<string>(mediaIds)).slice(0, 3);

  const mediaRows = uniqueMediaIds.length
    ? await prisma.mediaObject.findMany({
        where: { id: { in: uniqueMediaIds } },
        select: { id: true, type: true, url: true, contentType: true, sizeBytes: true },
      })
    : [];

  if (mediaRows.length !== uniqueMediaIds.length) {
    return NextResponse.json({ error: "One or more attachments not found" }, { status: 400 });
  }

  for (const m of mediaRows) {
    if (m.type !== "COMMENT_IMAGE" && m.type !== "COMMENT_GIF") {
      return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        targetType,
        targetId,
        userId: session.user.id,
        parentId: parentId || null,
        body: text,
        isSpoiler,
      },
    });

    if (mediaRows.length) {
      await tx.commentAttachment.createMany({
        data: mediaRows.map((m) => ({
          commentId: comment.id,
          mediaId: m.id,
          type: m.type === "COMMENT_GIF" ? "GIF" : "IMAGE",
        })),
        skipDuplicates: true,
      });
    }

    return tx.comment.findUnique({
      where: { id: comment.id },
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        attachments: {
          include: {
            media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
          },
        },
      },
    });
  });
  try {
    if (created?.id) {
      await notifyCommentEvents({
        commentId: created.id,
        actorId: session.user.id,
        targetType,
        targetId,
        parentId: parentId || null,
        body: text,
      });
    }
  } catch (e) {
    console.error("notifyCommentEvents failed", e);
  }

  return NextResponse.json({ ok: true, comment: created }, { status: 201 });
}
