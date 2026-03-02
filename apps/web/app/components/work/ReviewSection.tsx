"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Star, ThumbsUp, Pencil, Trash2, X } from "lucide-react";

type ReviewUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isSpoiler: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  viewerVoted: boolean;
  isMine: boolean;
};

function displayName(u: ReviewUser) {
  return u.name || u.username || "Unknown";
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => {
        const active = value >= v;
        return <Star key={v} size={16} className={active ? "text-yellow-600 dark:text-yellow-300 fill-current" : "text-gray-400 dark:text-gray-600"} />;
      })}
    </div>
  );
}

export default function ReviewSection({
  workId,
  ratingAvg,
  ratingCount,
  initialMyRating,
}: {
  workId: string;
  ratingAvg: number;
  ratingCount: number;
  initialMyRating: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"helpful" | "top" | "bottom" | "newest" | "oldest">("helpful");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(initialMyRating ?? 0);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftBody, setDraftBody] = useState<string>("");
  const [draftSpoiler, setDraftSpoiler] = useState(false);

  const avgLabel = useMemo(() => {
    if (!ratingCount) return "0.0";
    return (Math.round(ratingAvg * 10) / 10).toFixed(1);
  }, [ratingAvg, ratingCount]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ sort, take: "30" });
      const res = await fetch(`/api/works/${workId}/reviews?${qs.toString()}`, { cache: "no-store" as any });
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
                helpfulCount: typeof data.helpfulCount === "number" ? data.helpfulCount : r.helpfulCount,
              }
            : r
        )
      );
    });
  };

  const toggleSpoiler = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Reviews</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Stars value={Math.round((ratingAvg || 0))} />
              </span>
              <span>
                <b>{avgLabel}</b> <span className="opacity-70">({ratingCount})</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
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

        {error ? <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div> : null}

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Loading reviews…</div>
          ) : reviews.length ? (
            <div className="grid gap-3">
              {reviews.map((r) => {
                const isSpoilerHidden = r.isSpoiler && !revealed[r.id];
                const edited = r.updatedAt && r.updatedAt !== r.createdAt;
                return (
                  <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm">{displayName(r.user)}</div>
                          <Stars value={r.rating} />
                          {r.isMine ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-600 text-white">You</span> : null}
                          {r.isSpoiler ? <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-200">Spoiler</span> : null}
                        </div>
                        {r.title ? <div className="mt-1 text-sm font-semibold">{r.title}</div> : null}
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {new Date(r.createdAt).toLocaleString()}
                          {edited ? <span className="opacity-70"> · edited</span> : null}
                        </div>
                      </div>

                      {r.isMine ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                            onClick={openComposer}
                            disabled={isPending}
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                            onClick={() => del(r.id)}
                            disabled={isPending}
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                      {isSpoilerHidden ? (
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(r.id)}
                          className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-3"
                        >
                          <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Spoiler hidden</div>
                          <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">Tap to reveal</div>
                        </button>
                      ) : (
                        <>
                          <div>{r.body}</div>
                          {r.isSpoiler ? (
                            <button
                              type="button"
                              onClick={() => toggleSpoiler(r.id)}
                              className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-200 hover:underline"
                            >
                              Hide spoiler
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 ${
                          r.viewerVoted ? "bg-purple-600 text-white border-purple-600" : "bg-transparent"
                        }`}
                        onClick={() => toggleHelpful(r.id)}
                        disabled={isPending}
                      >
                        <ThumbsUp size={16} />
                        Helpful <span className="opacity-80">({r.helpfulCount})</span>
                      </button>

                      <div className="text-xs text-gray-600 dark:text-gray-300"> </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300">No reviews yet. Be the first!</div>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="font-bold">{myReview ? "Edit review" : "Write a review"}</div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Rating</div>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((v) => {
                    const active = draftRating >= v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDraftRating(v)}
                        className={`p-1 rounded ${active ? "text-yellow-600 dark:text-yellow-300" : "text-gray-400 dark:text-gray-600"} hover:brightness-110`}
                        aria-label={`Rate ${v}`}
                      >
                        <Star size={22} className={active ? "fill-current" : ""} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Title (optional)</div>
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                  placeholder="Short summary"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Your review</div>
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="mt-2 w-full min-h-[140px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                  placeholder="Write your thoughts…"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draftSpoiler} onChange={(e) => setDraftSpoiler(e.target.checked)} />
                Contains spoilers
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                  disabled={isPending}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
