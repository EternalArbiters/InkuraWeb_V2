"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";
import type { BannerWork } from "@/server/services/home/getBannerWorks";

const AUTO_SLIDE_MS = 7000;

/**
 * Netflix-style cinematic billboard for the modern Home — full-bleed featured
 * artwork that fades into the page, with a left-aligned editorial panel
 * (type/author eyebrow, large title, synopsis, Play + More info buttons),
 * crossfade slides and progress dots. Built fresh for the modern UI.
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

  if (total === 0) return null;

  const work = works[index];
  const typeLabel = work.type === "COMIC" ? "Comic" : "Novel";
  const author = work.author?.username ? `@${work.author.username}` : null;

  return (
    <section className="relative h-[64vh] min-h-[460px] w-full overflow-hidden bg-gray-950 sm:h-[74vh] lg:h-[86vh]">
      {works.map((w, i) => {
        const img = w.bannerImage || w.coverImage;
        return (
          <div
            key={w.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={w.title} className="h-full w-full object-cover object-top" draggable={false} />
            ) : (
              <div className="h-full w-full bg-gray-800" />
            )}
          </div>
        );
      })}

      {/* cinematic gradients — dark for legibility + bottom fade into the page */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-bg)] via-[var(--ink-bg)]/15 to-transparent" />

      {/* editorial panel */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl lg:max-w-2xl"
          >
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              {typeLabel}
              {author ? <span className="ml-1.5 font-medium text-white/75">{author}</span> : null}
            </span>

            <h1 className="mt-4 line-clamp-2 text-3xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-7xl">
              {work.title}
            </h1>

            {work.description ? (
              <p className="mt-4 line-clamp-2 max-w-xl text-sm text-white/80 drop-shadow sm:text-base lg:line-clamp-3">
                {work.description}
              </p>
            ) : null}

            <div className="mt-7 flex items-center gap-3">
              <Link
                href={`/w/${work.slug}`}
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-gray-950 shadow-xl transition hover:bg-white/90"
              >
                <Play size={17} className="fill-gray-950" />
                {readLabel}
              </Link>
              <Link
                href={`/w/${work.slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Info size={17} />
                More info
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* progress dots */}
      {total > 1 ? (
        <div className="absolute bottom-10 right-5 z-20 flex gap-1.5 sm:bottom-12 sm:right-8">
          {works.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
