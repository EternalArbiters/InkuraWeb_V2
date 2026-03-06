"use client";

export default function UploadPagesCard({
  files,
  setFiles,
  replaceExisting,
  setReplaceExisting,
  loading,
  onUpload,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
  replaceExisting: boolean;
  setReplaceExisting: (v: boolean) => void;
  loading: boolean;
  onUpload: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-2">
      <div className="font-semibold">Upload pages</div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      />

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
          disabled={loading || files.length === 0}
          className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Working..." : replaceExisting ? "Replace" : "Upload"}
        </button>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Tip: upload large chapters in batches (e.g. 10–20 pages).
      </div>
    </div>
  );
}
