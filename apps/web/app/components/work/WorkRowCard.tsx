import Link from "next/link";
import OriginFlag from "@/app/components/OriginFlag";
import BookmarkIconButton from "@/app/components/work/BookmarkIconButton";
import FavoriteIconButton from "@/app/components/work/FavoriteIconButton";
import { formatUpdatedAt } from "@/lib/time";

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
  likeCount?: number | null; // kept for API compatibility (sorting), not shown in row
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | Date | null;
  author?: { username?: string | null; name?: string | null } | null;
  translator?: { username?: string | null; name?: string | null } | null;
  // viewer interactions (from /api/works)
  viewerBookmarked?: boolean | null;
  viewerFavorited?: boolean | null;
};

function normalize(v?: string | null) {
  return String(v || "").trim().toUpperCase();
}

function publishTypeLabel(publishType?: string | null) {
  const p = normalize(publishType);
  if (p === "ORIGINAL") return "Original";
  if (p === "TRANSLATION") return "Translation";
  if (p === "REUPLOAD") return "Reupload";
  return null;
}

function typeBadgeClass(type?: string | null) {
  const t = normalize(type);
  if (t === "NOVEL") return "bg-blue-600/90 text-white";
  if (t === "COMIC") return "bg-pink-600/90 text-white";
  return "bg-gray-700/80 text-white";
}

function originFlagEmoji(input: Pick<WorkLite, "type" | "comicType" | "language">) {
  const type = normalize(input.type);
  const comicType = normalize(input.comicType);
  const lang = String(input.language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

  // Comics: prefer comicType (MANGA/MANHWA/MANHUA)
  if (type === "COMIC") {
    if (comicType === "MANGA") return "🇯🇵";
    if (comicType === "MANHWA") return "🇰🇷";
    if (comicType === "MANHUA") return "🇨🇳";
    if (comicType === "WESTERN") return "🌍";
    if (comicType === "OTHER") return "🏳️";
  }

  // Novels (and fallback): map language to flag
  const map: Record<string, string> = {
    ja: "🇯🇵",
    jp: "🇯🇵",
    ko: "🇰🇷",
    kr: "🇰🇷",
    zh: "🇨🇳",
    cn: "🇨🇳",
    id: "🇮🇩",
    en: "🇺🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    es: "🇪🇸",
    it: "🇮🇹",
    ru: "🇷🇺",
    pt: "🇵🇹",
    tr: "🇹🇷",
    vi: "🇻🇳",
    th: "🇹🇭",
    hi: "🇮🇳",
    ar: "🇸🇦",
    ms: "🇲🇾",
  };

  return map[lang] || null;
}

export default function WorkRowCard({ work }: { work: WorkLite }) {
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";

  const author = work?.author?.name || work?.author?.username || "";
  const translator = work?.translator?.name || work?.translator?.username || "";
  const updatedAt = work?.updatedAt ? new Date(work.updatedAt as any) : null;
  const isUp = !!updatedAt && Date.now() - +updatedAt < 24 * 60 * 60 * 1000;
  const updatedLabel = formatUpdatedAt(work?.updatedAt, { thresholdDays: 100 });

  const flag = originFlagEmoji({ type: work?.type, comicType: work?.comicType, language: work?.language });
  const type = normalize(work?.type) || "WORK";
  const publishLabel = publishTypeLabel(work?.publishType);

  const ratingText =
    typeof work?.ratingAvg === "number" && typeof work?.ratingCount === "number"
      ? `${work.ratingAvg.toFixed(2)} (${work.ratingCount})`
      : "";

  return (
    <div className="group flex gap-4 rounded-[14px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition p-3">
      <Link href={href} className="flex gap-4 min-w-0 flex-1">
        {/* Cover: stretch to match row height (so top/bottom align with card) */}
        <div className="relative w-[92px] sm:w-[108px] shrink-0 self-stretch">
          <div className="relative h-full min-h-[124px] overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
            {work?.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.coverImage} alt={work?.title || "cover"} className="w-full h-full object-cover block" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No cover</div>
            )}

            {flag ? (
              <div
                className="absolute top-2 right-2 z-10 text-[12px] leading-none px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur"
                title="Origin"
                aria-label="Origin"
              >
                <OriginFlag emoji={flag} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-lg font-extrabold tracking-tight leading-snug line-clamp-2">
            {work?.title || "Untitled"}
          </div>

          {(author || translator) && (
            <div className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
              Up by {author || translator}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            {typeof work?.chapterCount === "number" ? <span>Ch: {work.chapterCount}</span> : null}
            {work?.completion ? <span>{String(work.completion)}</span> : null}
            {ratingText ? <span>★ {ratingText}</span> : null}
          </div>

          {updatedLabel ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 opacity-80">{updatedLabel}</div> : null}

          {/* Row-list-only badges: moved below the Updated line */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isUp ? <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-600/90 text-white font-extrabold">UP</span> : null}
            <span className={`inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full ${typeBadgeClass(type)}`}>{type}</span>
            {publishLabel ? (
              <span className="inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-black/55 dark:text-white">
                {publishLabel}
              </span>
            ) : null}
            {work?.isMature ? <span className="inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-black/75 text-white">18+</span> : null}
          </div>
        </div>
      </Link>

      {/* Row actions: only Bookmark + Favorite */}
      {work?.id ? (
        <div className="shrink-0 flex items-start gap-2 pt-1">
          <BookmarkIconButton workId={work.id} initialBookmarked={!!work.viewerBookmarked} />
          <FavoriteIconButton workId={work.id} initialFavorited={!!work.viewerFavorited} />
        </div>
      ) : null}
    </div>
  );
}
