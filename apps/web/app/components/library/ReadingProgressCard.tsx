import Link from "next/link";
import { getChapterDisplayTitle } from "@/lib/chapterLabel";

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

function Cover({
  title,
  coverImage,
  compact = false,
  href,
}: {
  title?: string | null;
  coverImage?: string | null;
  compact?: boolean;
  href?: string | null;
}) {
  const content = (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[24px] bg-gray-100 dark:bg-gray-800 ${compact ? "h-24 w-[72px]" : "h-32 w-24 sm:h-36 sm:w-28"}`}
    >
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt={title || "cover"} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-gray-500">No cover</div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block transition hover:opacity-90" aria-label={`Open ${title || "work"}`}>
      {content}
    </Link>
  );
}

function ContinueButton({ href }: { href?: string | null }) {
  const className =
    "inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110";

  if (!href) {
    return <div className={`${className} cursor-not-allowed opacity-60`}>Continue</div>;
  }

  return (
    <Link href={href} className={className} aria-label="Continue reading">
      Continue
    </Link>
  );
}

export function ReadingProgressRailCard({ progress }: { progress: ProgressItem }) {
  const continueHref = progressHref(progress);
  const workPageHref = workHref(progress);
  const chapterText = getChapterDisplayTitle(
    progress.chapter?.number ?? 0,
    progress.chapter?.title,
    progress.chapter?.label,
  );

  return (
    <article className="w-[280px] shrink-0 snap-start sm:w-[340px]">
      <div className="flex min-h-[156px] gap-4 border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
        <Cover title={progress.work?.title} coverImage={progress.work?.coverImage} href={workPageHref} />

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="min-w-0">
            <div className="line-clamp-2 text-lg font-extrabold tracking-tight">{progress.work?.title || "Untitled"}</div>
            <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{chapterText}</div>
          </div>

          <ContinueButton href={continueHref} />
        </div>
      </div>
    </article>
  );
}

export function ReadingProgressListCard({ progress }: { progress: ProgressItem }) {
  const continueHref = progressHref(progress);
  const workPageHref = workHref(progress);
  const chapterText = getChapterDisplayTitle(
    progress.chapter?.number ?? 0,
    progress.chapter?.title,
    progress.chapter?.label,
  );

  return (
    <article>
      <div className="border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
        <div className="flex items-center gap-4">
          <Cover title={progress.work?.title} coverImage={progress.work?.coverImage} compact href={workPageHref} />

          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-base font-extrabold tracking-tight sm:text-lg">{progress.work?.title || "Untitled"}</div>
            <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{chapterText}</div>
          </div>

          <ContinueButton href={continueHref} />
        </div>
      </div>
    </article>
  );
}
