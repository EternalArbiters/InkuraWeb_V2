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
                className="w-[42vw] max-w-[200px] sm:w-[175px] lg:w-[190px]"
              />
            ))}
          </div>
        </div>

        {/* edge arrow controls — clean circular buttons, centred on the posters */}
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ink-surface)]/95 text-[var(--ink-fg)] shadow-lg ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-[var(--ink-accent)] hover:text-white opacity-0 group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ink-surface)]/95 text-[var(--ink-fg)] shadow-lg ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-[var(--ink-accent)] hover:text-white opacity-0 group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight size={20} />
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

        {bannerWorks.length > 0 ? <ModernHero works={bannerWorks} /> : null}

        <div className="relative">
          <AuroraBackdrop />
          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:pt-16">
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
