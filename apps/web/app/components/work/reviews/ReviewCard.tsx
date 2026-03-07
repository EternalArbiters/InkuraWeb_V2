"use client";

import Link from "next/link";
import { Pencil, ThumbsUp, Trash2 } from "lucide-react";
import Stars from "./Stars";
import type { ReviewItem } from "./types";
import { displayName } from "./utils";

export default function ReviewCard({
  review,
  revealed,
  isPending,
  onEdit,
  onDelete,
  onToggleHelpful,
  onToggleSpoiler,
}: {
  review: ReviewItem;
  revealed: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHelpful: () => void;
  onToggleSpoiler: () => void;
}) {
  const isSpoilerHidden = review.isSpoiler && !revealed;
  const edited = review.updatedAt && review.updatedAt !== review.createdAt;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {review.user?.username ? (
              <Link href={`/u/${review.user.username}`} className="font-semibold text-sm hover:text-purple-400">
                {displayName(review.user)}
              </Link>
            ) : (
              <div className="font-semibold text-sm">{displayName(review.user)}</div>
            )}
            <Stars value={review.rating} />
            {review.isMine ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-600 text-white">
                You
              </span>
            ) : null}
            {review.isSpoiler ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-200">
                Spoiler
              </span>
            ) : null}
          </div>
          {review.title ? (
            <div className="mt-1 text-sm font-semibold">{review.title}</div>
          ) : null}
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {new Date(review.createdAt).toLocaleString()}
            {edited ? <span className="opacity-70"> · edited</span> : null}
          </div>
        </div>

        {review.isMine ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              onClick={onEdit}
              disabled={isPending}
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              onClick={onDelete}
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
            onClick={onToggleSpoiler}
            className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-3"
          >
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Spoiler hidden
            </div>
            <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Tap to reveal
            </div>
          </button>
        ) : (
          <>
            <div>{review.body}</div>
            {review.isSpoiler ? (
              <button
                type="button"
                onClick={onToggleSpoiler}
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
            review.viewerVoted
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-transparent"
          }`}
          onClick={onToggleHelpful}
          disabled={isPending}
        >
          <ThumbsUp size={16} />
          Helpful <span className="opacity-80">({review.helpfulCount})</span>
        </button>

        <div className="text-xs text-gray-600 dark:text-gray-300"> </div>
      </div>
    </div>
  );
}
