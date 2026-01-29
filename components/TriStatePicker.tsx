"use client";

import * as React from "react";

type Item = { id: string; name: string; slug: string };

type Props = {
  title: string;
  items: Item[];
  includeSlugs: string[];
  excludeSlugs: string[];
  onChange: (next: { include: string[]; exclude: string[] }) => void;
  placeholder?: string;
};

export default function TriStatePicker({
  title,
  items,
  includeSlugs,
  excludeSlugs,
  onChange,
  placeholder = "Search...",
}: Props) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((g) => g.name.toLowerCase().includes(qq) || g.slug.toLowerCase().includes(qq));
  }, [items, q]);

  function cycle(slug: string) {
    const inc = new Set(includeSlugs);
    const exc = new Set(excludeSlugs);
    if (!inc.has(slug) && !exc.has(slug)) {
      inc.add(slug);
    } else if (inc.has(slug)) {
      inc.delete(slug);
      exc.add(slug);
    } else {
      exc.delete(slug);
    }
    onChange({ include: Array.from(inc), exclude: Array.from(exc) });
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Klik item: netral → include () → exclude () → netral
          </div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full md:w-[260px] px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filtered.map((g) => {
          const isInclude = includeSlugs.includes(g.slug);
          const isExclude = excludeSlugs.includes(g.slug);

          const badge = isInclude ? "" : isExclude ? "" : "";
          const cls = isInclude
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            : isExclude
              ? "border-red-500 bg-red-50 dark:bg-red-950/30"
              : "border-gray-200 dark:border-gray-800";

          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => cycle(g.slug)}
              className={`text-left rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 ${cls}`}
              title={g.name}
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-5 text-center">{badge}</span>
                <span className="truncate">{g.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
        Include: <b>{includeSlugs.length}</b> · Exclude: <b>{excludeSlugs.length}</b>
      </div>
    </div>
  );
}
