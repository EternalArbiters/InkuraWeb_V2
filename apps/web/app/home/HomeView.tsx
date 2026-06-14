"use client";

import Link from "next/link";
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

/** Bold section header with a brand accent bar. */
function SectionHeader({ title, href, seeAllLabel }: { title: string; href: string; seeAllLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink-fg)] md:text-2xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-accent)]"
      >
        {seeAllLabel} ›
      </Link>
    </div>
  );
}

/** Horizontal rail of modern cards; pass `ranked` for the TOP-list numerals. */
function ModernRail({
  title,
  href,
  works,
  seeAllLabel,
  ranked = false,
}: RailItem & { seeAllLabel: string; ranked?: boolean }) {
  if (!works?.length) return null;
  const items = ranked ? works.slice(0, 10) : works;
  return (
    <section>
      <SectionHeader title={title} href={href} seeAllLabel={seeAllLabel} />
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 no-scrollbar sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-4 md:gap-5">
          {items.map((work, i) => (
            <ModernWorkCard
              key={work.id}
              work={work}
              rank={ranked ? i + 1 : undefined}
              className="w-[140px] shrink-0 sm:w-[160px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Chooses the Home layout based on the active UI theme. Data is fetched in the
 * server `page.tsx`; the modern layout is a fully custom build (ModernHero +
 * ModernWorkCard), while the classic layout is preserved untouched.
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
      <main className="min-h-[calc(100vh-96px)] bg-[var(--ink-bg)] text-[var(--ink-fg)]">
        <WelcomePopup />

        {bannerWorks.length > 0 ? (
          <div className="border-b border-[var(--ink-border)]">
            <ModernHero works={bannerWorks} readLabel={readLabel} />
          </div>
        ) : null}

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
              <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">
                {railItems.reduce((n, r) => n + (r.works?.length || 0), 0)} stories to explore
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/search" className="ink-btn-ghost">
                {searchLabel}
              </Link>
              <Link href="/library" className="ink-btn-primary">
                {libraryLabel}
              </Link>
            </div>
          </header>

          <div className="space-y-14">
            {featured ? <ModernRail {...featured} seeAllLabel={seeAllLabel} ranked /> : null}
            {restRails.map((rail) => (
              <ModernRail key={rail.href} {...rail} seeAllLabel={seeAllLabel} />
            ))}
          </div>

          <footer className="mt-16 border-t border-[var(--ink-border)] pt-8 text-xs text-[var(--ink-muted)]">
            Inkura v16
          </footer>
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
