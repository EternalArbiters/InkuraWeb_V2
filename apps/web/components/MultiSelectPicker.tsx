"use client";

import * as React from "react";

export type PickerItem = { id: string; name: string; slug: string };

type Props = {
  title: string;
  subtitle?: string;
  items: PickerItem[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

export default function MultiSelectPicker({
  title,
  subtitle,
  items,
  selectedIds,
  onChange,
  placeholder = "Search...",
  className,
}: Props) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter(
      (it) => it.name.toLowerCase().includes(qq) || it.slug.toLowerCase().includes(qq),
    );
  }, [items, q]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 p-4 ${className || ""}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? (
            <div className="text-xs text-gray-600 dark:text-gray-300">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full md:w-[260px] px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => onChange([])}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
        Chosen: <b>{selectedIds.length}</b>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filtered.map((it) => {
          const checked = selectedIds.includes(it.id);
          const cls = checked
            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
            : "border-gray-200 dark:border-gray-800";
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => toggle(it.id)}
              className={`text-left rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 ${cls}`}
              title={it.name}
            >
              <span className="inline-flex items-center gap-2">
                <span className={`w-4 text-center font-bold ${checked ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                  {checked ? "" : ""}
                </span>
                <span className="truncate">{it.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
