"use client";

import Link from "next/link";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Crumb = { label: string; href: string };

type Props = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
};

export default function ScaffoldHeader({ title, description, crumbs }: Props) {
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    return (
      <header className="mb-8">
        {crumbs?.length ? (
          <nav className="mb-4 flex flex-wrap gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                <Link href={c.href} className="transition-colors hover:text-[var(--ink-accent)]">
                  {c.label}
                </Link>
                {i !== crumbs.length - 1 && <span className="opacity-40">/</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex items-center gap-3">
          <span className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink-fg)] md:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm text-[var(--ink-muted)] md:text-base">{description}</p>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-8">
      {crumbs?.length ? (
        <nav className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          <ol className="flex flex-wrap gap-2">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-2">
                <Link className="hover:text-pink-500" href={c.href}>
                  {c.label}
                </Link>
                {i !== crumbs.length - 1 && <span className="opacity-60">/</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 md:text-base">{description}</p>
      ) : null}
    </header>
  );
}
