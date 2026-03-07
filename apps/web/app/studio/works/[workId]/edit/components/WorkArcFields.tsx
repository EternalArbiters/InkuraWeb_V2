"use client";

import type { WorkLite } from "./useMyWorksLite";

export default function WorkArcFields({
  myWorks,
  loadingWorks,
  seriesTitle,
  setSeriesTitle,
  seriesOrder,
  setSeriesOrder,
  prevArcUrl,
  setPrevArcUrl,
  nextArcUrl,
  setNextArcUrl,
  onPickPrevWorkId,
  onPickNextWorkId,
}: {
  myWorks: WorkLite[];
  loadingWorks: boolean;
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  seriesOrder: string;
  setSeriesOrder: (v: string) => void;
  prevArcUrl: string;
  setPrevArcUrl: (v: string) => void;
  nextArcUrl: string;
  setNextArcUrl: (v: string) => void;
  onPickPrevWorkId: (id: string) => void;
  onPickNextWorkId: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div>
        <div className="text-sm font-semibold">Series</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Main series system for the new public UI. Use the same title on related works, then set the order.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Series title</span>
          <input
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            placeholder="Example: The Eruption Saga"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Arc order</span>
          <input
            value={seriesOrder}
            onChange={(e) => setSeriesOrder(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="1"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-800">
        <div className="text-sm font-semibold">Legacy manual arc links</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Optional fallback only. The public page now prioritizes the series system above.
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="text-sm font-semibold">Previous arc</div>
            <select
              disabled={loadingWorks}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                onPickPrevWorkId(id);
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              defaultValue=""
            >
              <option value="">Pick from my works…</option>
              {myWorks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.type})
                </option>
              ))}
            </select>
            <input
              value={prevArcUrl}
              onChange={(e) => setPrevArcUrl(e.target.value)}
              placeholder="Or paste external link…"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Next arc</div>
            <select
              disabled={loadingWorks}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                onPickNextWorkId(id);
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              defaultValue=""
            >
              <option value="">Pick from my works…</option>
              {myWorks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.type})
                </option>
              ))}
            </select>
            <input
              value={nextArcUrl}
              onChange={(e) => setNextArcUrl(e.target.value)}
              placeholder="Or paste external link…"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
