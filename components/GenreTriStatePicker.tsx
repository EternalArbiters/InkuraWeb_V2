"use client";

import * as React from "react";

type Genre = { id: string; name: string; slug: string };

type Props = {
  genres: Genre[];
  initialInclude: string[];
  initialExclude: string[];
  nameInclude?: string;
  nameExclude?: string;
};

// Tri-state per genre:
// neutral -> include -> exclude -> neutral
export default function GenreTriStatePicker({
  genres,
  initialInclude,
  initialExclude,
  nameInclude = "gi",
  nameExclude = "ge",
}: Props) {
  const [q, setQ] = React.useState("");
  const [include, setInclude] = React.useState<string[]>(initialInclude);
  const [exclude, setExclude] = React.useState<string[]>(initialExclude);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return genres;
    return genres.filter(
      (g) => g.name.toLowerCase().includes(qq) || g.slug.toLowerCase().includes(qq),
    );
  }, [genres, q]);

  function stateOf(slug: string) {
    if (include.includes(slug)) return "include" as const;
    if (exclude.includes(slug)) return "exclude" as const;
    return "neutral" as const;
  }

  function cycle(slug: string) {
    const s = stateOf(slug);
    if (s === "neutral") {
      setExclude((prev) => prev.filter((x) => x !== slug));
      setInclude((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      return;
    }
    if (s === "include") {
      setInclude((prev) => prev.filter((x) => x !== slug));
      setExclude((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      return;
    }
    // exclude -> neutral
    setExclude((prev) => prev.filter((x) => x !== slug));
  }

  function clearAll() {
    setInclude([]);
    setExclude([]);
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">Genres</div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for genre..."
            className="w-full md:w-[260px] px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Hidden inputs so this works inside a <form method="GET"> */}
      <input type="hidden" name={nameInclude} value={include.join(",")} />
      <input type="hidden" name={nameExclude} value={exclude.join(",")} />

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
        Include: <b>{include.length}</b> &nbsp;•&nbsp; Exclude: <b>{exclude.length}</b>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filtered.map((g) => {
          const s = stateOf(g.slug);
          const badge = s === "include" ? "+" : s === "exclude" ? "−" : "";
          const cls =
            s === "include"
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
              : s === "exclude"
                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                : "border-gray-200 dark:border-gray-800";
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => cycle(g.slug)}
              className={`text-left rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 ${cls}`}
              title={g.name}
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-4 text-center font-bold">{badge}</span>
                <span className="truncate">{g.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
