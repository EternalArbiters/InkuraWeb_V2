"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReviewItem, ReviewSort } from "./types";

export function useReviews({
  workId,
  initialMyRating,
  initialReviews,
  initialMyReviewId,
}: {
  workId: string;
  initialMyRating: number | null;
  initialReviews?: ReviewItem[];
  initialMyReviewId?: string | null;
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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const skippedInitialFetchRef = useRef(hasInitial);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(initialMyRating ?? 0);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftBody, setDraftBody] = useState<string>("");
  const [draftSpoiler, setDraftSpoiler] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ sort, take: "30" });
      const res = await fetch(`/api/works/${workId}/reviews?${qs.toString()}`, {
        cache: "no-store" as any,
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || (data?.gated ? "Locked" : "Failed to load reviews"));
        setLoading(false);
        return;
      }
      setReviews((data?.reviews || []) as ReviewItem[]);
      setMyReviewId((data?.myReviewId as string) || null);
      setLoading(false);
    } catch {
      setError("Failed to load reviews");
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

      setModalOpen(false);
      await fetchReviews();
      router.refresh();
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
      await fetchReviews();
      router.refresh();
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

      setReviews((prev) =>
        prev.map((r) =>
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
        )
      );
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
