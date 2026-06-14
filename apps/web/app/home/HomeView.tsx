"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

/** Animated aurora backdrop — soft brand-coloured light blooms drifting behind content. */
function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 -top-28 h-[30rem] w-[30rem] rounded-full bg-blue-500/20 blur-[110px] animate-blob dark:bg-blue-500/15" />
      <div className="absolute right-[-6rem] top-24 h-[28rem] w-[28rem] rounded-full bg-purple-600/20 blur-[110px] animate-blob animation-delay-2000 dark:bg-purple-600/15" />
      <div className="absolute bottom-10 left-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/15 blur-[120px] animate-blob dark:bg-fuchsia-500/10" />
    </div>
  );
}

/** Bold section header with a brand accent bar. */
function SectionHeader({ title, href, seeAllLabel }: { title: string; href: string; seeAllLabel: string }) {
  return (
    <motion.div
      className="mb-5 flex items-center justify-between gap-3"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">
        <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink-fg)] md:text-2xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="group/all shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-accent)]"
      >
        {seeAllLabel} <span className="inline-block transition-transform group-hover/all:translate-x-0.5">›</span>
      </Link>
    </motion.div>
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
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 py-4 no-scrollbar sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-4 md:gap-5">
          {items.map((work, i) => (
            <ModernWorkCard
              key={work.id}
              work={work}
              index={i}
              rank={ranked ? i + 1 : undefined}
              className="w-[140px] sm:w-[160px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Chooses the Home layout based on the active UI theme. Data is fetched in the
 * server `page.tsx`; the modern layout is a fully custom, animated build
 * (AuroraBackdrop + ModernHero + ModernWorkCard), while the classic layout is
 * preserved untouched.
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
    const totalWorks = railItems.reduce((n, r) => n + (r.works?.length || 0), 0);

    return (
      <main className="relative min-h-[calc(100vh-96px)] overflow-hidden bg-[var(--ink-bg)] text-[var(--ink-fg)]">
        <WelcomePopup />
        <AuroraBackdrop />

        <div className="relative z-10">
          {bannerWorks.length > 0 ? (
            <motion.div
              className="border-b border-[var(--ink-border)]"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <ModernHero works={bannerWorks} readLabel={readLabel} />
            </motion.div>
          ) : null}

          <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6">
            <motion.header
              className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <h1 className="text-4xl font-black leading-none tracking-tight md:text-5xl">
                  <span className="ink-gradient-text">{title}</span>
                </h1>
                <p className="mt-2 text-sm font-medium text-[var(--ink-muted)]">
                  {totalWorks} stories to explore
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
            </motion.header>

            <div className="space-y-16">
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
