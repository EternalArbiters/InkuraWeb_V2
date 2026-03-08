"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getOrFetchClientResource, mutateClientResource, seedClientResource } from "@/lib/clientResourceCache";
import type { ReviewItem, ReviewSort } from "./types";

type ReviewsPayload = {
  reviews: ReviewItem[];
  myReviewId: string | null;
  ratingAvg?: number;
  ratingCount?: number;
};

function compareReviews(a: ReviewItem, b: ReviewItem, sort: ReviewSort) {
  const createdA = new Date(a.createdAt).getTime();
  const createdB = new Date(b.createdAt).getTime();

  if (sort === "newest") return createdB - createdA;
  if (sort === "oldest") return createdA - createdB;
  if (sort === "top") {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.helpfulCount !== a.helpfulCount) return b.helpfulCount - a.helpfulCount;
    return createdB - createdA;
  }
  if (sort === "bottom") {
    if (a.rating !== b.rating) return a.rating - b.rating;
    if (b.helpfulCount !== a.helpfulCount) return b.helpfulCount - a.helpfulCount;
    return createdB - createdA;
  }
  if (b.helpfulCount !== a.helpfulCount) return b.helpfulCount - a.helpfulCount;
  return createdB - createdA;
}

function upsertReview(reviews: ReviewItem[], review: ReviewItem, sort: ReviewSort) {
  const next = [...reviews.filter((item) => item.id !== review.id), review];
  next.sort((a, b) => compareReviews(a, b, sort));
  return next;
}

