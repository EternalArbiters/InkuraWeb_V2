"use client";

import { useMemo } from "react";
import Stars from "./reviews/Stars";
import ReviewCard from "./reviews/ReviewCard";
import ReviewModal from "./reviews/ReviewModal";
import type { ReviewItem, ReviewSort } from "./reviews/types";
import { useReviews } from "./reviews/useReviews";

export default function ReviewSection({
  workId,
  ratingAvg,
  ratingCount,
  initialMyRating,
  initialReviews,
  initialMyReviewId,
}: {
  workId: string;
  ratingAvg: number;
  ratingCount: number;
  initialMyRating: number | null;
  initialReviews?: ReviewItem[];
  initialMyReviewId?: string | null;
}) {
  const {
    isPending,
    loading,
    error,
    sort,
    setSort,
    reviews,
    myReview,
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
  } = useReviews({ workId, initialMyRating, initialReviews, initialMyReviewId });

  const avgLabel = useMemo(() => {
    if (!ratingCount) return "0.0";
    return (Math.round(ratingAvg * 10) / 10).toFixed(1);
  }, [ratingAvg, ratingCount]);

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Reviews</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Stars value={Math.round(ratingAvg || 0)} />
              </span>
              <span>
                <b>{avgLabel}</b> <span className="opacity-70">({ratingCount})</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReviewSort)}
              disabled={isPending}
              className="rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/20 px-3 py-2 text-xs font-semibold"
              aria-label="Sort reviews"
              title="Sort reviews"
            >
              <option value="helpful">Helpful</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              type="button"
              onClick={openComposer}
              disabled={isPending}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
            >
              {myReview ? "Edit your review" : "Write a review"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Loading reviews…
            </div>
          ) : reviews.length ? (
            <div className="grid gap-3">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  revealed={!!revealed[r.id]}
                  isPending={isPending}
                  onEdit={openComposer}
                  onDelete={() => del(r.id)}
                  onToggleHelpful={() => toggleHelpful(r.id)}
                  onToggleSpoiler={() => toggleSpoiler(r.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              No reviews yet. Be the first!
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        open={modalOpen}
        title={myReview ? "Edit review" : "Write a review"}
        draftRating={draftRating}
        setDraftRating={setDraftRating}
        draftTitle={draftTitle}
        setDraftTitle={setDraftTitle}
        draftBody={draftBody}
        setDraftBody={setDraftBody}
        draftSpoiler={draftSpoiler}
        setDraftSpoiler={setDraftSpoiler}
        isPending={isPending}
        onClose={closeComposer}
        onSubmit={submit}
      />
    </section>
  );
}
