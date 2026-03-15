import Link from "next/link";
import { cache } from "react";

import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type ProgressItem = {
  id: string;
  updatedAt?: string | Date | null;
  work?: {
    id?: string;
    slug?: string | null;
    title?: string | null;
    coverImage?: string | null;
  } | null;
  chapter?: {
    id?: string;
    number?: number | null;
    label?: string | null;
    title?: string | null;
  } | null;
};

function clean(value: string | null | undefined) {
  const next = typeof value === "string" ? value.trim() : "";
  return next || null;
}

function progressHref(progress: ProgressItem) {
  const slug = progress.work?.slug;
  const chapterId = progress.chapter?.id;
  if (!slug || !chapterId) return null;
  return `/w/${slug}/read/${chapterId}`;
}

function workHref(progress: ProgressItem) {
  const slug = progress.work?.slug;
  if (!slug) return null;
  return `/w/${slug}`;
}

const getReadingProgressLabels = cache(async () => {
  const [chapter, continueReading, noCover, open] = await Promise.all([
    getActiveUILanguageText("Chapter"),
    getActiveUILanguageText("Continue reading"),
    getActiveUILanguageText("No cover"),
    getActiveUILanguageText("Open"),
  ]);

  return {
    chapter,
    continueReading,
    noCover,
    open,
    untitled: await getActiveUILanguageText("Untitled"),
  };
});

function buildChapterText(progress: ProgressItem, chapterLabel: string) {
  const customLabel = clean(progress.chapter?.label);
  const base = customLabel || `${chapterLabel} ${progress.chapter?.number ?? 0}`;
  const chapterTitle = clean(progress.chapter?.title);
  if (!chapterTitle) return base;
  if (chapterTitle.toLowerCase() === base.toLowerCase()) return base;
  return `${base}: ${chapterTitle}`;
}

function Cover({
  title,
  coverImage,
  compact = false,
  href,
  emptyLabel,
  openLabel,
}: {
  title?: string | null;
  coverImage?: string | null;
  compact?: boolean;
  href?: string | null;
  emptyLabel: string;
  openLabel: string;
}) {
  const content = (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[8px] bg-gray-100 dark:bg-gray-800 ${compact ? "h-24 w-[72px]" : "h-32 w-24 sm:h-36 sm:w-28"}`}
    >
      {coverImage ? (
        <img src={coverImage} alt={title || emptyLabel} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-gray-500">{emptyLabel}</div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block transition hover:opacity-90"
      aria-label={openLabel}
      title={openLabel}
    >
      {content}
    </Link>
  );
}

function ContinueButton({ href, label }: { href?: string | null; label: string }) {
  const className =
    "inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110";

  if (!href) {
    return <div className={`${className} cursor-not-allowed opacity-60`}>{label}</div>;
  }

  return (
    <Link href={href} className={className} aria-label={label} title={label}>
      {label}
    </Link>
  );
}

export async function ReadingProgressRailCard({ progress }: { progress: ProgressItem }) {
  const labels = await getReadingProgressLabels();
  const continueHref = progressHref(progress);
  const workPageHref = workHref(progress);
  const workTitle = clean(progress.work?.title) || labels.untitled;
  const chapterText = buildChapterText(progress, labels.chapter);
  const openLabel = `${labels.open} ${workTitle}`;

  return (
    <article className="w-[280px] shrink-0 snap-start sm:w-[340px]">
      <div className="flex min-h-[156px] gap-4 border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
        <Cover title={workTitle} coverImage={progress.work?.coverImage} href={workPageHref} emptyLabel={labels.noCover} openLabel={openLabel} />

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="min-w-0">
            <div className="line-clamp-2 text-lg font-extrabold tracking-tight">{workTitle}</div>
            <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{chapterText}</div>
          </div>

          <ContinueButton href={continueHref} label={labels.continueReading} />
        </div>
      </div>
    </article>
  );
}

export async function ReadingProgressListCard({ progress }: { progress: ProgressItem }) {
  const labels = await getReadingProgressLabels();
  const continueHref = progressHref(progress);
  const workPageHref = workHref(progress);
  const workTitle = clean(progress.work?.title) || labels.untitled;
  const chapterText = buildChapterText(progress, labels.chapter);
  const openLabel = `${labels.open} ${workTitle}`;

  return (
    <article>
      <div className="border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
        <div className="flex items-center gap-4">
          <Cover title={workTitle} coverImage={progress.work?.coverImage} compact href={workPageHref} emptyLabel={labels.noCover} openLabel={openLabel} />

          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-base font-extrabold tracking-tight sm:text-lg">{workTitle}</div>
            <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{chapterText}</div>
          </div>

          <ContinueButton href={continueHref} label={labels.continueReading} />
        </div>
      </div>
    </article>
  );
}
