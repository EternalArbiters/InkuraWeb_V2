"use client";

import * as React from "react";
import Link from "next/link";
import type { BannerWork } from "@/server/services/home/getBannerWorks";

const AUTO_SLIDE_MS = 5000;

export default function HeroBanner({ works }: { works: BannerWork[] }) {
  const [index, setIndex] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = works.length;

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_SLIDE_MS);
  }

  React.useEffect(() => {
    if (total < 2) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  });

  function goTo(i: number) {
    setIndex(i);
    resetTimer();
  }

  function prev() {
    goTo((index - 1 + total) % total);
  }

  function next() {
    goTo((index + 1) % total);
  }

  const touchStartX = React.useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
    }
    touchStartX.current = null;
  }

  if (total === 0) return null;

  const work = works[index];
  const image = work.bannerImage || work.coverImage;

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl bg-gray-900 aspect-square md:aspect-[21/9]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* slides */}
      {works.map((w, i) => {
        const img = w.bannerImage || w.coverImage;
        return (
          <div
            key={w.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-500 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {img ? (
              <img
                src={img}
                alt={w.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        );
      })}

      {/* text overlay */}
      <Link
        href={`/w/${work.slug}`}
        className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10 group"
        tabIndex={index !== index ? -1 : 0}
      >
        <p className="text-[11px] uppercase tracking-widest text-white/60 mb-1">
          {work.type === "COMIC" ? "Comic" : "Novel"}{work.author.username ? ` · ${work.author.username}` : ""}
        </p>
        <h2 className="text-lg md:text-2xl font-extrabold text-white leading-tight line-clamp-2 group-hover:underline">
          {work.title}
        </h2>
      </Link>

      {/* prev/next arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            ›
          </button>
        </>
      )}

      {/* dots */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {works.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
