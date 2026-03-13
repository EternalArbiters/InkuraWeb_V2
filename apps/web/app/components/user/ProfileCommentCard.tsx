import Link from "next/link";

import type { ViewerCommentItem } from "@/server/services/profile/viewerActivity";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfileCommentCard({ comment }: { comment: ViewerCommentItem }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {comment.href ? (
            <Link href={comment.href} className="font-semibold hover:underline truncate">
              {comment.workTitle}
            </Link>
          ) : (
            <div className="font-semibold truncate">{comment.workTitle}</div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{comment.contextLabel}</span>
            {comment.isReply ? <span>Reply</span> : null}
            {comment.isSpoiler ? <span>Spoiler</span> : null}
            {comment.isHidden ? <span>Hidden</span> : null}
            <span>Like {comment.likeCount}</span>
          </div>
        </div>
        <div className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.editedAt || comment.createdAt)}</div>
      </div>
      <div data-ui-language-ignore="true" className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-3 whitespace-pre-wrap">{comment.body}</div>
    </div>
  );
}
