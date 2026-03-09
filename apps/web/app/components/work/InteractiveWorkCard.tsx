"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import OriginFlag from "@/app/components/OriginFlag";
import { formatUpdatedAt } from "@/lib/time";

type Person = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
} | null | undefined;

type WorkCardData = {
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
  author?: Person;
  translator?: Person;
};

function normalize(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function publishTypeLabel(publishType?: string | null) {
  const value = normalize(publishType);
  if (value === "ORIGINAL") return "Original";
  if (value === "TRANSLATION") return "Translation";
  if (value === "REUPLOAD") return "Reupload";
  return null;
}

function originFlagEmoji(input: Pick<WorkCardData, "type" | "comicType" | "language">) {
  const type = normalize(input.type);
  const comicType = normalize(input.comicType);
  const lang = String(input.language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

  if (type === "COMIC") {
    if (comicType === "MANGA") return "🇯🇵";
    if (comicType === "MANHWA") return "🇰🇷";
    if (comicType === "MANHUA") return "🇨🇳";
    if (comicType === "WESTERN") return "🌍";
    if (comicType === "OTHER") return "🏳️";
  }

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

type Props = {
  work: WorkCardData;
  className?: string;
  showRecentUpdateBadge?: boolean;
  blurImage?: boolean;
};

export default function InteractiveWorkCard({
  work,
  className,
  showRecentUpdateBadge = false,
  blurImage = false,
}: Props) {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";
  const title = work?.title || "Untitled";
  const flag = originFlagEmoji({ type: work?.type, comicType: work?.comicType, language: work?.language });
  const updatedAt = work?.updatedAt ? new Date(work.updatedAt as any) : null;
  const isUp = !!updatedAt && Date.now() - +updatedAt < 24 * 60 * 60 * 1000;
  const updatedLabel = formatUpdatedAt(work?.updatedAt, { thresholdDays: 100 });
  const publishLabel = publishTypeLabel(work?.publishType);
  const uploader = personLabel(work?.author) || personLabel(work?.translator);
  const statusLine = joinParts([
    typeof work?.chapterCount === "number" ? `${work.chapterCount} ch` : null,
    work?.completion ? String(work.completion) : null,
  ]);
  const ratingLine =
    typeof work?.ratingAvg === "number" && typeof work?.ratingCount === "number"
      ? `★ ${(Math.round(work.ratingAvg * 10) / 10).toFixed(1)} (${work.ratingCount})`
      : null;

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
        <Link href={href} className="absolute inset-0 z-0 block" aria-label={title} />

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

        <div className={[
          "pointer-events-none absolute inset-0 z-10 bg-black/60 transition duration-200",
          overlayClass,
        ].join(" ")} />

        <div className={[
          "pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-3 transition duration-200",
          overlayClass,
        ].join(" ")}>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-white backdrop-blur-sm">
            <div className="text-base font-extrabold leading-tight line-clamp-2">{title}</div>
            {uploader ? <div className="mt-1 text-[11px] text-white/80 line-clamp-1">{uploader}</div> : null}

            {(statusLine || updatedLabel || ratingLine) ? (
              <div className="mt-2 space-y-1 text-[11px] leading-relaxed text-white/85">
                {statusLine ? <div>{statusLine}</div> : null}
                {ratingLine ? <div>{ratingLine}</div> : null}
                {updatedLabel ? <div>{updatedLabel}</div> : null}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              {work?.type ? (
                <span className="rounded-full bg-white/15 px-2 py-1 backdrop-blur">{String(work.type)}</span>
              ) : null}
              {publishLabel ? <span className="rounded-full bg-white/15 px-2 py-1 backdrop-blur">{publishLabel}</span> : null}
              {work?.isMature ? <span className="rounded-full bg-white/15 px-2 py-1 backdrop-blur">18+</span> : null}
              {work?.language ? (
                <span className="rounded-full bg-white/15 px-2 py-1 backdrop-blur">{String(work.language).toUpperCase()}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute left-3 top-3 z-30 flex flex-col items-start gap-2">
          {flag ? (
            <div className="rounded-full bg-black/55 px-3 py-1 text-[12px] leading-none text-white backdrop-blur" title="Origin" aria-label="Origin">
              <OriginFlag emoji={flag} />
            </div>
          ) : null}
          {showRecentUpdateBadge && isUp ? (
            <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm">
              Up
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setActive((prev) => !prev);
          }}
          className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
          aria-label={active ? "Hide work info" : "Show work info"}
          aria-pressed={active}
          title={active ? "Hide info" : "Show info"}
        >
          <Info size={16} strokeWidth={2.4} />
        </button>
      </div>

      <Link href={href} className="block px-3 pb-3 pt-3">
        <div className="text-sm font-extrabold leading-snug text-gray-900 line-clamp-2 dark:text-white sm:text-base">{title}</div>
      </Link>
    </div>
  );
}
