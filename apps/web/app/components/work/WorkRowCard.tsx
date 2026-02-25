import Link from "next/link";
import WorkCoverBadges from "@/app/components/WorkCoverBadges";

type WorkLite = {
  id: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
  type?: string | null;
  comicType?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  language?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
  likeCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | Date | null;
  author?: { username?: string | null; name?: string | null } | null;
  translator?: { username?: string | null; name?: string | null } | null;
};

function fmtDate(v: WorkLite["updatedAt"]) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  // Compact yyyy-mm-dd
  return d.toISOString().slice(0, 10);
}

export default function WorkRowCard({ work }: { work: WorkLite }) {
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";

  const author = work?.author?.name || work?.author?.username || "";
  const translator = work?.translator?.name || work?.translator?.username || "";
  const updated = fmtDate(work?.updatedAt);

  const ratingText =
    typeof work?.ratingAvg === "number" && typeof work?.ratingCount === "number"
      ? `${work.ratingAvg.toFixed(2)} (${work.ratingCount})`
      : "";

  return (
    <Link
      href={href}
      className="group flex gap-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition p-3"
    >
      <div className="relative w-[92px] sm:w-[108px] shrink-0">
        <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {work?.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.coverImage} alt={work?.title || "cover"} className="w-full h-full object-cover block" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No cover</div>
          )}

          <WorkCoverBadges
            work={{
              type: work?.type,
              publishType: work?.publishType,
              isMature: !!work?.isMature,
              language: work?.language,
              comicType: work?.comicType,
            }}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-base sm:text-lg font-extrabold tracking-tight leading-snug line-clamp-2">
          {work?.title || "Untitled"}
        </div>

        {(author || translator) && (
          <div className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200 line-clamp-1">
            {author}
            {translator ? <span className="opacity-80"> • TL: {translator}</span> : null}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
          {typeof work?.chapterCount === "number" ? <span>Ch: {work.chapterCount}</span> : null}
          {work?.completion ? <span>{String(work.completion)}</span> : null}
          {typeof work?.likeCount === "number" ? <span>❤ {work.likeCount}</span> : null}
          {ratingText ? <span>★ {ratingText}</span> : null}
          {updated ? <span className="opacity-80">Updated {updated}</span> : null}
        </div>
      </div>
    </Link>
  );
}
