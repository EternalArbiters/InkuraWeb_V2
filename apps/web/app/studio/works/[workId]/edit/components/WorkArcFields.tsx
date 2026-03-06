"use client";

import type { WorkLite } from "./useMyWorksLite";

export default function WorkArcFields({
  myWorks,
  loadingWorks,
  prevArcUrl,
  setPrevArcUrl,
  nextArcUrl,
  setNextArcUrl,
  onPickPrevWorkId,
  onPickNextWorkId,
}: {
  myWorks: WorkLite[];
  loadingWorks: boolean;
  prevArcUrl: string;
  setPrevArcUrl: (v: string) => void;
  nextArcUrl: string;
  setNextArcUrl: (v: string) => void;
  onPickPrevWorkId: (id: string) => void;
  onPickNextWorkId: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">Series arcs (optional)</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Pilih dari karya yang kamu upload dulu. Kalau tidak ada, isi link external.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="grid gap-2">
          <div className="text-sm font-semibold">Previous arc</div>
          <select
            disabled={loadingWorks}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              onPickPrevWorkId(id);
            }}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>
    </div>
  );
}
