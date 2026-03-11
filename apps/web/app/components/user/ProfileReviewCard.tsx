import Link from "next/link";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export type ProfileReviewCardData = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isSpoiler: boolean;
  helpfulCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  work: {
    title: string | null;
    slug: string | null;
  } | null;
};

export default function ProfileReviewCard({ review }: { review: ProfileReviewCardData }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={review.work?.slug ? `/w/${review.work.slug}` : "#"} className="font-semibold hover:underline truncate">
            {review.work?.title || "Untitled work"}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>★ {review.rating.toFixed(1)}</span>
            <span>Helpful {review.helpfulCount}</span>
            {review.isSpoiler ? <span>Spoiler</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatDate(review.updatedAt || review.createdAt)}</div>
      </div>
      {review.title ? <div className="mt-2 text-sm font-semibold">{review.title}</div> : null}
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-3 whitespace-pre-wrap">{review.body}</div>
    </div>
  );
}
