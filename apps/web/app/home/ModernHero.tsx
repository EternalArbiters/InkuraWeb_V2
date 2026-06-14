"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerWork } from "@/server/services/home/getBannerWorks";

const AUTO_SLIDE_MS = 6000;

/**
 * Cinematic featured hero for the modern Home — large editorial banner with a
 * left-aligned text panel (type eyebrow, big title, author, brand CTA), crossfade
 * slides, arrows and progress dots. Built fresh for the modern UI.
 */
export default function ModernHero({ works, readLabel }: { works: BannerWork[]; readLabel: string }) {
  const [index, setIndex] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = works.length;

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIndex((i) => (i + 1) % total), AUTO_SLIDE_MS);
  }, [total]);

  React.useEffect(() => {
    if (total < 2) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, total, resetTimer]);

  const goTo = (i: number) => {
    setIndex(((i % total) + total) % total);
    resetTimer();
  };

  const touchStartX = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(index + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (total === 0) return null;

  const work = works[index];
  const typeLabel = work.type === "COMIC" ? "Comic" : "Novel";
  const author = work.author?.username ? `@${work.author.username}` : null;

  return (
    <section
      className="relative w-full overflow-hidden rounded-none bg-gray-950 aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/8]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {works.map((w, i) => {
        const img = w.bannerImage || w.coverImage;
        return (
          <div
            key={w.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={w.title} className="h-full w-full object-cover" draggable={false} />
            ) : (
              <div className="h-full w-full bg-gray-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          </div>
        );
      })}

      {/* text panel */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full max-w-3xl p-5 sm:p-8 lg:p-12">
          <span className="inline-block rounded-sm bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
            {typeLabel}
            {author ? <span className="ml-1.5 font-medium text-white/80">{author}</span> : null}
          </span>
          <h2 className="mt-3 line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
            {work.title}
          </h2>
          <Link
            href={`/w/${work.slug}`}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/40 transition hover:brightness-110"
          >
            {readLabel}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* arrows */}
      {total > 1 ? (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65 sm:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65 sm:flex"
          >
            <ChevronRight size={20} />
          </button>
        </>
      ) : null}

      {/* dots */}
      {total > 1 ? (
        <div className="absolute bottom-4 right-5 z-20 flex gap-1.5">
          {works.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
