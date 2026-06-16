"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Star, Info } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import BookmarkIconButton from "@/app/components/work/BookmarkIconButton";

type Person = { username?: string | null; name?: string | null } | null | undefined;
type Genre = { name?: string | null; slug?: string | null } | string | null | undefined;

type WorkCardData = {
  id: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
  type?: string | null;
  comicType?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  status?: string | null;
  language?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  author?: Person;
  translator?: Person;
  genres?: Genre[] | null;
  deviantLoveTags?: Genre[] | null;
  viewerBookmarked?: boolean | null;
};

function personLabel(person: Person) {
  if (!person) return null;
  if (person.name) return person.name;
  if (person.username) return `@${person.username}`;
  return null;
}

function titleCase(value?: string | null) {
  const normalized = String(value || "").trim().replace(/[_-]+/g, " ").toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// Entrance is driven by the parent rail's stagger container (one Intersection
// observer per row instead of one per card) — much lighter on scroll.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

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
  const unique = Array.from(new Set(names));
  return unique.length ? unique.join(", ") : null;
}

/**
 * Modern, premium work tile — square poster with floating badges, an info (!)
 * toggle that reveals a details overlay, a bookmark button, rating chip and a
 * brand-glow hover lift. Animates into view (staggered) via Framer Motion.
 */
export default function ModernWorkCard({
  work,
  className,
  rank,
  topLeftBadge = null,
  showBookmark = false,
  blurImage = false,
}: {
  work: WorkCardData;
  className?: string;
  rank?: number;
  topLeftBadge?: string | null;
  showBookmark?: boolean;
  blurImage?: boolean;
}) {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";
  const title = work?.title || "Untitled";
  const cover = work?.coverImage || null;
  const isComic = String(work?.type || "").toUpperCase() === "COMIC";
  const comicTypeLabel = titleCase(work?.comicType);
  const typeLabel =
    comicTypeLabel && comicTypeLabel !== "Unknown" && comicTypeLabel !== "Other"
      ? comicTypeLabel
      : isComic
        ? "Comic"
        : "Novel";
  const author = personLabel(work?.author) || personLabel(work?.translator);
  const rating =
    typeof work?.ratingAvg === "number" && (work?.ratingCount ?? 0) > 0
      ? (Math.round(work.ratingAvg * 10) / 10).toFixed(1)
      : null;
  const chapters = typeof work?.chapterCount === "number" ? work.chapterCount : null;
  const meta = [author, chapters != null ? `${chapters} ch` : null].filter(Boolean).join(" · ");
  const statusLine = [chapters != null ? `${chapters} ch` : null, work?.completion ? String(work.completion) : null]
    .filter(Boolean)
    .join(" · ");
  const genresLabel = genreText(work?.genres);
  const deviantLoveLabel = genreText(work?.deviantLoveTags);

  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) setActive(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  return (
    <motion.div className={["shrink-0", className || ""].join(" ")} variants={cardVariants}>
      <div
        ref={rootRef}
        className="group block transform-gpu transition-transform duration-300 ease-out hover:-translate-y-1.5"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-none bg-[var(--ink-surface-2)] shadow-sm ring-1 ring-black/[0.06] transition duration-300 group-hover:shadow-[0_16px_34px_-12px_rgba(124,58,237,0.5)] group-hover:ring-2 group-hover:ring-[var(--ink-accent)]/60">
          <Link href={href} className="absolute inset-0 z-0" aria-label={title} />

          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={title}
              loading="lazy"
              className={`h-full w-full transform-gpu object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08] ${
                blurImage ? "blur-md" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ink-muted)]">
              No cover
            </div>
          )}

          {/* rank chip / arc badge / type badge */}
          {typeof rank === "number" ? (
            <span className="absolute left-0 top-0 z-10 flex h-9 min-w-9 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-2 text-base font-black text-white shadow-lg">
              {rank}
            </span>
          ) : topLeftBadge ? (
            <span className="absolute left-0 top-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              {topLeftBadge}
            </span>
          ) : (
            <span className="absolute left-0 top-0 z-10 bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {typeLabel}
            </span>
          )}

          {work?.isMature ? (
            <span className="absolute bottom-2 right-2 z-10 rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
              18+
            </span>
          ) : null}

          {rating ? (
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-sm bg-black/65 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {rating}
            </span>
          ) : null}

          {/* controls: info (!) toggle + bookmark */}
          <div
            className={`absolute right-1.5 top-1.5 z-30 flex flex-col items-end gap-1.5 transition duration-200 ${
              active ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActive((prev) => !prev);
              }}
              aria-label={active ? "Hide info" : "Show info"}
              aria-pressed={active}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/65"
            >
              <Info size={13} strokeWidth={2.3} />
            </button>
            {showBookmark && work?.id ? (
              <BookmarkIconButton
                workId={work.id}
                initialBookmarked={!!work.viewerBookmarked}
                variant="overlay"
                size="sm"
              />
            ) : null}
          </div>

          {/* info overlay (toggled by the ! button) */}
          <div
            className={`absolute inset-0 z-40 flex flex-col p-3 text-white transition duration-200 ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setActive(false)}
          >
            <div className="absolute inset-0 bg-black/82 backdrop-blur-[2px]" />
            <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto no-scrollbar">
              <div className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-white/85">{typeLabel}</div>
              {author ? <div className="line-clamp-1 text-[12px] text-white/85">{author}</div> : null}
              {statusLine ? <div className="text-[12px] text-white/85">{statusLine}</div> : null}
              {rating ? (
                <div className="inline-flex items-center gap-1 text-[12px] text-white/90">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {rating}
                </div>
              ) : null}
              {deviantLoveLabel ? (
                <div className="line-clamp-2 text-[11px] leading-5 text-white/80">{deviantLoveLabel}</div>
              ) : null}
              {genresLabel ? (
                <div className="line-clamp-3 text-[11px] leading-5 text-white/70">{genresLabel}</div>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-[10px] font-semibold">
                {work?.language ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">{String(work.language).toUpperCase()}</span>
                ) : null}
                {work?.isMature ? <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">18+</span> : null}
              </div>
            </div>
          </div>
        </div>

        <Link href={href} className="block">
          <div className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--ink-fg)] transition-colors group-hover:text-[var(--ink-accent)] sm:text-base">
            {title}
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
