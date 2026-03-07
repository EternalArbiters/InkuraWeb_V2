import "server-only";

import prisma from "@/server/db/prisma";
import { userPublicSelect } from "@/server/db/selectors";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import { getSession } from "@/server/auth/session";

export type ReviewSortMode = "helpful" | "top" | "bottom" | "newest" | "oldest";

export function safeReviewSort(v: unknown): ReviewSortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "helpful") return "helpful";
  if (s === "top") return "top";
  if (s === "bottom") return "bottom";
  if (s === "oldest") return "oldest";
  if (s === "newest" || s === "latest" || s === "new") return "newest";
  return "helpful";
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

export async function ensureCanViewWorkReviews(workId: string) {
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
    return { ok: false as const, status: 404, body: { error: "Work not found" } };
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
      body: {
        gated: true,
        gateReason: requiresMatureGate && requiresDeviantGate ? "BOTH" : requiresDeviantGate ? "DEVIANT_LOVE" : "MATURE",
      },
    };
  }

  return { ok: true as const, viewer, work };
}

export async function listWorkReviews({
  workId,
  sort,
  take,
}: {
  workId: string;
  sort?: unknown;
  take?: number;
}) {
  const gate = await ensureCanViewWorkReviews(workId);
  if (!gate.ok) return gate;

  const viewer = gate.viewer;
  const resolvedSort = safeReviewSort(sort);
  const resolvedTake = Math.max(1, Math.min(50, Number.isFinite(Number(take)) ? Number(take) : 20));

  const orderBy =
    resolvedSort === "newest"
      ? [{ createdAt: "desc" as const }]
      : resolvedSort === "oldest"
      ? [{ createdAt: "asc" as const }]
      : resolvedSort === "bottom"
      ? [{ rating: "asc" as const }, { createdAt: "desc" as const }]
      : resolvedSort === "top"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }];

  const reviews = await prisma.review.findMany({
    where: { workId },
    orderBy,
    take: resolvedTake,
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

  return {
    ok: true as const,
    status: 200,
    body: {
      ok: true,
      sort: resolvedSort,
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
    },
  };
}
