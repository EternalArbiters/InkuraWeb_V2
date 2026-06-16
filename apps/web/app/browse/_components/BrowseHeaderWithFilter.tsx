"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ActionLink from "@/app/components/ActionLink";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Labels = {
  newest: string;
  liked: string;
  rated: string;
  anyPublishType: string;
  original: string;
  translation: string;
  reupload: string;
  author: string;
  translator: string;
  apply: string;
};

type Props = {
  title: string;
  searchHref?: string;
  searchLabel?: string;
  action: string;
  defaultSort: string;
  defaultPublishType: string;
  defaultAuthor: string;
  defaultTranslator: string;
  labels: Labels;
};

export default function BrowseHeaderWithFilter({
  title,
  searchHref = "/search",
  searchLabel = "Advanced search",
  action,
  defaultSort,
  defaultPublishType,
  defaultAuthor,
  defaultTranslator,
  labels,
}: Props) {
  const { uiTheme } = useUITheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (uiTheme === "modern") {
    const desktopChip =
      "shrink-0 h-9 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-2)] px-4 text-sm font-medium text-[var(--ink-fg)] outline-none transition-colors hover:border-[var(--ink-accent)] focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)]";
    const sheetInput =
      "w-full rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface-2)] px-4 py-3 text-sm text-[var(--ink-fg)] outline-none transition-colors focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)]";

    return (
      <>
        {/* ── Header row ── */}
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink-fg)] md:text-4xl">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter icon — mobile only */}
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="Open filters"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ink-fg)] shadow-sm ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:ring-transparent"
              >
                <SlidersHorizontal size={16} strokeWidth={2.5} />
              </button>

              {/* Advanced search */}
              <Link
                href={searchHref}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[var(--ink-fg)] shadow-sm ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:ring-transparent"
              >
                <Search size={14} strokeWidth={2.5} className="text-[var(--ink-accent)] transition group-hover:text-white" />
                {searchLabel}
              </Link>
            </div>
          </header>
        </div>

        {/* ── Desktop sticky filter bar ── */}
        <div
          className="hidden md:block md:sticky md:top-20 md:z-30 md:border-b md:border-[var(--ink-border)] md:backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--ink-bg) 85%, transparent)" }}
        >
          <div className="mx-auto max-w-6xl px-4">
            <form action={action} method="get" className="flex flex-wrap items-center gap-2 py-3">
              <select name="sort" defaultValue={defaultSort} className={desktopChip}>
                <option value="newest">{labels.newest}</option>
                <option value="liked">{labels.liked}</option>
                <option value="rated">{labels.rated}</option>
              </select>
              <select name="publishType" defaultValue={defaultPublishType} className={desktopChip}>
                <option value="">{labels.anyPublishType}</option>
                <option value="ORIGINAL">{labels.original}</option>
                <option value="TRANSLATION">{labels.translation}</option>
                <option value="REUPLOAD">{labels.reupload}</option>
              </select>
              <input name="author" defaultValue={defaultAuthor} placeholder={labels.author} className={desktopChip} />
              <input name="translator" defaultValue={defaultTranslator} placeholder={labels.translator} className={desktopChip} />
              <button
                type="submit"
                className="shrink-0 ml-auto h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              >
                {labels.apply}
              </button>
            </form>
          </div>
        </div>

        {/* ── Mobile bottom sheet backdrop ── */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            sheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSheetOpen(false)}
        />

        {/* ── Mobile bottom sheet ── */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            sheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            background: "var(--ink-bg)",
            borderTop: "1px solid var(--ink-border)",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full" style={{ background: "var(--ink-border)" }} />
          </div>

          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--ink-accent)]" />
              <span className="text-base font-bold text-[var(--ink-fg)]">Filter</span>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ink-border)] text-[var(--ink-muted)] transition hover:text-[var(--ink-fg)]"
            >
              <X size={15} />
            </button>
          </div>

          <div className="h-px mx-5" style={{ background: "var(--ink-border)" }} />

          {/* Sheet filters */}
          <form
            action={action}
            method="get"
            onSubmit={() => setSheetOpen(false)}
            className="flex flex-col gap-3 px-5 pt-4 pb-2"
          >
            <select name="sort" defaultValue={defaultSort} className={sheetInput}>
              <option value="newest">{labels.newest}</option>
              <option value="liked">{labels.liked}</option>
              <option value="rated">{labels.rated}</option>
            </select>
            <select name="publishType" defaultValue={defaultPublishType} className={sheetInput}>
              <option value="">{labels.anyPublishType}</option>
              <option value="ORIGINAL">{labels.original}</option>
              <option value="TRANSLATION">{labels.translation}</option>
              <option value="REUPLOAD">{labels.reupload}</option>
            </select>
            <input name="author" defaultValue={defaultAuthor} placeholder={labels.author} className={sheetInput} />
            <input name="translator" defaultValue={defaultTranslator} placeholder={labels.translator} className={sheetInput} />

            <button
              type="submit"
              className="mt-1 h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-base font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              {labels.apply}
            </button>
          </form>
        </div>
      </>
    );
  }

  /* ── Classic mode ── */
  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900";
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="pt-10 pb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        <ActionLink href={searchHref}>{searchLabel}</ActionLink>
      </div>
      <form action={action} method="get" className="mt-2 mb-6 grid grid-cols-1 gap-3 md:grid-cols-[160px_200px_1fr_1fr_140px]">
        <select name="sort" defaultValue={defaultSort} className={inputClass}>
          <option value="newest">{labels.newest}</option>
          <option value="liked">{labels.liked}</option>
          <option value="rated">{labels.rated}</option>
        </select>
        <select name="publishType" defaultValue={defaultPublishType} className={inputClass}>
          <option value="">{labels.anyPublishType}</option>
          <option value="ORIGINAL">{labels.original}</option>
          <option value="TRANSLATION">{labels.translation}</option>
          <option value="REUPLOAD">{labels.reupload}</option>
        </select>
        <input name="author" defaultValue={defaultAuthor} placeholder={labels.author} className={inputClass} />
        <input name="translator" defaultValue={defaultTranslator} placeholder={labels.translator} className={inputClass} />
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white hover:brightness-110"
        >
          {labels.apply}
        </button>
      </form>
    </div>
  );
}
