"use client";

import Link from "next/link";
import { Heart, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import OriginFlag from "@/app/components/OriginFlag";
import BookmarkIconButton from "@/app/components/work/BookmarkIconButton";
import { formatUpdatedAt } from "@/lib/time";
import { sendAnalyticsEvent } from "@/lib/analyticsClient";

type Person = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
} | null | undefined;

type Genre =
  | {
      name?: string | null;
      slug?: string | null;
    }
  | string
  | null
  | undefined;

type WorkCardData = {
  id: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
  type?: string | null;
  comicType?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  deviantLoveTags?: Genre[] | null;
  language?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
  likeCount?: number | null;
  chapterLoveCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | Date | null;
  author?: Person;
  translator?: Person;
  viewerBookmarked?: boolean | null;
  genres?: Genre[] | null;
};

function normalize(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function titleCase(value?: string | null) {
  const normalized = String(value || "").trim().replace(/[_-]+/g, " ").toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function publishTypeLabel(publishType?: string | null) {
  const value = normalize(publishType);
  if (value === "ORIGINAL") return "Original";
  if (value === "TRANSLATION") return "Translation";
  if (value === "REUPLOAD") return "Reupload";
  return null;
}

function translationFlagEmoji(language?: string | null) {
  const lang = String(language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

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

function personLabel(person: Person) {
  if (!person) return null;
  if (person.name) return person.name;
  if (person.username) return `@${person.username}`;
  return null;
}

function joinParts(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" • ");
}

function overlayTypeLabel(work: Pick<WorkCardData, "type" | "comicType">) {
  const comicType = titleCase(work.comicType);
  if (comicType && comicType !== "Other" && comicType !== "Unknown") return comicType;

  const type = titleCase(work.type);
  if (type && type !== "Unknown") return type;
  return "Work";
}

function genreText(genres?: Genre[] | null) {
  if (!Array.isArray(genres) || genres.length === 0) return null;

  const names = genres
    .map((genre) => {
      if (typeof genre === "string") return genre.trim();
      if (genre?.name) return String(genre.name).trim();
      if (genre?.slug) return titleCase(String(genre.slug));
      return "";
    })
    .filter(Boolean);

  const uniqueNames = Array.from(new Set(names));
  return uniqueNames.length ? uniqueNames.join(", ") : null;
}

type Props = {
  work: WorkCardData;
  className?: string;
  showRecentUpdateBadge?: boolean;
  blurImage?: boolean;
  showBookmarkButton?: boolean;
  showUpdatedSubtitle?: boolean;
  analyticsClickEvent?: Record<string, unknown> | null;
  topLeftBadge?: string | null;
  bottomRightBadge?: string | null;
};

export default function InteractiveWorkCard({
  work,
  className,
  showRecentUpdateBadge = false,
  blurImage = false,
  showBookmarkButton = false,
  showUpdatedSubtitle = false,
  analyticsClickEvent = null,
  topLeftBadge = null,
  bottomRightBadge = null,
}: Props) {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";
  const title = work?.title || "Untitled";
  const flag = translationFlagEmoji(work?.language);
  const updatedAt = work?.updatedAt ? new Date(work.updatedAt as any) : null;
  const isUp = !!updatedAt && Date.now() - +updatedAt < 24 * 60 * 60 * 1000;
  const updatedLabel = formatUpdatedAt(work?.updatedAt, { thresholdDays: 100 });
  const publishLabel = publishTypeLabel(work?.publishType);
  const uploader = personLabel(work?.author) || personLabel(work?.translator);
  const topLabel = overlayTypeLabel({ type: work?.type, comicType: work?.comicType });
  const statusLine = joinParts([
    typeof work?.chapterCount === "number" ? `${work.chapterCount} ch` : null,
    work?.completion ? String(work.completion) : null,
  ]);
  const ratingValue =
    typeof work?.ratingAvg === "number" && typeof work?.ratingCount === "number"
      ? `${(Math.round(work.ratingAvg * 10) / 10).toFixed(1)} (${work.ratingCount})`
      : null;
  const chapterLoveValue = typeof work?.chapterLoveCount === "number" ? String(work.chapterLoveCount) : null;
  const genresLabel = genreText(work?.genres);
  const deviantLoveLabel = genreText(work?.deviantLoveTags);

  const handleTrackedClick = () => {
    if (analyticsClickEvent?.eventType) {
      sendAnalyticsEvent(analyticsClickEvent as any);
    }
  };

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!rootRef.current || !target) return;
      if (!rootRef.current.contains(target)) {
        setActive(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  const overlayClass = active ? "opacity-100" : "opacity-0 group-hover:opacity-100";
  const controlsClass = active ? "opacity-0 pointer-events-none" : "opacity-100 group-hover:opacity-0";

  return (
    <div
      ref={rootRef}
      className={[
        "group min-w-0 overflow-hidden rounded-[18px] border border-gray-200 bg-white/70 shadow-sm transition hover:shadow-lg",
        "dark:border-gray-800 dark:bg-[#08142e]/90",
        className || "",
      ].join(" ")}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Link
          href={href}
          className={`absolute inset-0 z-0 block ${active ? "pointer-events-none" : ""}`}
          aria-label={title}
          onClick={handleTrackedClick}
        />

        {work?.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={work.coverImage}
            alt={title}
            className={[
              "h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]",
              blurImage ? "blur-md" : "",
            ].join(" ")}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No cover</div>
        )}

        <div
          className={[
            "pointer-events-none absolute inset-0 z-20 bg-black/72 transition duration-200",
            overlayClass,
          ].join(" ")}
        />

        <div
          className={[
            "pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-3 text-white transition duration-200",
            overlayClass,
          ].join(" ")}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-2 pr-1">
              {topLabel ? <div className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-white/82">{topLabel}</div> : null}
              {uploader ? <div className="line-clamp-1 text-[12px] text-white/88">{uploader}</div> : null}

              {(statusLine || ratingValue || chapterLoveValue || updatedLabel) ? (
                <div className="space-y-1 text-[12px] leading-relaxed text-white/90">
                  {statusLine ? <div>{statusLine}</div> : null}

                  {(ratingValue || chapterLoveValue) ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {ratingValue ? <div>★ {ratingValue}</div> : null}
                      {chapterLoveValue ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Heart size={12} className="fill-current" />
                          <span>{chapterLoveValue}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {updatedLabel ? <div>{updatedLabel}</div> : null}
                </div>
              ) : null}
            </div>

            {deviantLoveLabel ? (
              <div className="mt-3 min-h-0 text-[11px] leading-5 text-white/86 line-clamp-1 md:line-clamp-2">
                {deviantLoveLabel}
              </div>
            ) : null}

            {genresLabel ? (
              <div className={`mt-2 min-h-0 text-[11px] leading-5 text-white/78 ${deviantLoveLabel ? "line-clamp-1 md:line-clamp-3" : "line-clamp-2 md:line-clamp-4"}`}>
                {genresLabel}
              </div>
            ) : (
              <div className="mt-3 flex-1" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
            {publishLabel ? <span className="rounded-full bg-white/14 px-2.5 py-1 backdrop-blur-sm">{publishLabel}</span> : null}
            {work?.language ? (
              <span className="rounded-full bg-white/14 px-2.5 py-1 backdrop-blur-sm">{String(work.language).toUpperCase()}</span>
            ) : null}
            {work?.isMature ? <span className="rounded-full bg-white/14 px-2.5 py-1 backdrop-blur-sm">18+</span> : null}
          </div>
        </div>

        <div
          className={[
            "absolute left-2.5 top-2.5 z-30 flex flex-col items-start gap-1.5 transition duration-200",
            controlsClass,
          ].join(" ")}
        >
          {topLeftBadge ? (
            <div className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              {topLeftBadge}
            </div>
          ) : null}
          {flag ? (
            <div
              className="rounded-full bg-black/45 px-3 py-1 text-[12px] leading-none text-white shadow-sm backdrop-blur-sm"
              title="Translation language"
              aria-label="Translation language"
            >
              <OriginFlag emoji={flag} title="Translation language" />
            </div>
          ) : null}
          {showRecentUpdateBadge && isUp ? (
            <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm">
              Up
            </span>
          ) : null}
        </div>

        <div
          className={[
            "absolute right-2.5 top-2.5 z-30 flex flex-col items-end gap-1.5 transition duration-200",
            controlsClass,
          ].join(" ")}
        >
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActive((prev) => !prev);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white shadow-sm transition hover:bg-black/55"
            aria-label={active ? "Hide work info" : "Show work info"}
            aria-pressed={active}
            title={active ? "Hide info" : "Show info"}
          >
            <Info size={13} strokeWidth={2.3} />
          </button>

          {showBookmarkButton && work?.id ? (
            <BookmarkIconButton
              workId={work.id}
              initialBookmarked={!!work.viewerBookmarked}
              variant="overlay"
              size="sm"
            />
          ) : null}
        </div>

        {bottomRightBadge ? (
          <div className={["absolute bottom-2 right-2 z-30 transition duration-200", controlsClass].join(" ")}>
            <div className="rounded-full bg-purple-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">{bottomRightBadge}</div>
          </div>
        ) : null}

      </div>

      <Link href={href} className="block px-3 pb-3 pt-3" onClick={handleTrackedClick}>
        <div className="line-clamp-2 text-sm font-extrabold leading-snug text-gray-900 dark:text-white sm:text-base">{title}</div>
        {showUpdatedSubtitle && updatedLabel ? (
          <div className="mt-1 line-clamp-1 text-[11px] font-medium leading-snug text-gray-500 dark:text-gray-400">
            {updatedLabel}
          </div>
        ) : null}
      </Link>
    </div>
  );
}
