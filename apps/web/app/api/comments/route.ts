import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

type TargetType = "WORK" | "CHAPTER";

type SortMode = "new" | "top";

function safeTargetType(v: unknown): TargetType | null {
  const s = String(v || "").toUpperCase().trim();
  if (s === "WORK" || s === "CHAPTER") return s;
  return null;
}

function safeSort(v: unknown): SortMode {
  const s = String(v || "").toLowerCase().trim();
  return s === "top" ? "top" : "new";
}

function clampInt(v: unknown, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
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
  const take = clampInt(url.searchParams.get("take"), 40, 1, 100);
  const sort = safeSort(url.searchParams.get("sort"));

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

    const orderBy: any =
      sort === "top"
        ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }]
        : [{ createdAt: "desc" as const }, { id: "desc" as const }];

    const query: any = {
      where,
      orderBy,
      take,
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        attachments: {
          include: {
            media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
          },
        },
      },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const comments = await prisma.comment.findMany(query);

    // Viewer like/dislike flags
    let out: any[] = comments as any;
    if (session?.user?.id && comments.length) {
      const ids = comments.map((c) => c.id);

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

      out = comments.map((c: any) => ({
        ...c,
        viewerLiked: likedSet.has(c.id),
        viewerDisliked: dislikedSet.has(c.id),
      }));
    }

    return NextResponse.json({ ok: true, canModerate, comments: out });
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

  const orderBy: any =
    sort === "top"
      ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }]
      : [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const query: any = {
    where,
    orderBy,
    take,
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: {
        include: {
          media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } },
        },
      },
    },
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const comments = await prisma.comment.findMany(query);

  // Viewer like/dislike flags
  let out: any[] = comments as any;
  if (session?.user?.id && comments.length) {
    const ids = comments.map((c) => c.id);

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

    out = comments.map((c: any) => ({
      ...c,
      viewerLiked: likedSet.has(c.id),
      viewerDisliked: dislikedSet.has(c.id),
    }));
  }

return NextResponse.json({ ok: true, canModerate, comments: out });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const targetType = safeTargetType(body?.targetType);
  const targetId = String(body?.targetId || "").trim();
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

  return NextResponse.json({ ok: true, comment: created }, { status: 201 });
}
