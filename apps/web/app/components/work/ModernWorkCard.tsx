"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

type Person = { username?: string | null; name?: string | null } | null | undefined;

type WorkCardData = {
  id: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
  type?: string | null;
  comicType?: string | null;
  isMature?: boolean | null;
  chapterCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  author?: Person;
  translator?: Person;
};

function personLabel(person: Person) {
  if (!person) return null;
  if (person.name) return person.name;
  if (person.username) return `@${person.username}`;
  return null;
}

/**
 * Modern, premium work tile — image-forward poster with floating badges, rating
 * chip and a brand-glow hover lift. Animates into view (staggered) via Framer
 * Motion. Built from scratch for the modern UI.
 */
export default function ModernWorkCard({
  work,
  className,
  rank,
  index = 0,
}: {
  work: WorkCardData;
  className?: string;
  rank?: number;
  index?: number;
}) {
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";
  const title = work?.title || "Untitled";
  const cover = work?.coverImage || null;
  const isComic = String(work?.type || "").toUpperCase() === "COMIC";
  const typeLabel = isComic ? "Comic" : "Novel";
  const author = personLabel(work?.author) || personLabel(work?.translator);
  const rating =
    typeof work?.ratingAvg === "number" && (work?.ratingCount ?? 0) > 0
      ? (Math.round(work.ratingAvg * 10) / 10).toFixed(1)
      : null;
  const chapters = typeof work?.chapterCount === "number" ? work.chapterCount : null;
  const meta = [author, chapters != null ? `${chapters} ch` : null].filter(Boolean).join(" · ");

  return (
    <motion.div
      className={["shrink-0", className || ""].join(" ")}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="group block" aria-label={title}>
        <div className="relative overflow-hidden rounded-none bg-[var(--ink-surface-2)] shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_34px_-12px_rgba(124,58,237,0.5)] group-hover:ring-2 group-hover:ring-[var(--ink-accent)]/60">
          <div className="aspect-[3/4] w-full overflow-hidden">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ink-muted)]">
                No cover
              </div>
            )}
          </div>

          {/* hover scrim */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* rank chip (brand gradient) / type badge */}
          {typeof rank === "number" ? (
            <span className="absolute left-0 top-0 flex h-9 min-w-9 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-2 text-base font-black text-white shadow-lg">
              {rank}
            </span>
          ) : (
            <span className="absolute left-0 top-0 bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {typeLabel}
            </span>
          )}

          {work?.isMature ? (
            <span className="absolute right-0 top-0 bg-red-600 px-1.5 py-1 text-[10px] font-black text-white">18+</span>
          ) : null}

          {rating ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-sm bg-black/65 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {rating}
            </span>
          ) : null}

          {/* CTA revealed on hover */}
          <span className="absolute bottom-2 right-2 translate-y-2 bg-gradient-to-r from-blue-500 to-purple-600 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Read →
          </span>
        </div>

        <div className="mt-2.5">
          <div className="line-clamp-2 text-sm font-bold leading-snug text-[var(--ink-fg)] transition-colors group-hover:text-[var(--ink-accent)]">
            {title}
          </div>
          {meta ? <div className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-muted)]">{meta}</div> : null}
        </div>
      </Link>
    </motion.div>
  );
}
