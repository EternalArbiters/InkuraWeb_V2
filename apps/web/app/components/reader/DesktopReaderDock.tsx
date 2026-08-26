"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

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
    "inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 dark:text-white/90 " +
    "hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition";

  const btnDisabled =
    "inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-300 dark:text-white/15 cursor-not-allowed";

  return (
    <div className="hidden lg:flex fixed bottom-8 right-8 z-[75] items-center gap-1 rounded-full border border-black/5 bg-white/80 p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b12]/85">
      {hrefPrev ? (
        <Link href={hrefPrev} className={btnBase} aria-label="Previous">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span className={btnDisabled} aria-hidden="true">
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}

      <Link href={hrefAll} className={btnBase} aria-label="All chapters">
        <LayoutGrid className="h-5 w-5" />
      </Link>

      {hrefNext ? (
        <Link href={hrefNext} className={btnBase} aria-label="Next">
          <ChevronRight className="h-5 w-5" />
        </Link>
      ) : (
        <span className={btnDisabled} aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}
