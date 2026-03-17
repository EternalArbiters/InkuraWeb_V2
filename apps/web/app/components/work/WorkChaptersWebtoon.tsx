"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowDownUp } from "lucide-react";
import { getChapterDisplayLabel, getChapterSecondaryTitle } from "@/lib/chapterLabel";
import { ChapterLite, formatChapterDateLabel, resolveChapterThumb } from "@/lib/workChapters";

const READ_CHAPTERS_STORAGE_PREFIX = "inkura:read-chapters:";

function getReadChaptersStorageKey(slug: string) {
  return `${READ_CHAPTERS_STORAGE_PREFIX}${slug}`;
}

function loadRememberedReadChapters(slug: string): string[] {
  if (typeof window === "undefined" || !slug) return [];
  try {
    const raw = window.localStorage.getItem(getReadChaptersStorageKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0) : [];
  } catch {
    return [];
  }
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
  workType,
  lastReadChapterId,
  limit = 5,
  showAllHref,
}: {
  slug: string;
  chapters: ChapterLite[];
  workType?: "NOVEL" | "COMIC" | string | null;
  lastReadChapterId?: string | null;
  limit?: number | null;
  showAllHref?: string | null;
}) {
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");
  const [rememberedReadChapterIds, setRememberedReadChapterIds] = React.useState<string[]>(() =>
    lastReadChapterId ? [String(lastReadChapterId)] : [],
  );
  const [visibleCount, setVisibleCount] = React.useState(() => (typeof limit === "number" ? limit : 30));

  React.useEffect(() => {
    const syncRememberedReadChapters = () => {
      const next = loadRememberedReadChapters(slug);
      if (lastReadChapterId && !next.includes(String(lastReadChapterId))) next.push(String(lastReadChapterId));
      setRememberedReadChapterIds(next);
    };

    syncRememberedReadChapters();
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === getReadChaptersStorageKey(slug)) syncRememberedReadChapters();
    };
    const onRememberedUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ workSlug?: string }>).detail;
      if (!detail?.workSlug || detail.workSlug === slug) syncRememberedReadChapters();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("inkura:read-chapters-updated", onRememberedUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("inkura:read-chapters-updated", onRememberedUpdate as EventListener);
    };
  }, [slug, lastReadChapterId]);

  const readChapterIds = React.useMemo(() => new Set(rememberedReadChapterIds), [rememberedReadChapterIds]);
  const isNovel = workType === "NOVEL";

  const sorted = React.useMemo(() => {
    const arr = [...(chapters || [])];
    arr.sort((a, b) => {
      if (sort === "newest") return (b.number || 0) - (a.number || 0);
      return (a.number || 0) - (b.number || 0);
    });
    return arr;
  }, [chapters, sort]);

  const effectiveLimit = typeof limit === "number" ? limit : visibleCount;
  const visibleChapters = sorted.slice(0, effectiveLimit);
  const hasMoreChapters = sorted.length > effectiveLimit;

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
        ) : isNovel ? (
          visibleChapters.map((chapter) => {
            const read = readChapterIds.has(String(chapter.id));
            const up = isWithin24h(chapter.publishedAt || chapter.createdAt || null);
            const dateLabel = formatChapterDateLabel(chapter.publishedAt || chapter.createdAt || null);
            const displayLabel = getChapterDisplayLabel(chapter.number, chapter.label);
            const secondaryTitle = getChapterSecondaryTitle(chapter.number, chapter.title, chapter.label);

            return (
              <Link
                key={chapter.id}
                href={`/w/${slug}/read/${chapter.id}`}
                className={
                  "flex min-h-[92px] items-stretch gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900 sm:min-h-[96px] " +
                  (read ? "opacity-60" : "")
                }
              >
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-base font-extrabold leading-tight text-gray-900 dark:text-white">
                      {displayLabel}
                    </div>
                    {dateLabel ? (
                      <div className="shrink-0 pt-0.5 text-right text-xs text-gray-500 dark:text-gray-400">{dateLabel}</div>
                    ) : null}
                  </div>

                  {secondaryTitle ? (
                    <div className="line-clamp-2 text-xs leading-tight text-gray-800 dark:text-gray-100">{secondaryTitle}</div>
                  ) : null}

                  {up || chapter.isMature || (chapter.status && chapter.status !== "PUBLISHED") ? (
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-gray-600 dark:text-gray-300">
                      {up ? (
                        <span className="shrink-0 rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-extrabold text-white">
                          UP
                        </span>
                      ) : null}
                      {chapter.isMature ? <span className="shrink-0 rounded-full bg-black/70 px-2 py-1 text-white">18+</span> : null}
                      {chapter.status && chapter.status !== "PUBLISHED" ? (
                        <span className="shrink-0 rounded-full border border-gray-200 px-2 py-1 dark:border-gray-800">Draft</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })
        ) : (
          visibleChapters.map((c) => {
            const thumb = resolveChapterThumb(c);
            const focusX = clamp(c.thumbnailFocusX, 50, 0, 100);
            const focusY = clamp(c.thumbnailFocusY, 50, 0, 100);
            const zoom = clamp(c.thumbnailZoom, 1, 1, 2.5);

            const read = readChapterIds.has(String(c.id));
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


      {hasMoreChapters ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {showAllHref ? (
            <Link
              href={showAllHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
            >
              All Chapters
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => Math.min(current + 30, sorted.length))}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
            >
              Load more
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
