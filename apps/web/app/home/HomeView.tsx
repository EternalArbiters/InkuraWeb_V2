"use client";

import Link from "next/link";
import WelcomePopup from "./WelcomePopup";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Props = {
  title: string;
  searchLabel: string;
  libraryLabel: string;
  /** Pre-rendered hero banner (server data passed down as a node), or null. */
  hero: React.ReactNode;
  /** Pre-rendered work rails (server components passed down as nodes). */
  rails: React.ReactNode;
};

/**
 * Chooses the Home layout based on the active UI theme. Data is fetched in the
 * server `page.tsx` and handed in as ready-to-render nodes (`hero`, `rails`) so
 * both layouts share the exact same data without re-fetching.
 */
export default function HomeView({ title, searchLabel, libraryLabel, hero, rails }: Props) {
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[var(--ink-bg)] text-[var(--ink-fg)]">
        <WelcomePopup />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-12">
          {hero}

          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="ink-eyebrow">Inkura</span>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-none">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/search" className="ink-btn-ghost">
                {searchLabel}
              </Link>
              <Link href="/library" className="ink-btn-primary">
                {libraryLabel}
              </Link>
            </div>
          </header>

          <div className="space-y-14">{rails}</div>

          <footer className="pt-8 border-t border-[var(--ink-border)] text-xs text-[var(--ink-muted)]">
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
