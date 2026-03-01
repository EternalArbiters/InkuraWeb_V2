"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowDownUp } from "lucide-react";

type ChapterLite = {
  id: string;
  title: string;
  number: number;
  createdAt?: string;
  publishedAt?: string | null;
  thumbnailImage?: string | null;
  isMature?: boolean | null;
  warningTags?: Array<{ name: string; slug: string }>;
  pages?: Array<{ imageUrl: string; imageKey?: string | null }>;
};

function isWithinHours(dateLike: string | Date | null | undefined, hours: number) {
  if (!dateLike) return false;
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(+d)) return false;
  return Date.now() - +d < hours * 60 * 60 * 1000;
}

function hashString(s: string) {
  // small deterministic hash (djb2)
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

function pickAutoThumb(ch: ChapterLite): string | null {
  if (ch.thumbnailImage) return ch.thumbnailImage;
  const pages = Array.isArray(ch.pages) ? ch.pages.filter((p) => !!p?.imageUrl) : [];
  if (!pages.length) return null;
  const idx = pages.length === 1 ? 0 : hashString(ch.id) % pages.length;
  return pages[idx]?.imageUrl || pages[0]?.imageUrl || null;
}

function ArcButton({ href, label }: { href: string; label: string }) {
  const isExternal = /^https?:\/\//i.test(href);
  const cls =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} title={href}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} title={href}>
      {label}
    </Link>
  );
}

export default function WorkChaptersWebtoonList({
  workSlug,
  chapters,
  chapterCount,
  progressChapterNumber,
  prevArcUrl,
  nextArcUrl,
}: {
  workSlug: string;
  chapters: ChapterLite[];
  chapterCount: number;
  progressChapterNumber: number;
  prevArcUrl: string | null;
  nextArcUrl: string | null;
}) {
  const [sortMode, setSortMode] = React.useState<"newest" | "oldest">("newest");

  const sorted = React.useMemo(() => {
    const list = Array.isArray(chapters) ? [...chapters] : [];
    // API already returns newest first (desc). We only reverse for oldest.
    if (sortMode === "oldest") return list.slice().reverse();
    return list;
  }, [chapters, sortMode]);

  const hasArc = !!(prevArcUrl || nextArcUrl);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Chapters</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-300">{chapterCount} total</div>
          <button
            type="button"
            onClick={() => setSortMode((p) => (p === "newest" ? "oldest" : "newest"))}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            title={sortMode === "newest" ? "Sort: Newest" : "Sort: Oldest"}
            aria-label={sortMode === "newest" ? "Sort: Newest" : "Sort: Oldest"}
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasArc ? (
        <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Series Arc</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {prevArcUrl ? <ArcButton href={prevArcUrl} label="Previous Arc" /> : <span />}
            {nextArcUrl ? <ArcButton href={nextArcUrl} label="Next Arc" /> : <span />}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {sorted.length ? (
          sorted.map((c) => {
            const warnings = Array.isArray(c.warningTags) ? c.warningTags : [];
            const warningCount = warnings.length;
            const isRead = !!progressChapterNumber && c.number <= progressChapterNumber;
            const thumb = pickAutoThumb(c);
            const up = isWithinHours(c.publishedAt || c.createdAt || null, 24);

            return (
              <Link
                key={c.id}
                href={`/w/${workSlug}/read/${c.id}`}
                className={
                  "flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 p-3 transition " +
                  (isRead ? "opacity-60" : "")
                }
              >
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={`Chapter ${c.number}`}
                      className={"w-full h-full object-cover " + (isRead ? "grayscale" : "")}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">Chapter {c.number}</div>
                      <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-300 truncate">{c.title}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                      {up ? <span className="px-2 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold">UP</span> : null}
                      {c.isMature ? <span className="px-2 py-1 rounded-full bg-black/70 text-white text-[10px]">18+</span> : null}
                      {warningCount ? (
                        <span className="px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-[10px]">
                          {warningCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-300">Belum ada chapter.</div>
        )}
      </div>
    </div>
  );
}
