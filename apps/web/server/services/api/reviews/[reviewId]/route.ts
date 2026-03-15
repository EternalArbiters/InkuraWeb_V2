import "server-only";

import prisma from "@/server/db/prisma";
import { userPublicSelect } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

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

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ reviewId: string }> }) => {
  const { reviewId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, workId: true, rating: true } });
  if (!existing) return json({ error: "Not found" }, { status: 404 });
  if (me.role !== "ADMIN" && existing.userId !== me.id) return json({ error: "Forbidden" }, { status: 403 });

  const bodyJson = await req.json().catch(() => ({} as any));

  const ratingMaybe = bodyJson?.rating !== undefined ? clampRating(Number(bodyJson.rating)) : null;
  if (bodyJson?.rating !== undefined && !ratingMaybe) return json({ error: "rating must be 1..5" }, { status: 400 });

  const title = bodyJson?.title !== undefined ? (cleanText(bodyJson.title, 120) || null) : undefined;
  const body = bodyJson?.body !== undefined ? cleanText(bodyJson.body, 10000) : undefined;
  const isSpoiler = bodyJson?.isSpoiler !== undefined ? !!bodyJson.isSpoiler : undefined;

  if (bodyJson?.body !== undefined && !body) return json({ error: "body is required" }, { status: 400 });

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
        include: { user: { select: userPublicSelect } },
      });

      let ratingAvg = 0;
      let ratingCount = 0;

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

        ratingAvg = Number(agg._avg.value ?? 0);
        ratingCount = Number(agg._count.value ?? 0);

        await tx.$executeRaw`UPDATE "Work" SET "ratingAvg" = ${ratingAvg}, "ratingCount" = ${ratingCount} WHERE "id" = ${existing.workId}`;
      } else {
        const currentWork = await tx.work.findUnique({
          where: { id: existing.workId },
          select: { ratingAvg: true, ratingCount: true },
        });
        ratingAvg = Number(currentWork?.ratingAvg ?? 0);
        ratingCount = Number(currentWork?.ratingCount ?? 0);
      }

      return { review: updated, ratingAvg, ratingCount };
    });

    return json({ ok: true, review: result.review, ratingAvg: result.ratingAvg, ratingCount: result.ratingCount });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ reviewId: string }> }) => {
  const { reviewId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, workId: true } });
  if (!existing) return json({ error: "Not found" }, { status: 404 });
  if (me.role !== "ADMIN" && existing.userId !== me.id) return json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.review.delete({ where: { id: reviewId } });

    // NOTE: We intentionally keep WorkRating as-is; ratings and reviews are related but not identical.
    // (The user can adjust rating separately via RatingStars.)

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
