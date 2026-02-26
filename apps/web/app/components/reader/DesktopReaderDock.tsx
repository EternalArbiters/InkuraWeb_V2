"use client";

import Link from "next/link";
import { useMemo } from "react";

export default function DesktopReaderDock({
  workSlug,
  prevId,
  nextId,
}: {
  workSlug: string;
  prevId: string | null;
  nextId: string | null;
}) {
  const hrefPrev = useMemo(() => (prevId ? `/w/${workSlug}/read/${prevId}` : null), [prevId, workSlug]);
  const hrefNext = useMemo(() => (nextId ? `/w/${workSlug}/read/${nextId}` : null), [nextId, workSlug]);
  const hrefAll = useMemo(() => `/w/${workSlug}`, [workSlug]);

  const btnBase =
    "inline-flex items-center justify-center h-9 min-w-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-950/70 backdrop-blur " +
    "text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition";

  const btnDisabled =
    "inline-flex items-center justify-center h-9 min-w-11 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-950/40 " +
    "text-sm font-semibold opacity-45";

  return (
    <div className="hidden lg:flex fixed bottom-6 right-6 z-[75] items-center gap-2">
      {hrefPrev ? (
        <Link href={hrefPrev} className={btnBase} aria-label="Previous">
          Pre
        </Link>
      ) : (
        <span className={btnDisabled} aria-hidden="true">
          Pre
        </span>
      )}

      <Link href={hrefAll} className={btnBase} aria-label="All chapters">
        All
      </Link>

      {hrefNext ? (
        <Link href={hrefNext} className={btnBase} aria-label="Next">
          Next
        </Link>
      ) : (
        <span className={btnDisabled} aria-hidden="true">
          Next
        </span>
      )}
    </div>
  );
}
