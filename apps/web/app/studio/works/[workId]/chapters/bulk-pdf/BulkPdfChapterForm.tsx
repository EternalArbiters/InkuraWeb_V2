"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFiles } from "@/lib/uploadOptimization";
import { importComicPagesFromPdf, sortComicPageFiles } from "@/lib/comicPageImports";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

type Props = {
  workId: string;
  nextNumber: number;
  warningTags: PickerItem[];
};

type ItemStatus = "idle" | "extracting" | "uploading" | "creating" | "done" | "error";

type PendingChapterItem = {
  localId: string;
  file: File;
  title: string;
  status: ItemStatus;
  progress?: string;
  errorMessage?: string;
  createdChapterId?: string;
};

type PageCommit = { url: string; key?: string | null; order?: number };

// v30: derives a human-readable default chapter title from a PDF filename — distinct
// from lib/comicPageImports.ts's sanitizeBaseName, which lowercases/strips punctuation
// for storage-safe filenames, not a display title.
function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "Untitled";
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

function statusBadge(status: ItemStatus): { label: string; cls: string } {
  switch (status) {
    case "idle":
      return { label: "Pending", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
    case "extracting":
      return { label: "Reading PDF...", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200" };
    case "uploading":
      return { label: "Uploading...", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200" };
    case "creating":
      return { label: "Creating chapter...", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200" };
    case "done":
      return { label: "Done", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" };
    case "error":
      return { label: "Failed", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200" };
  }
}

export default function BulkPdfChapterForm({ workId, nextNumber, warningTags }: Props) {
  const [items, setItems] = React.useState<PendingChapterItem[]>([]);
  const [batchStatus, setBatchStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [batchIsMature, setBatchIsMature] = React.useState(false);
  const [batchWarningIds, setBatchWarningIds] = React.useState<string[]>([]);
  const [running, setRunning] = React.useState(false);

  const locked = running;

  function handleFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.currentTarget.value = "";
    if (!picked.length) return;

    const sorted = sortComicPageFiles(picked);
    setItems((prev) => [
      ...prev,
      ...sorted.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        title: titleFromFilename(file.name),
        status: "idle" as ItemStatus,
      })),
    ]);
  }

  function updateItemState(localId: string, patch: Partial<PendingChapterItem>) {
    setItems((prev) => prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  async function processOne(index: number) {
    const item = items[index];
    if (!item) return;
    const number = nextNumber + index;

    updateItemState(item.localId, { status: "extracting", progress: "Reading PDF...", errorMessage: undefined });
    try {
      const pages = await importComicPagesFromPdf(item.file);
      updateItemState(item.localId, { status: "uploading", progress: `Preparing ${pages.length} pages...` });

      const prepared = await prepareUploadFiles({ scope: "pages", files: pages });

      const uploads: PageCommit[] = [];
      for (let p = 0; p < prepared.length; p += 1) {
        updateItemState(item.localId, { progress: `Uploading page ${p + 1}/${prepared.length}...` });
        // eslint-disable-next-line no-await-in-loop
        const up = await presignAndUpload({
          scope: "pages",
          file: prepared[p].originalFile,
          preparedFile: prepared[p],
          workId,
          optimizationVersion: "pr6-comic-page-opt-v2",
        });
        uploads.push({ url: up.url, key: up.key, order: p + 1 });
      }

      updateItemState(item.localId, { status: "creating", progress: "Creating chapter..." });
      const res = await fetch("/api/studio/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          number,
          label: null,
          title: item.title.trim() || `Chapter ${number}`,
          status: batchStatus,
          isMature: batchIsMature,
          warningTagIds: batchWarningIds,
          pages: uploads,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to create chapter");

      updateItemState(item.localId, {
        status: "done",
        progress: undefined,
        createdChapterId: json?.chapter?.id || json?.chapterId || json?.id,
      });
    } catch (err: any) {
      updateItemState(item.localId, {
        status: "error",
        progress: undefined,
        errorMessage: err?.message || "Failed to process this PDF.",
      });
    }
  }

  async function runImport() {
    setRunning(true);
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].status === "done") continue;
      // eslint-disable-next-line no-await-in-loop
      await processOne(i);
    }
    setRunning(false);
  }

  async function retryOne(index: number) {
    setRunning(true);
    await processOne(index);
    setRunning(false);
  }

  const allDone = items.length > 0 && items.every((item) => item.status === "done");

  return (
    <div className="mt-6 grid gap-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Select PDF files</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={locked}
            onChange={handleFilesPicked}
            className="text-sm disabled:opacity-60"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Files are auto-sorted by filename (natural order) — you can reorder the list below before starting.
          </span>
        </label>
      </div>

      {items.length > 20 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          You picked {items.length} PDFs, but chapter creation is capped at 20 per hour — some may fail partway
          through. Failed items can be retried individually once the limit resets.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Status (applies to all chapters)</span>
          <select
            value={batchStatus}
            onChange={(e) => setBatchStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            disabled={locked}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-60"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <input
            type="checkbox"
            checked={batchIsMature}
            disabled={locked}
            onChange={(e) => setBatchIsMature(e.target.checked)}
          />
          <div>
            <div className="text-sm font-semibold">18+ / Mature (applies to all chapters)</div>
          </div>
        </label>
      </div>

      <MultiSelectPicker
        title="NSFW (applies to all remaining chapters)"
        items={warningTags}
        selectedIds={batchWarningIds}
        onChange={setBatchWarningIds}
      />

      {items.length ? (
        <div className="grid gap-2">
          {items.map((item, index) => {
            const number = nextNumber + index;
            const badge = statusBadge(item.status);
            const isBusy = item.status === "extracting" || item.status === "uploading" || item.status === "creating";

            return (
              <div
                key={item.localId}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                    #{number}
                  </span>
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setItems((prev) =>
                        prev.map((entry, i) => (i === index ? { ...entry, title: nextTitle } : entry))
                      );
                    }}
                    disabled={locked}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-60"
                  />
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => setItems((prev) => moveItem(prev, index, index - 1))}
                    disabled={locked || index === 0}
                    aria-label="Move up"
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-1.5 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => moveItem(prev, index, index + 1))}
                    disabled={locked || index === items.length - 1}
                    aria-label="Move down"
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-1.5 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={locked}
                    aria-label="Remove"
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-1.5 disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">{item.file.name}</div>

                {isBusy && item.progress ? (
                  <div className="text-xs text-blue-700 dark:text-blue-300">{item.progress}</div>
                ) : null}

                {item.status === "error" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400">{item.errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => retryOne(index)}
                      disabled={locked}
                      className="rounded-lg border border-red-200 dark:border-red-900/60 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300 disabled:opacity-40"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}

                {item.status === "done" && item.createdChapterId ? (
                  <Link
                    href={`/studio/works/${workId}/chapters/${item.createdChapterId}/edit`}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Open chapter →
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runImport}
          disabled={locked || items.length === 0 || allDone}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {locked ? "Processing..." : allDone ? "All done" : `Start Import (${items.length})`}
        </button>

        {allDone ? (
          <Link
            href={`/studio/works/${workId}`}
            className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Back to work
          </Link>
        ) : null}
      </div>
    </div>
  );
}
