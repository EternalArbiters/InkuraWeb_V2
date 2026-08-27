"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";

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
  const [visibleCount, setVisibleCount] = React.useState(initialCount);
  const visibleWorks = works.slice(0, visibleCount);
  const hasMore = visibleCount < works.length;

  // v30: cards revealed later via "Load more" are rendered in their OWN motion
  // container (initial+animate, not whileInView) rather than appended into the
  // first grid. The first grid's whileInView only fires once (viewport.once) —
  // cards that inherit its "hidden"/"show" variants but mount afterward never
  // get told to transition to "show" and can get stuck invisible. A container
  // that animates immediately on mount has no such dependency on an
  // already-resolved trigger.
  const initialWorks = visibleWorks.slice(0, initialCount);
  const extraWorks = visibleWorks.slice(initialCount);

  const gridClass = "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4";

  const renderCard = (w: Work) => (
    <InteractiveWorkCard
      key={w.id}
      work={w}
      showRecentUpdateBadge={showRecentUpdateBadge}
      showBookmarkButton={showBookmarkButton}
      showUpdatedSubtitle={showUpdatedSubtitle}
    />
  );

  const emptyState =
    works.length === 0 ? (
      <div className="col-span-2 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-6 md:col-span-4">
        <div className="text-lg font-bold">No works</div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">There is no data to display yet.</p>
      </div>
    ) : null;

  return (
    <>
      <motion.div
        className={gridClass}
        variants={gridContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
      >
        {initialWorks.map(renderCard)}
        {emptyState}
      </motion.div>

      {extraWorks.length ? (
        <motion.div className={`${gridClass} mt-8`} variants={gridContainer} initial="hidden" animate="show">
          {extraWorks.map(renderCard)}
        </motion.div>
      ) : null}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + step, works.length))}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--ink-border)] bg-[var(--ink-surface)] px-6 py-2.5 text-sm font-semibold text-[var(--ink-fg)] transition hover:border-[var(--ink-accent)] hover:text-[var(--ink-accent)]"
          >
            Load more
          </button>
        </div>
      ) : null}
    </>
  );
}
