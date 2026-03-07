"use client";

import * as React from "react";

type WorkLite = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  coverImage?: string | null;
  updatedAt?: string | null;
  seriesOrder?: number | null;
};

type SeriesLite = {
  id: string;
  title: string;
  works: WorkLite[];
};

async function callSeriesApi(body: Record<string, unknown>, method: "PATCH" | "POST" = "PATCH") {
  const res = await fetch("/api/studio/series", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error || "Request failed");
  return json;
}

export default function StudioSeriesManagerClient({
  initialSeries,
  initialUnassignedWorks,
}: {
  initialSeries: SeriesLite[];
  initialUnassignedWorks: WorkLite[];
}) {
  const [series, setSeries] = React.useState<SeriesLite[]>(initialSeries);
  const [unassignedWorks, setUnassignedWorks] = React.useState<WorkLite[]>(initialUnassignedWorks);
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<string>(initialSeries[0]?.id || "");
  const [newSeriesTitle, setNewSeriesTitle] = React.useState("");
  const [renameTitle, setRenameTitle] = React.useState(initialSeries[0]?.title || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draggedWorkId, setDraggedWorkId] = React.useState<string | null>(null);

  const selectedSeries = React.useMemo(
    () => series.find((item) => item.id === selectedSeriesId) || null,
    [series, selectedSeriesId]
  );

  React.useEffect(() => {
    setRenameTitle(selectedSeries?.title || "");
  }, [selectedSeries?.title]);

  async function refresh() {
    const res = await fetch("/api/studio/series", { cache: "no-store" });
    const data = await res.json().catch(() => ({ series: [], unassignedWorks: [] }));
    setSeries(Array.isArray(data?.series) ? data.series : []);
    setUnassignedWorks(Array.isArray(data?.unassignedWorks) ? data.unassignedWorks : []);
    setSelectedSeriesId((prev) => {
      const nextId = Array.isArray(data?.series) && data.series.some((item: SeriesLite) => item.id === prev)
        ? prev
        : data?.series?.[0]?.id || "";
      return nextId;
    });
  }

  async function mutate(run: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await run();
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function createSeries() {
    if (!newSeriesTitle.trim()) return;
    await mutate(async () => {
      await callSeriesApi({ title: newSeriesTitle.trim() }, "POST");
      setNewSeriesTitle("");
    });
  }

  async function renameSeries() {
    if (!selectedSeriesId || !renameTitle.trim()) return;
    await mutate(async () => {
      await callSeriesApi({ action: "renameSeries", seriesId: selectedSeriesId, title: renameTitle.trim() });
    });
  }

  async function addWork(workId: string) {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "addWork", seriesId: selectedSeriesId, workId });
    });
  }

  async function removeWork(workId: string) {
    await mutate(async () => {
      await callSeriesApi({ action: "removeWork", workId });
    });
  }

  async function moveWork(workId: string, direction: "up" | "down") {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "moveWork", seriesId: selectedSeriesId, workId, direction });
    });
  }

  async function reorderWorks(nextIds: string[]) {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "reorderWorks", seriesId: selectedSeriesId, orderedWorkIds: nextIds });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="text-sm font-extrabold">Series</div>
        <div className="mt-3 grid gap-2">
          <input
            value={newSeriesTitle}
            onChange={(e) => setNewSeriesTitle(e.target.value)}
            placeholder="Create a new series"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900"
          />
          <button
            type="button"
            onClick={createSeries}
            disabled={saving || !newSeriesTitle.trim()}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Create series
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {series.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
              No series yet.
            </div>
          ) : (
            series.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSeriesId(item.id)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  item.id === selectedSeriesId
                    ? "border-purple-500 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/30"
                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-950"
                }`}
              >
                <div className="truncate text-sm font-semibold">{item.title}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.works.length} works</div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-extrabold">Manage series</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Drag to reorder, or use move buttons.</div>
          </div>
          {selectedSeries ? (
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Series title"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900"
              />
              <button
                type="button"
                onClick={renameSeries}
                disabled={saving || !renameTitle.trim()}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                Rename
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {!selectedSeries ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            Select a series first.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {selectedSeries.works.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                This series does not have any work yet.
              </div>
            ) : (
              selectedSeries.works.map((work, index) => (
                <div
                  key={work.id}
                  draggable
                  onDragStart={() => setDraggedWorkId(work.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async () => {
                    if (!draggedWorkId || draggedWorkId === work.id) return;
                    const nextIds = [...selectedSeries.works.map((item) => item.id)];
                    const from = nextIds.indexOf(draggedWorkId);
                    const to = nextIds.indexOf(work.id);
                    if (from === -1 || to === -1) return;
                    const [moved] = nextIds.splice(from, 1);
                    nextIds.splice(to, 0, moved);
                    setDraggedWorkId(null);
                    await reorderWorks(nextIds);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950/30"
                >
                  <div className="w-8 shrink-0 text-center text-xs font-bold text-gray-500 dark:text-gray-400">#{work.seriesOrder || index + 1}</div>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                    {work.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{work.title}</div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{work.type} • {work.status}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => moveWork(work.id, "up")} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-gray-800">
                      Up
                    </button>
                    <button type="button" onClick={() => moveWork(work.id, "down")} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-gray-800">
                      Down
                    </button>
                    <button type="button" onClick={() => removeWork(work.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-900 dark:text-red-300">
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="text-sm font-extrabold">Unassigned works</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Add a work into the selected series.</div>
        <div className="mt-4 grid gap-3">
          {unassignedWorks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
              Every work already belongs to a series.
            </div>
          ) : (
            unassignedWorks.map((work) => (
              <div key={work.id} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950/30">
                <div className="truncate text-sm font-semibold">{work.title}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{work.type} • {work.status}</div>
                <button
                  type="button"
                  disabled={!selectedSeriesId || saving}
                  onClick={() => addWork(work.id)}
                  className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  Add to selected series
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
