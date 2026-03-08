"use client";

import * as React from "react";
import ComicPageFilesPicker from "@/components/ComicPageFilesPicker";

type UploadSummary = {
  count: number;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  compressedCount: number;
  ready: boolean;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export default function UploadPagesCard({
  files,
  setFiles,
  replaceExisting,
  setReplaceExisting,
  loading,
  preparing,
  summary,
  onUpload,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  replaceExisting: boolean;
  setReplaceExisting: (v: boolean) => void;
  loading: boolean;
  preparing: boolean;
  summary: UploadSummary | null;
  onUpload: () => void;
}) {
  const [importing, setImporting] = React.useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-4">
      <div>
        <div className="font-semibold">Upload pages</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Kamu bisa upload manual satu-satu, upload semua image, import ZIP chapter, atau import PDF chapter.
        </div>
      </div>

      <ComicPageFilesPicker files={files} setFiles={setFiles} onBusyChange={setImporting} />

      {summary ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
          <div>
            {summary.count} file · sebelum {formatBytes(summary.originalBytes)}
            {summary.ready ? ` · sesudah ${formatBytes(summary.optimizedBytes)}` : " · menyiapkan optimasi..."}
          </div>
          {summary.ready ? (
            <div>
              Hemat {formatBytes(summary.bytesSaved)} · {summary.compressedCount}/{summary.count} halaman disesuaikan otomatis.
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 select-none">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
          className="h-4 w-4"
        />
        Replace existing pages (recommended)
      </label>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onUpload}
          disabled={loading || preparing || importing || files.length === 0}
          className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Working..." : importing ? "Processing import..." : preparing ? "Preparing..." : replaceExisting ? "Replace" : "Upload"}
        </button>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Tip: upload large chapters in batches (e.g. 10–20 pages). Comic pages are optimized in the browser before upload.
      </div>
    </div>
  );
}
