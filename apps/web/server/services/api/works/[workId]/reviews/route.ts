import "server-only";

import prisma from "@/server/db/prisma";
import { userPublicSelect } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { ensureCanViewWorkReviews, listWorkReviews } from "@/server/services/reviews/listWorkReviews";

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

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const url = new URL(req.url);
  const res = await listWorkReviews({
    workId,
    sort: url.searchParams.get("sort"),
    take: url.searchParams.get("take"),
  });
  return json(res.body, { status: res.status });
});

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const gate = await ensureCanViewWorkReviews(workId);
  if (!gate.ok) return json(gate.body, { status: gate.status });

  const bodyJson = await req.json().catch(() => ({} as any));
  const rating = clampRating(Number(bodyJson?.rating));
  const title = cleanText(bodyJson?.title, 120) || null;
  const body = cleanText(bodyJson?.body, 10000);
  const isSpoiler = !!bodyJson?.isSpoiler;

  if (!rating) return json({ error: "rating must be 1..5" }, { status: 400 });
  if (!body) return json({ error: "body is required" }, { status: 400 });

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { workId_userId: { workId, userId } },
        update: { rating, title, body, isSpoiler },
        create: { workId, userId, rating, title, body, isSpoiler },
        include: { user: { select: userPublicSelect } },
      });

      await tx.workRating.upsert({
        where: { userId_workId: { userId, workId } },
        update: { value: rating },
        create: { userId, workId, value: rating },
      });

      const agg = await tx.workRating.aggregate({
        where: { workId },
        _avg: { value: true },
        _count: { value: true },
      });

      const ratingAvg = Number(agg._avg.value ?? 0);
      const ratingCount = Number(agg._count.value ?? 0);

      await tx.work.update({ where: { id: workId }, data: { ratingAvg, ratingCount } });

      return { review, ratingAvg, ratingCount };
    });

    return json({ ok: true, review: result.review, ratingAvg: result.ratingAvg, ratingCount: result.ratingCount });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
