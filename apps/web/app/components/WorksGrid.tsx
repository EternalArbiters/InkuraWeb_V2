"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";

import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

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

// Stagger container: a single in-view observer drives the whole grid's reveal.
const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
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
  const { uiTheme } = useUITheme();
  const isModern = uiTheme === "modern";
  const [visibleCount, setVisibleCount] = React.useState(initialCount);
  const visibleWorks = works.slice(0, visibleCount);
  const hasMore = visibleCount < works.length;

  const gridClass = isModern
    ? "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4"
    : "grid grid-cols-2 gap-4 md:grid-cols-4";

  const cards = visibleWorks.map((w) => (
    <InteractiveWorkCard
      key={w.id}
      work={w}
      showRecentUpdateBadge={showRecentUpdateBadge}
      showBookmarkButton={showBookmarkButton}
      showUpdatedSubtitle={showUpdatedSubtitle}
    />
  ));

  const emptyState =
    works.length === 0 ? (
      isModern ? (
        <div className="col-span-2 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-6 md:col-span-4">
          <div className="text-lg font-bold">No works</div>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">There is no data to display yet.</p>
        </div>
      ) : (
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white/70 p-6 md:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="text-lg font-bold">No works</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no data to display yet.</p>
        </div>
      )
    ) : null;

  return (
    <>
      {isModern ? (
        <motion.div
          className={gridClass}
          variants={gridContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
        >
          {cards}
          {emptyState}
        </motion.div>
      ) : (
        <div className={gridClass}>
          {cards}
          {emptyState}
        </div>
      )}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + step, works.length))}
            className={
              isModern
                ? "inline-flex items-center justify-center rounded-lg border border-[var(--ink-border)] bg-[var(--ink-surface)] px-6 py-2.5 text-sm font-semibold text-[var(--ink-fg)] transition hover:border-[var(--ink-accent)] hover:text-[var(--ink-accent)]"
                : "inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
            }
          >
            Load more
          </button>
        </div>
      ) : null}
    </>
  );
}
