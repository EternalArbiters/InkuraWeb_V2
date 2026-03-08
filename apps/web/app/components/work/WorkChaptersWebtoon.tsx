"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowDownUp } from "lucide-react";
import { getChapterDisplayLabel, getChapterSecondaryTitle } from "@/lib/chapterLabel";

type ChapterLite = {
  id: string;
  number: number;
  title: string;
  label?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  isMature?: boolean | null;
  thumbnailUrl?: string | null;
  thumbnailImage?: string | null;
  thumbnailKey?: string | null;
  thumbnailFocusX?: number | null;
  thumbnailFocusY?: number | null;
  thumbnailZoom?: number | null;
  pages?: { imageUrl: string }[];
};

function stablePick(chapterId: string, candidates: string[]) {
  if (!candidates.length) return null;
  let h = 0;
  for (let i = 0; i < chapterId.length; i++) h = (h * 31 + chapterId.charCodeAt(i)) >>> 0;
  const idx = h % candidates.length;
  return candidates[idx];
}

function isWithin24h(dt?: string | null) {
  if (!dt) return false;
  const t = +new Date(dt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

function clamp(n: unknown, def: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, v));
}

export default function WorkChaptersWebtoon({
  slug,
  chapters,
  lastReadChapterNumber,
  limit = 5,
  showAllHref,
}: {
  slug: string;
  chapters: ChapterLite[];
  lastReadChapterNumber: number | null;
  limit?: number;
  showAllHref?: string | null;
}) {
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");

  const sorted = React.useMemo(() => {
    const arr = [...(chapters || [])];
    arr.sort((a, b) => {
      if (sort === "newest") return (b.number || 0) - (a.number || 0);
      return (a.number || 0) - (b.number || 0);
    });
    return arr;
  }, [chapters, sort]);

  const visibleChapters = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  const hasMoreChapters = typeof limit === "number" && sorted.length > limit;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Chapters</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">{chapters.length} total</div>
        </div>

        <button
          type="button"
          onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          title={sort === "newest" ? "Sort by oldest" : "Sort by newest"}
          aria-label={sort === "newest" ? "Sort by oldest" : "Sort by newest"}
        >
          <ArrowDownUp className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {visibleChapters.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">No chapters yet.</div>
        ) : (
          visibleChapters.map((c) => {
            const candidates = (c.pages || []).map((p) => p.imageUrl).filter(Boolean);
            const thumb = c.thumbnailUrl || c.thumbnailImage || stablePick(String(c.id), candidates) || null;

            const focusX = clamp(c.thumbnailFocusX, 50, 0, 100);
            const focusY = clamp(c.thumbnailFocusY, 50, 0, 100);
            const zoom = clamp(c.thumbnailZoom, 1, 1, 2.5);

            const read = typeof lastReadChapterNumber === "number" && c.number <= lastReadChapterNumber;
            const up = isWithin24h(c.publishedAt || c.createdAt || null);
            const displayLabel = getChapterDisplayLabel(c.number, c.label);
            const secondaryTitle = getChapterSecondaryTitle(c.number, c.title, c.label);

            return (
              <Link
                key={c.id}
                href={`/w/${slug}/read/${c.id}`}
                className={
                  "flex min-h-[106px] items-stretch gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900 sm:min-h-[112px] " +
                  (read ? "opacity-60" : "")
                }
              >
                <div className="relative w-[118px] shrink-0 sm:w-[126px]">
                  <div className="relative h-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={c.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: `${focusX}% ${focusY}%`,
                          transform: `scale(${zoom})`,
                          transformOrigin: "center",
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No image</div>
                    )}
                    {up ? (
                      <div className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-extrabold text-white">
                        UP
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
                  <div className="truncate text-base font-extrabold leading-tight">{displayLabel}</div>
                  {secondaryTitle ? (
                    <div className="truncate text-sm leading-tight text-gray-800 dark:text-gray-100">
                      {secondaryTitle}
                    </div>
                  ) : null}
                  <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-gray-600 dark:text-gray-300">
                    {c.isMature ? <span className="shrink-0 rounded-full bg-black/70 px-2 py-1 text-white">18+</span> : null}
                    {c.publishedAt ? <span className="truncate">{new Date(c.publishedAt).toLocaleDateString()}</span> : null}
                    {c.status && c.status !== "PUBLISHED" ? (
                      <span className="shrink-0 rounded-full border border-gray-200 px-2 py-1 dark:border-gray-800">Draft</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {hasMoreChapters && showAllHref ? (
        <div className="mt-4">
          <Link
            href={showAllHref}
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            All Chapters
          </Link>
        </div>
      ) : null}
    </div>
  );
}
