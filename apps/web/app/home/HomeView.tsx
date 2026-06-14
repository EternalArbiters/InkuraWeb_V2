"use client";

import Link from "next/link";
import WelcomePopup from "./WelcomePopup";
import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

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
  /** Pre-rendered hero banner (server data passed down as a node), or null. */
  hero: React.ReactNode;
  /** Classic UI: pre-rendered server work rails. */
  rails: React.ReactNode;
  /** Modern UI: structured rail data, re-rendered Webtoon-style on the client. */
  railItems: RailItem[];
};

/** Webtoon-style horizontal rail used by the modern Home. */
function ModernRail({ title, href, works, seeAllLabel }: RailItem & { seeAllLabel: string }) {
  if (!works?.length) return null;
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-[var(--ink-fg)]">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-accent)]"
        >
          {seeAllLabel} ›
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 no-scrollbar">
        <div className="flex w-max gap-3 md:gap-4">
          {works.map((work) => (
            <InteractiveWorkCard
              key={work.id}
              work={work}
              className="w-[140px] shrink-0 snap-start sm:w-[165px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Chooses the Home layout based on the active UI theme. Data is fetched in the
 * server `page.tsx` and handed in as ready-to-render nodes (`hero`, `rails`) plus
 * structured `railItems` so both layouts share the same data without re-fetching.
 */
export default function HomeView({ title, searchLabel, libraryLabel, seeAllLabel, hero, rails, railItems }: Props) {
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[var(--ink-bg)] text-[var(--ink-fg)]">
        <WelcomePopup />

        {/* Full-bleed hero band, Webtoon-style */}
        {hero ? (
          <div className="border-b border-[var(--ink-border)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-6">{hero}</div>
          </div>
        ) : null}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-16">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">
              <Link href="/search" className="ink-btn-ghost">
                {searchLabel}
              </Link>
              <Link href="/library" className="ink-btn-primary">
                {libraryLabel}
              </Link>
            </div>
          </header>

          <div className="space-y-12">
            {railItems.map((rail) => (
              <ModernRail key={rail.href} {...rail} seeAllLabel={seeAllLabel} />
            ))}
          </div>

          <footer className="mt-14 border-t border-[var(--ink-border)] pt-8 text-xs text-[var(--ink-muted)]">
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
        {hero}
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
