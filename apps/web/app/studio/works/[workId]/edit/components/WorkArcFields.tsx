"use client";

import type { WorkLite } from "./useMyWorksLite";

export default function WorkArcFields({
  myWorks,
  loadingWorks,
  seriesTitle,
  setSeriesTitle,
  seriesOrder,
  setSeriesOrder,
}: {
  myWorks: WorkLite[];
  loadingWorks: boolean;
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  seriesOrder: string;
  setSeriesOrder: (v: string) => void;
}) {
  const existingSeries = Array.from(
    new Map(
      myWorks
        .filter((w) => w.seriesTitle)
        .map((w) => [String(w.seriesTitle).toLowerCase(), String(w.seriesTitle)])
    ).values()
  ).sort((a, b) => a.localeCompare(b));

  const seriesWorks = myWorks
    .filter((w) => String(w.seriesTitle || "").toLowerCase() === seriesTitle.trim().toLowerCase())
    .sort((a, b) => {
      const ao = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER;
      const bo = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">Series (optional)</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Put works into the same series by giving them the same series title, then set the arc order for this work.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_180px] gap-3">
        <div className="grid gap-2">
          <label className="text-sm font-semibold">Series title</label>
          <input
            list="work-series-title-list"
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            placeholder="Example: Eternal Arbiters"
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
          <datalist id="work-series-title-list">
            {existingSeries.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold">Arc order</label>
          <input
            inputMode="numeric"
            value={seriesOrder}
            onChange={(e) => setSeriesOrder(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="1"
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-white/40 dark:bg-gray-950/30">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Series preview</div>
        {loadingWorks ? (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading your works…</div>
        ) : seriesTitle.trim() ? (
          seriesWorks.length ? (
            <div className="mt-3 grid gap-2">
              {seriesWorks.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {typeof item.seriesOrder === "number" ? `Arc ${item.seriesOrder}` : "No order yet"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">This will create a new series for your works.</div>
          )
        ) : (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Leave blank if this work is standalone.</div>
        )}
      </div>
    </div>
  );
}
