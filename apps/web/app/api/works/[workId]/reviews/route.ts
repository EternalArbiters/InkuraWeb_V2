import prisma from "@/server/db/prisma";
import { userPublicSelect } from "@/server/db/selectors";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

type SortMode = "helpful" | "top" | "bottom" | "newest" | "oldest";

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

async function getViewer() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, adultConfirmed: true, deviantLoveConfirmed: true },
  });
  return user;
}

async function ensureCanViewWork(workId: string) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      status: true,
      authorId: true,
      isMature: true,
      genres: { select: { slug: true } },
      deviantLoveTags: { select: { slug: true }, take: 1 },
    },
  });
  if (!work || work.status !== "PUBLISHED") {
    return { ok: false as const, status: 404, payload: { error: "Work not found" } };
  }

  const viewer = await getViewer();
  const isOwner = !!viewer?.id && viewer.id === work.authorId;
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove =
    isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  const hasLegacyDeviantGenre = Array.isArray(work.genres) && work.genres.some((g: any) => legacyDeviant.has(String(g.slug || "")));
  const hasDeviantTags = work.deviantLoveTags.length > 0;

  const requiresMatureGate = work.isMature && !canViewMature;
  const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviantGenre) && !canViewDeviantLove;

  if (requiresMatureGate || requiresDeviantGate) {
    return {
      ok: false as const,
      status: 403,
      payload: {
        gated: true,
        gateReason: requiresMatureGate && requiresDeviantGate ? "BOTH" : requiresDeviantGate ? "DEVIANT_LOVE" : "MATURE",
      },
    };
  }

  return { ok: true as const, viewer, work };
}

function safeSort(v: unknown): SortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "helpful") return "helpful";
  if (s === "top") return "top";
  if (s === "bottom") return "bottom";
  if (s === "oldest") return "oldest";
  if (s === "newest" || s === "latest" || s === "new") return "newest";
  return "helpful";
}

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const url = new URL(req.url);

  const gate = await ensureCanViewWork(workId);
  if (!gate.ok) return json(gate.payload, { status: gate.status });

  const viewer = gate.viewer;
  const sort = safeSort(url.searchParams.get("sort"));

  const takeRaw = parseInt(url.searchParams.get("take") || "20", 10);
  const take = Math.max(1, Math.min(50, Number.isFinite(takeRaw) ? takeRaw : 20));

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : sort === "oldest"
      ? [{ createdAt: "asc" as const }]
      : sort === "bottom"
      ? [{ rating: "asc" as const }, { createdAt: "desc" as const }]
      : sort === "top"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }];

  const reviews = await prisma.review.findMany({
    where: { workId },
    orderBy,
    take,
    include: {
      user: { select: userPublicSelect },
    },
  });

  const ids = reviews.map((r) => r.id);

  let voted = new Set<string>();
  let myReviewId: string | null = null;

  if (viewer?.id && ids.length) {
    const [votes, mine] = await Promise.all([
      prisma.reviewVote.findMany({ where: { userId: viewer.id, reviewId: { in: ids } }, select: { reviewId: true } }),
      prisma.review.findUnique({ where: { workId_userId: { workId, userId: viewer.id } }, select: { id: true } }),
    ]);

    voted = new Set(votes.map((v) => v.reviewId));
    myReviewId = mine?.id ?? null;
  }

  return json({
    ok: true,
    sort,
    myReviewId,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isSpoiler: r.isSpoiler,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
      viewerVoted: viewer?.id ? voted.has(r.id) : false,
      isMine: viewer?.id ? r.userId === viewer.id : false,
    })),
  });
});

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const gate = await ensureCanViewWork(workId);
  if (!gate.ok) return json(gate.payload, { status: gate.status });

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

      // Keep WorkRating in sync (used by existing RatingStars)
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
