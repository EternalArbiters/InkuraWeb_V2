"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  BookCopy,
  FolderPlus,
  GripVertical,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Trash2,
  Unlink2,
} from "lucide-react";

const actionLabels: Record<string, string> = {
  createSeries: "Creating series...",
  renameSeries: "Saving title...",
  reorderSeries: "Saving order...",
  attachWorks: "Adding work...",
  detachWork: "Removing work...",
  deleteSeries: "Deleting series...",
};

const successLabels: Record<string, string> = {
  createSeries: "Series created.",
  renameSeries: "Series title saved.",
  reorderSeries: "Arc order saved.",
  attachWorks: "Work added to series.",
  detachWork: "Work removed from series.",
  deleteSeries: "Series deleted.",
};

type WorkItem = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  type?: string | null;
  updatedAt?: string | null;
  seriesOrder?: number | null;
};

type SeriesItem = {
  id: string;
  title: string;
  slug: string;
  works: WorkItem[];
};

function reorderArray<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = items.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function StudioSeriesManagerClient({
  initialSeries,
  initialUngroupedWorks,
}: {
  initialSeries: SeriesItem[];
  initialUngroupedWorks: WorkItem[];
}) {
  const [series, setSeries] = React.useState<SeriesItem[]>(initialSeries);
  const [ungroupedWorks, setUngroupedWorks] = React.useState<WorkItem[]>(initialUngroupedWorks);
  const [draftTitles, setDraftTitles] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(initialSeries.map((item) => [item.id, item.title])),
  );
  const [targetSeriesByWork, setTargetSeriesByWork] = React.useState<Record<string, string>>({});
  const [newSeriesTitle, setNewSeriesTitle] = React.useState("");
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [dragState, setDragState] = React.useState<{ seriesId: string; workId: string } | null>(null);

  const syncPayload = React.useCallback((payload: { series: SeriesItem[]; ungroupedWorks: WorkItem[] }) => {
    setSeries(payload.series || []);
    setUngroupedWorks(payload.ungroupedWorks || []);
    setDraftTitles(Object.fromEntries((payload.series || []).map((item) => [item.id, item.title])));
    setTargetSeriesByWork((prev) => {
      const next: Record<string, string> = {};
      for (const work of payload.ungroupedWorks || []) {
        if (prev[work.id]) next[work.id] = prev[work.id];
      }
      return next;
    });
  }, []);

  const runAction = React.useCallback(
    async (body: Record<string, unknown>) => {
      const action = String(body.action || "");
      setError(null);
      setStatusMessage(null);
      setPendingAction(action);
      try {
        const res = await fetch("/api/studio/series", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          throw new Error(data?.error || "Request failed");
        }
        syncPayload(data);
        setStatusMessage(successLabels[action] || "Saved");
        return data;
      } catch (err: any) {
        setError(err?.message || "Request failed");
        throw err;
      } finally {
        setPendingAction(null);
      }
    },
    [syncPayload],
  );

  const moveWork = React.useCallback(
    async (seriesId: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || toIndex < 0) return;
      const currentSeries = series.find((item) => item.id === seriesId);
      if (!currentSeries) return;
      if (toIndex >= currentSeries.works.length) return;

      const previousSeries = series;
      const reorderedWorks = reorderArray(currentSeries.works, fromIndex, toIndex).map((work, index) => ({
        ...work,
        seriesOrder: index + 1,
      }));

      const optimisticSeries = series.map((item) =>
        item.id === seriesId
          ? {
              ...item,
              works: reorderedWorks,
            }
          : item,
      );
      setSeries(optimisticSeries);

      try {
        await runAction({
          action: "reorderSeries",
          seriesId,
          workIds: reorderedWorks.map((work) => work.id),
        });
      } catch {
        setSeries(previousSeries);
      }
    },
    [runAction, series],
  );

  const createSeries = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newSeriesTitle.trim();
    if (!title) {
      setError("Series title is required");
      return;
    }
    try {
      await runAction({ action: "createSeries", title });
      setNewSeriesTitle("");
    } catch {}
  };

  const renameSeries = async (seriesId: string) => {
    try {
      await runAction({ action: "renameSeries", seriesId, title: draftTitles[seriesId] || "" });
    } catch {}
  };

  const detachWork = async (seriesId: string, workId: string) => {
    try {
      await runAction({ action: "detachWork", seriesId, workId });
    } catch {}
  };

  const deleteSeries = async (seriesId: string) => {
    const ok = confirm("Delete this series? Works will stay in your studio as ungrouped titles.");
    if (!ok) return;
    try {
      await runAction({ action: "deleteSeries", seriesId });
    } catch {}
  };

  const attachWork = async (workId: string) => {
    const seriesId = targetSeriesByWork[workId];
    if (!seriesId) {
      setError("Pick a target series first");
      return;
    }
    try {
      await runAction({ action: "attachWorks", seriesId, workIds: [workId] });
    } catch {}
  };

  const isBusy = (action: string) => pendingAction === action;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 dark:border-gray-800 dark:text-gray-300">
              <FolderPlus className="h-3.5 w-3.5" />
              Studio series
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight md:text-2xl">Create a series hub</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Use one page to name the series, order every arc, and keep titles grouped without editing each work one by one.
            </p>
          </div>

          <form onSubmit={createSeries} className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
            <input
              value={newSeriesTitle}
              onChange={(e) => setNewSeriesTitle(e.target.value)}
              placeholder="Example: Honkai Impact 3rd"
              className="h-11 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-purple-500 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={!!pendingAction}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBusy("createSeries") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create series
            </button>
          </form>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
      </section>

      {series.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            <BookCopy className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold">No series yet</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Create your first series above, then add works from the library section below.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {series.map((seriesItem) => (
            <section
              key={seriesItem.id}
              className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50 md:p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Series title</div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={draftTitles[seriesItem.id] || ""}
                      onChange={(e) =>
                        setDraftTitles((prev) => ({
                          ...prev,
                          [seriesItem.id]: e.target.value,
                        }))
                      }
                      className="h-11 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none ring-0 focus:border-purple-500 dark:border-gray-800 dark:bg-gray-950"
                    />
                    <button
                      type="button"
                      onClick={() => void renameSeries(seriesItem.id)}
                      disabled={!!pendingAction}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:hover:bg-gray-950"
                    >
                      {isBusy("renameSeries") ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                      Save title
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSeries(seriesItem.id)}
                      disabled={!!pendingAction}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40"
                    >
                      {isBusy("deleteSeries") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete series
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-950/60">
                  <div className="font-semibold">{seriesItem.works.length} work{seriesItem.works.length === 1 ? "" : "s"}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Drag to reorder or use the arrow buttons.</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {seriesItem.works.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    No works in this series yet. Add one from the library below.
                  </div>
                ) : (
                  seriesItem.works.map((work, index) => {
                    const canMoveUp = index > 0;
                    const canMoveDown = index < seriesItem.works.length - 1;
                    const updatedLabel = formatDate(work.updatedAt);
                    return (
                      <article
                        key={work.id}
                        draggable
                        onDragStart={() => setDragState({ seriesId: seriesItem.id, workId: work.id })}
                        onDragEnd={() => setDragState(null)}
                        onDragOver={(e) => {
                          if (dragState?.seriesId === seriesItem.id) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragState || dragState.seriesId !== seriesItem.id || dragState.workId === work.id) return;
                          const fromIndex = seriesItem.works.findIndex((item) => item.id === dragState.workId);
                          const toIndex = seriesItem.works.findIndex((item) => item.id === work.id);
                          setDragState(null);
                          void moveWork(seriesItem.id, fromIndex, toIndex);
                        }}
                        className={[
                          "flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/90 p-3 transition dark:border-gray-800 dark:bg-gray-950/70 md:flex-row md:items-center",
                          dragState?.workId === work.id ? "opacity-60 ring-1 ring-purple-500/50" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                            {work.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                              Arc {index + 1}
                            </div>
                            <div className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600 dark:border-gray-800 dark:text-gray-300">
                              {work.status}
                            </div>
                            {work.type ? (
                              <div className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600 dark:border-gray-800 dark:text-gray-300">
                                {work.type}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-2 truncate text-base font-bold md:text-lg">{work.title}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {updatedLabel ? `Updated ${updatedLabel}` : "No update date yet"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <Link
                            href={`/w/${work.slug}`}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-gray-200 px-3 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => void moveWork(seriesItem.id, index, index - 1)}
                            disabled={!canMoveUp || !!pendingAction}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-900"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void moveWork(seriesItem.id, index, index + 1)}
                            disabled={!canMoveDown || !!pendingAction}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-900"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void detachWork(seriesItem.id, work.id)}
                            disabled={!!pendingAction}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-amber-200 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950/40"
                          >
                            {isBusy("detachWork") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink2 className="h-4 w-4" />}
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xl font-extrabold tracking-tight">Work library</div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Works outside a series stay here until you attach them to a series.
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{ungroupedWorks.length} ungrouped work{ungroupedWorks.length === 1 ? "" : "s"}</div>
        </div>

        {ungroupedWorks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            Every work is already attached to a series.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ungroupedWorks.map((work) => (
              <article
                key={work.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/90 p-3 dark:border-gray-800 dark:bg-gray-950/70 md:flex-row md:items-center"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                  {work.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold">{work.title}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {work.type ? `${work.type} • ` : ""}
                    {work.status}
                    {work.updatedAt ? ` • Updated ${formatDate(work.updatedAt)}` : ""}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={targetSeriesByWork[work.id] || ""}
                    onChange={(e) =>
                      setTargetSeriesByWork((prev) => ({
                        ...prev,
                        [work.id]: e.target.value,
                      }))
                    }
                    className="h-11 min-w-[180px] rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none ring-0 focus:border-purple-500 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="">Choose a series</option>
                    {series.map((seriesItem) => (
                      <option key={seriesItem.id} value={seriesItem.id}>
                        {seriesItem.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void attachWork(work.id)}
                    disabled={!!pendingAction || !targetSeriesByWork[work.id]}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    {isBusy("attachWorks") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Add to series
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
