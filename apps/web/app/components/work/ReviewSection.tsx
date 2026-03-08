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
    ratingAvg: liveRatingAvg,
    ratingCount: liveRatingCount,
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
  } = useReviews({
    workId,
    initialMyRating,
    initialReviews,
    initialMyReviewId,
    initialRatingAvg: ratingAvg,
    initialRatingCount: ratingCount,
  });

  const avgLabel = useMemo(() => {
    if (!liveRatingCount) return "0.0";
    return (Math.round(liveRatingAvg * 10) / 10).toFixed(1);
  }, [liveRatingAvg, liveRatingCount]);

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Reviews</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1">
                <Stars value={Math.round(liveRatingAvg || 0)} />
              </span>
              <span>
                <b>{avgLabel}</b> <span className="opacity-70">({liveRatingCount})</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReviewSort)}
              disabled={isPending}
              className="rounded-full border border-gray-200 bg-white/70 px-3 py-2 text-xs font-semibold dark:border-gray-800 dark:bg-gray-950/20"
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
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {myReview ? "Edit your review" : "Write a review"}
            </button>
          </div>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div> : null}

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Loading reviews…</div>
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
            <div className="text-sm text-gray-600 dark:text-gray-300">No reviews yet. Be the first!</div>
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
