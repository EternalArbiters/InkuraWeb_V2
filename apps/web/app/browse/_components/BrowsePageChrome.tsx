"use client";

import Link from "next/link";
import ActionLink from "@/app/components/ActionLink";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Props = {
  title: string;
  count?: number;
  searchHref?: string;
  searchLabel?: string;
};

export default function BrowsePageChrome({
  title,
  count,
  searchHref = "/search",
  searchLabel = "Advanced search",
}: Props) {
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    return (
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
          <div>
            {count != null && (
              <p className="mb-0.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {count} works
              </p>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink-fg)] md:text-4xl">{title}</h1>
          </div>
        </div>
        <Link
          href={searchHref}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:brightness-110"
        >
          {searchLabel}
        </Link>
      </header>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      </div>
      <ActionLink href={searchHref}>{searchLabel}</ActionLink>
    </div>
  );
}
