"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WelcomePopup from "./WelcomePopup";
import HeroBanner from "./HeroBanner";
import ModernHero from "./ModernHero";
import ModernWorkCard from "@/app/components/work/ModernWorkCard";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";
import type { BannerWork } from "@/server/services/home/getBannerWorks";

type RailItem = {
  title: string;
  href: string;
  works: any[];
};

type Props = {
  title: string;
  searchLabel: string;
  libraryLabel: string;
  seeAllLabel: string;
  readLabel: string;
  bannerWorks: BannerWork[];
  /** Classic UI: pre-rendered server work rails. */
  rails: React.ReactNode;
  /** Modern UI: structured rail data, re-rendered on the client. */
  railItems: RailItem[];
};

/** Subtle animated brand glow drifting behind the content rows. */
function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 top-[20%] h-[30rem] w-[30rem] rounded-full bg-blue-600/10 blur-[120px] animate-blob" />
      <div className="absolute right-[-6rem] top-[50%] h-[28rem] w-[28rem] rounded-full bg-purple-600/12 blur-[120px] animate-blob animation-delay-2000" />
    </div>
  );
}

/** Bold Netflix-style row header. */
function SectionHeader({ title, href, seeAllLabel }: { title: string; href: string; seeAllLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
        <h2 className="text-lg font-extrabold tracking-tight text-[var(--ink-fg)] md:text-xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="group/all shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)] opacity-100 transition-all hover:text-[var(--ink-accent)] md:opacity-0 md:group-hover/row:opacity-100"
      >
        {seeAllLabel} <span className="inline-block transition-transform group-hover/all:translate-x-0.5">›</span>
      </Link>
    </div>
  );
}

/** Netflix-style row: horizontal poster scroller with edge arrow controls. */
function ModernRail({
  title,
  href,
  works,
  seeAllLabel,
  ranked = false,
}: RailItem & { seeAllLabel: string; ranked?: boolean }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollByDir = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!works?.length) return null;
  const items = ranked ? works.slice(0, 10) : works;

  return (
    <section className="group/row relative">
      <SectionHeader title={title} href={href} seeAllLabel={seeAllLabel} />

      <div className="relative">
        <div
          ref={scrollerRef}
          className="-mx-4 overflow-x-auto overscroll-x-contain px-4 py-4 no-scrollbar sm:-mx-6 sm:px-6"
        >
          <div className="flex w-max gap-3 md:gap-4">
            {items.map((work, i) => (
              <ModernWorkCard
                key={work.id}
                work={work}
                index={i}
                rank={ranked ? i + 1 : undefined}
                className="w-[135px] sm:w-[155px] lg:w-[170px]"
              />
            ))}
          </div>
        </div>

        {/* edge arrow controls */}
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-4 bottom-4 z-20 hidden w-12 items-center justify-center bg-gradient-to-r from-[var(--ink-bg)] to-transparent text-[var(--ink-fg)] opacity-0 transition-opacity hover:from-[var(--ink-bg)] group-hover/row:opacity-100 md:flex"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink-surface)] shadow-lg ring-1 ring-black/10">
            <ChevronLeft size={22} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-4 bottom-4 z-20 hidden w-12 items-center justify-center bg-gradient-to-l from-[var(--ink-bg)] to-transparent text-[var(--ink-fg)] opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink-surface)] shadow-lg ring-1 ring-black/10">
            <ChevronRight size={22} />
          </span>
        </button>
      </div>
    </section>
  );
}

/**
 * Chooses the Home layout based on the active UI theme. Data is fetched in the
 * server `page.tsx`; the modern layout is a fully custom, Netflix-style build
 * (cinematic billboard + poster rows), while the classic layout is preserved.
 */
export default function HomeView({
  title,
  searchLabel,
  libraryLabel,
  seeAllLabel,
  readLabel,
  bannerWorks,
  rails,
  railItems,
}: Props) {
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    const [featured, ...restRails] = railItems;

    return (
      <main className="relative min-h-[calc(100vh-96px)] overflow-hidden bg-[var(--ink-bg)] text-[var(--ink-fg)]">
        <WelcomePopup />

        {bannerWorks.length > 0 ? <ModernHero works={bannerWorks} readLabel={readLabel} /> : null}

        <div className="relative">
          <AuroraBackdrop />
          <div
            className={`relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-6 ${
              bannerWorks.length > 0 ? "-mt-16 lg:-mt-24" : "pt-10"
            }`}
          >
            <div className="space-y-10">
              {featured ? <ModernRail {...featured} seeAllLabel={seeAllLabel} ranked /> : null}
              {restRails.map((rail) => (
                <ModernRail key={rail.href} {...rail} seeAllLabel={seeAllLabel} />
              ))}
            </div>

            <footer className="mt-20 border-t border-[var(--ink-border)] pt-8 text-xs text-[var(--ink-muted)]">
              Inkura v16
            </footer>
          </div>
        </div>
      </main>
    );
  }

  // Classic UI — unchanged from the original Home page.
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <WelcomePopup />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8 space-y-10">
        {bannerWorks.length > 0 ? <HeroBanner works={bannerWorks} /> : null}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
            >
              {searchLabel}
            </Link>
            <Link
              href="/library"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
            >
              {libraryLabel}
            </Link>
          </div>
        </header>

        {rails}

        <footer className="pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
          Inkura v16
        </footer>
      </div>
    </main>
  );
}
