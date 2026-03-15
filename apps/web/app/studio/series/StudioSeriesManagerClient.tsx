"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { seedClientResource } from "@/lib/clientResourceCache";

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

type StudioSeriesPayload = {
  series: SeriesLite[];
  unassignedWorks: WorkLite[];
};

const STUDIO_SERIES_CACHE_KEY = "studio:series-manager";

async function callSeriesApi(body: Record<string, unknown>, method: "PATCH" | "POST" = "PATCH") {
  const res = await fetch("/api/studio/series", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error || "Request failed");
  return json as any;
}

function sortSeries(series: SeriesLite[]) {
  return [...series].sort((a, b) => a.title.localeCompare(b.title));
}

function sortWorksByUpdatedAt(works: WorkLite[]) {
  return [...works].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function normalizeSeriesWorks(works: WorkLite[]) {
  return works.map((work, index) => ({ ...work, seriesOrder: index + 1 }));
}

export default function StudioSeriesManagerClient({
  initialSeries,
  initialUnassignedWorks,
}: {
  initialSeries: SeriesLite[];
  initialUnassignedWorks: WorkLite[];
}) {
  const t = useUILanguageText();
  const [series, setSeries] = React.useState<SeriesLite[]>(initialSeries);
  const [unassignedWorks, setUnassignedWorks] = React.useState<WorkLite[]>(initialUnassignedWorks);
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<string>(initialSeries[0]?.id || "");
  const [newSeriesTitle, setNewSeriesTitle] = React.useState("");
  const [renameTitle, setRenameTitle] = React.useState(initialSeries[0]?.title || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draggedWorkId, setDraggedWorkId] = React.useState<string | null>(null);

  React.useEffect(() => {
    seedClientResource<StudioSeriesPayload>(
      STUDIO_SERIES_CACHE_KEY,
      {
        series: initialSeries,
        unassignedWorks: initialUnassignedWorks,
      },
      30_000
    );
  }, [initialSeries, initialUnassignedWorks]);

  const selectedSeries = React.useMemo(
    () => series.find((item) => item.id === selectedSeriesId) || null,
    [series, selectedSeriesId]
  );

  React.useEffect(() => {
    setRenameTitle(selectedSeries?.title || "");
  }, [selectedSeries?.title]);

  function commitSnapshot(next: StudioSeriesPayload, nextSelectedSeriesId?: string) {
    setSeries(next.series);
    setUnassignedWorks(next.unassignedWorks);
    setSelectedSeriesId((prev) => {
      if (nextSelectedSeriesId !== undefined) return nextSelectedSeriesId;
      if (next.series.some((item) => item.id === prev)) return prev;
      return next.series[0]?.id || "";
    });
    seedClientResource<StudioSeriesPayload>(STUDIO_SERIES_CACHE_KEY, next, 30_000);
  }

  async function mutate(run: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await run();
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function createSeries() {
    if (!newSeriesTitle.trim()) return;
    await mutate(async () => {
      const data = await callSeriesApi({ title: newSeriesTitle.trim() }, "POST");
      const created = data?.series as { id?: string; title?: string } | undefined;
      if (!created?.id || !created?.title) return;
      const nextSeries = sortSeries([...series, { id: created.id, title: created.title, works: [] }]);
      commitSnapshot({ series: nextSeries, unassignedWorks }, created.id);
      setNewSeriesTitle("");
    });
  }

  async function renameSeries() {
    if (!selectedSeriesId || !renameTitle.trim()) return;
    await mutate(async () => {
      await callSeriesApi({ action: "renameSeries", seriesId: selectedSeriesId, title: renameTitle.trim() });
      const nextSeries = sortSeries(
        series.map((item) => (item.id === selectedSeriesId ? { ...item, title: renameTitle.trim() } : item))
      );
      commitSnapshot({ series: nextSeries, unassignedWorks });
    });
  }

  async function addWork(workId: string) {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "addWork", seriesId: selectedSeriesId, workId });
      const work = unassignedWorks.find((item) => item.id === workId);
      if (!work) return;
      const nextSeries = series.map((item) =>
        item.id === selectedSeriesId
          ? { ...item, works: normalizeSeriesWorks([...item.works, { ...work, seriesOrder: item.works.length + 1 }]) }
          : item
      );
      const nextUnassigned = unassignedWorks.filter((item) => item.id !== workId);
      commitSnapshot({ series: nextSeries, unassignedWorks: nextUnassigned });
    });
  }

  async function removeWork(workId: string) {
    await mutate(async () => {
      await callSeriesApi({ action: "removeWork", workId });
      let movedWork: WorkLite | null = null;
      const nextSeries = series.map((item) => {
        const match = item.works.find((work) => work.id === workId) || null;
        if (match) movedWork = { ...match, seriesOrder: null };
        return {
          ...item,
          works: normalizeSeriesWorks(item.works.filter((work) => work.id !== workId)),
        };
      });
      const nextUnassigned = movedWork ? sortWorksByUpdatedAt([...unassignedWorks, movedWork]) : unassignedWorks;
      commitSnapshot({ series: nextSeries, unassignedWorks: nextUnassigned });
    });
  }

  async function moveWork(workId: string, direction: "up" | "down") {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "moveWork", seriesId: selectedSeriesId, workId, direction });
      const nextSeries = series.map((item) => {
        if (item.id !== selectedSeriesId) return item;
        const works = [...item.works];
        const index = works.findIndex((work) => work.id === workId);
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index === -1 || targetIndex < 0 || targetIndex >= works.length) return item;
        const [moved] = works.splice(index, 1);
        works.splice(targetIndex, 0, moved);
        return { ...item, works: normalizeSeriesWorks(works) };
      });
      commitSnapshot({ series: nextSeries, unassignedWorks });
    });
  }

  async function reorderWorks(nextIds: string[]) {
    if (!selectedSeriesId) return;
    await mutate(async () => {
      await callSeriesApi({ action: "reorderWorks", seriesId: selectedSeriesId, orderedWorkIds: nextIds });
      const nextSeries = series.map((item) => {
        if (item.id !== selectedSeriesId) return item;
        const byId = new Map(item.works.map((work) => [work.id, work]));
        return {
          ...item,
          works: normalizeSeriesWorks(nextIds.map((id) => byId.get(id)).filter(Boolean) as WorkLite[]),
        };
      });
      commitSnapshot({ series: nextSeries, unassignedWorks });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="text-sm font-extrabold">{t("Kelompok Karya") || "Kelompok Karya"}</div>
        <div className="mt-3 grid gap-2">
          <input
            value={newSeriesTitle}
            onChange={(e) => setNewSeriesTitle(e.target.value)}
            placeholder={t("Create a new series")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900"
          />
          <button
            type="button"
            onClick={createSeries}
            disabled={saving || !newSeriesTitle.trim()}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("Create series")}
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {series.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
              {t("No series yet.") || "Belum ada kelompok karya."}
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
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.works.length} karya</div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-extrabold">{t("Manage series")}</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{t("Drag to reorder, or use move buttons.")}</div>
          </div>
          {selectedSeries ? (
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder={t("Series title")}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900"
              />
              <button
                type="button"
                onClick={renameSeries}
                disabled={saving || !renameTitle.trim()}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                {t("Rename")}
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
            {t("Select a series first.") || "Pilih kelompok karya terlebih dahulu."}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {selectedSeries.works.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                {t("This series does not have any work yet.") || "Kelompok karya ini belum punya karya."}
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
                    <button
                      type="button"
                      onClick={() => moveWork(work.id, "up")}
                      aria-label="Move up"
                      title="Move up"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWork(work.id, "down")}
                      aria-label="Move down"
                      title="Move down"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800"
                    >
                      <ArrowDown className="h-4 w-4" />
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
        <div className="text-sm font-extrabold">{t("Unassigned works")}</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{t("Add a work into the selected series.")}</div>
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
                  {t("Add to selected series")}
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
