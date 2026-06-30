"use client";

import { useState } from "react";
import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react";

/**
 * Interactive chrome for the Advanced Search page. Renders four controls:
 *   1. an "Advanced Filters" pill (left-arrow) that toggles the advanced panel,
 *   2. the search text input,
 *   3. a magnifier submit button,
 *   4. a funnel button that toggles the quick filter chips.
 *
 * Both panels stay mounted (hidden via CSS, not unmounted) so their form fields
 * keep their values and still submit with `#search-form` even while collapsed.
 */
export default function SearchControls({
  q,
  searchPlaceholder,
  searchLabel,
  advancedLabel,
  filtersLabel,
  filterChips,
  advancedPanel,
}: {
  q: string;
  searchPlaceholder: string;
  searchLabel: string;
  advancedLabel: string;
  filtersLabel: string;
  filterChips: React.ReactNode;
  advancedPanel: React.ReactNode;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mt-6">
      {/* Search row (top): input + magnifier + funnel — round buttons like the pill */}
      <div className="flex items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] px-5 py-3.5 text-base text-[var(--ink-fg)] outline-none transition focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)] ink-input"
        />
        <button
          type="submit"
          aria-label={searchLabel}
          title={searchLabel}
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white transition hover:brightness-110"
        >
          <Search size={20} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label={filtersLabel}
          title={filtersLabel}
          className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border transition ${
            showFilters
              ? "border-[var(--ink-accent)] bg-[var(--ink-surface-2)] text-[var(--ink-accent)]"
              : "border-[var(--ink-border)] bg-[var(--ink-surface)] text-[var(--ink-fg)] hover:border-[var(--ink-accent)] hover:text-[var(--ink-accent)]"
          }`}
        >
          <SlidersHorizontal size={20} strokeWidth={2.3} />
        </button>
      </div>

      {/* Quick filter chips (All / Newest / Any genre / tag) — revealed by the funnel */}
      <div className={showFilters ? "mt-3 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-3" : "hidden"}>
        {filterChips}
      </div>

      {/* Advanced Filters — pill button (below), like the browse "Advanced search" pill */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-inset backdrop-blur-sm transition hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:ring-transparent ${
            showAdvanced
              ? "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white ring-transparent"
              : "border-white/10 bg-white/5 text-[var(--ink-fg)] ring-white/10"
          }`}
        >
          <ChevronLeft
            size={16}
            strokeWidth={2.5}
            className={showAdvanced ? "text-white" : "text-[var(--ink-accent)] transition group-hover:text-white"}
          />
          {advancedLabel}
        </button>
      </div>

      {/* Advanced filters panel — revealed by the pill */}
      <div className={showAdvanced ? "mt-4 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-4" : "hidden"}>
        {advancedPanel}
      </div>
    </div>
  );
}