export function useReviews({
  workId,
  initialMyRating,
  initialReviews,
  initialMyReviewId,
  initialRatingAvg,
  initialRatingCount,
}: {
  workId: string;
  initialMyRating: number | null;
  initialReviews?: ReviewItem[];
  initialMyReviewId?: string | null;
  initialRatingAvg: number;
  initialRatingCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const hasInitial = !!initialReviews;
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<ReviewSort>("helpful");
  const [reviews, setReviews] = useState<ReviewItem[]>(() => initialReviews || []);
  const [myReviewId, setMyReviewId] = useState<string | null>(initialMyReviewId || null);
  const [ratingAvg, setRatingAvg] = useState<number>(initialRatingAvg || 0);
  const [ratingCount, setRatingCount] = useState<number>(initialRatingCount || 0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const skippedInitialFetchRef = useRef(hasInitial);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(initialMyRating ?? 0);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftBody, setDraftBody] = useState<string>("");
  const [draftSpoiler, setDraftSpoiler] = useState(false);

  const cacheKey = `reviews:${workId}:${sort}`;

  useEffect(() => {
    if (!hasInitial) return;
    seedClientResource<ReviewsPayload>(
      `reviews:${workId}:helpful`,
      {
        reviews: initialReviews || [],
        myReviewId: initialMyReviewId || null,
        ratingAvg: initialRatingAvg,
        ratingCount: initialRatingCount,
      },
      20_000
    );
  }, [hasInitial, initialMyReviewId, initialRatingAvg, initialRatingCount, initialReviews, workId]);

  const syncCache = (next: {
    reviews?: ReviewItem[];
    myReviewId?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
  }) => {
    mutateClientResource<ReviewsPayload>(
      cacheKey,
      (current) => ({
        reviews: next.reviews ?? current?.reviews ?? [],
        myReviewId: next.myReviewId !== undefined ? next.myReviewId : current?.myReviewId ?? null,
        ratingAvg: next.ratingAvg ?? current?.ratingAvg ?? ratingAvg,
        ratingCount: next.ratingCount ?? current?.ratingCount ?? ratingCount,
      }),
      20_000
    );
  };

  const fetchReviews = async ({ force = false }: { force?: boolean } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrFetchClientResource<ReviewsPayload>(
        cacheKey,
        async () => {
          const qs = new URLSearchParams({ sort, take: "30" });
          const res = await fetch(`/api/works/${workId}/reviews?${qs.toString()}`, {
            cache: "no-store" as any,
          });
          const json = await res.json().catch(() => ({} as any));
          if (!res.ok) {
            throw new Error(json?.error || (json?.gated ? "Locked" : "Failed to load reviews"));
          }
          return {
            reviews: (json?.reviews || []) as ReviewItem[],
            myReviewId: (json?.myReviewId as string) || null,
            ratingAvg: typeof json?.ratingAvg === "number" ? json.ratingAvg : undefined,
            ratingCount: typeof json?.ratingCount === "number" ? json.ratingCount : undefined,
          };
        },
        { ttlMs: 15_000, force }
      );

      setReviews(data.reviews);
      setMyReviewId(data.myReviewId || null);
      if (typeof data.ratingAvg === "number") setRatingAvg(data.ratingAvg);
      if (typeof data.ratingCount === "number") setRatingCount(data.ratingCount);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Failed to load reviews");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (skippedInitialFetchRef.current && sort === "helpful") {
      skippedInitialFetchRef.current = false;
      return;
    }
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId, sort]);

  const myReview = useMemo(() => {
    if (!myReviewId) return null;
    return reviews.find((r) => r.id === myReviewId) || null;
  }, [myReviewId, reviews]);

  const openComposer = () => {
    if (myReview) {
      setDraftRating(myReview.rating);
      setDraftTitle(myReview.title || "");
      setDraftBody(myReview.body || "");
      setDraftSpoiler(!!myReview.isSpoiler);
    } else {
      setDraftRating(initialMyRating ?? 0);
      setDraftTitle("");
      setDraftBody("");
      setDraftSpoiler(false);
    }
    setModalOpen(true);
  };

  const closeComposer = () => setModalOpen(false);

  const submit = () => {
    setError(null);

    const rating = Math.round(draftRating);
    const body = draftBody.trim();
    if (rating < 1 || rating > 5) {
      setError("Rating must be 1..5");
      return;
    }
    if (!body) {
      setError("Review text is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        rating,
        title: draftTitle.trim() || null,
        body,
        isSpoiler: draftSpoiler,
      };

      const isEdit = !!myReview;
      const url = isEdit ? `/api/reviews/${myReview!.id}` : `/api/works/${workId}/reviews`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Failed to save review");
        return;
      }

      const nextReview = data?.review as ReviewItem | undefined;
      if (!nextReview) {
        await fetchReviews({ force: true });
        setModalOpen(false);
        return;
      }

      setModalOpen(false);
      setReviews((prev) => {
        const next = upsertReview(prev, nextReview, sort);
        syncCache({
          reviews: next,
          myReviewId: nextReview.id,
          ratingAvg: typeof data?.ratingAvg === "number" ? data.ratingAvg : undefined,
          ratingCount: typeof data?.ratingCount === "number" ? data.ratingCount : undefined,
        });
        return next;
      });
      setMyReviewId(nextReview.id);
      if (typeof data?.ratingAvg === "number") setRatingAvg(data.ratingAvg);
      if (typeof data?.ratingCount === "number") setRatingCount(data.ratingCount);
    });
  };

  const del = (reviewId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Failed to delete review");
        return;
      }

      setReviews((prev) => {
        const next = prev.filter((review) => review.id !== reviewId);
        syncCache({ reviews: next, myReviewId: myReviewId === reviewId ? null : myReviewId });
        return next;
      });
      if (myReviewId === reviewId) {
        setMyReviewId(null);
      }
    });
  };

  const toggleHelpful = (reviewId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Failed");
        return;
      }

      setReviews((prev) => {
        const next = prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                viewerVoted: !!data.voted,
                helpfulCount:
                  typeof data.helpfulCount === "number"
                    ? data.helpfulCount
                    : r.helpfulCount,
              }
            : r
        );
        const sorted = [...next].sort((a, b) => compareReviews(a, b, sort));
        syncCache({ reviews: sorted });
        return sorted;
      });
    });
  };

  const toggleSpoiler = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return {
    isPending,
    loading,
    error,
    sort,
    setSort,
    reviews,
    myReview,
    myReviewId,
    ratingAvg,
    ratingCount,
    revealed,
    modalOpen,
    draftRating,
    setDraftRating,
    draftTitle,
    setDraftTitle,
    draftBody,
    setDraftBody,
    draftSpoiler,
    setDraftSpoiler,
    openComposer,
    closeComposer,
    submit,
    del,
    toggleHelpful,
    toggleSpoiler,
  };
}
