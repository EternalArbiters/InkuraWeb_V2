import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

function clampRating(v: number) {
  if (!Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 1 || n > 5) return null;
  return n;
}

function cleanText(v: unknown, max = 5000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

async function getMe(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, workId: true, rating: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "ADMIN" && existing.userId !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bodyJson = await req.json().catch(() => ({} as any));

  const ratingMaybe = bodyJson?.rating !== undefined ? clampRating(Number(bodyJson.rating)) : null;
  if (bodyJson?.rating !== undefined && !ratingMaybe) return NextResponse.json({ error: "rating must be 1..5" }, { status: 400 });

  const title = bodyJson?.title !== undefined ? (cleanText(bodyJson.title, 120) || null) : undefined;
  const body = bodyJson?.body !== undefined ? cleanText(bodyJson.body, 10000) : undefined;
  const isSpoiler = bodyJson?.isSpoiler !== undefined ? !!bodyJson.isSpoiler : undefined;

  if (bodyJson?.body !== undefined && !body) return NextResponse.json({ error: "body is required" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...(ratingMaybe ? { rating: ratingMaybe } : {}),
          ...(title !== undefined ? { title } : {}),
          ...(body !== undefined ? { body } : {}),
          ...(isSpoiler !== undefined ? { isSpoiler } : {}),
        },
        include: { user: { select: { id: true, username: true, name: true, image: true } } },
      });

      if (ratingMaybe && ratingMaybe !== existing.rating) {
        await tx.workRating.upsert({
          where: { userId_workId: { userId: existing.userId, workId: existing.workId } },
          update: { value: ratingMaybe },
          create: { userId: existing.userId, workId: existing.workId, value: ratingMaybe },
        });

        const agg = await tx.workRating.aggregate({
          where: { workId: existing.workId },
          _avg: { value: true },
          _count: { value: true },
        });

        await tx.work.update({
          where: { id: existing.workId },
          data: {
            ratingAvg: Number(agg._avg.value ?? 0),
            ratingCount: Number(agg._count.value ?? 0),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ ok: true, review: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, workId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "ADMIN" && existing.userId !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.review.delete({ where: { id: reviewId } });

    // NOTE: We intentionally keep WorkRating as-is; ratings and reviews are related but not identical.
    // (The user can adjust rating separately via RatingStars.)

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
