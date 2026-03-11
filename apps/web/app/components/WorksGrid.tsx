"use client";

import * as React from "react";

import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";

type Work = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  type?: string;
  publishType?: string | null;
  isMature?: boolean;
  language?: string | null;
  comicType?: string | null;
  likeCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  author?: { username?: string | null; name?: string | null; image?: string | null } | null;
  translator?: { username?: string | null; name?: string | null; image?: string | null } | null;
  updatedAt?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
};

export default function WorksGrid({
  works,
  showRecentUpdateBadge = false,
  showBookmarkButton = false,
  showUpdatedSubtitle = false,
  initialCount = 30,
  step = 30,
}: {
  works: Work[];
  showRecentUpdateBadge?: boolean;
  showBookmarkButton?: boolean;
  showUpdatedSubtitle?: boolean;
  initialCount?: number;
  step?: number;
}) {
  const [visibleCount, setVisibleCount] = React.useState(initialCount);
  const visibleWorks = works.slice(0, visibleCount);
  const hasMore = visibleCount < works.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {visibleWorks.map((w) => (
          <InteractiveWorkCard
            key={w.id}
            work={w}
            showRecentUpdateBadge={showRecentUpdateBadge}
            showBookmarkButton={showBookmarkButton}
            showUpdatedSubtitle={showUpdatedSubtitle}
          />
        ))}

        {works.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white/70 p-6 md:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="text-lg font-bold">No works</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no data to display yet.</p>
          </div>
        ) : null}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + step, works.length))}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Load more
          </button>
        </div>
      ) : null}
    </>
  );
}
