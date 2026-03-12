"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFiles, summarizePreparedUploadFiles, type PreparedUploadFile } from "@/lib/uploadOptimization";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import ComicPageFilesPicker from "@/components/ComicPageFilesPicker";
import NovelRichTextEditor from "@/components/NovelRichTextEditor";
import { novelContentHasMeaningfulContent } from "@/lib/novelContent";
import FloatingNotice from "@/app/components/ui/FloatingNotice";

type Props = {
  workId: string;
  workTitle: string;
  workType: "NOVEL" | "COMIC";
  nextNumber: number;
  warningTags: PickerItem[];
};

type CreatedChapter = { id: string };

type PageCommit = { url: string; key?: string | null; order?: number };

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

export default function ChapterCreateForm({ workId, workTitle, workType, nextNumber, warningTags }: Props) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [autoLabel, setAutoLabel] = React.useState(true);
  const [number, setNumber] = React.useState(nextNumber);
  const [displayLabel, setDisplayLabel] = React.useState("");
  const [status, setStatus] = React.useState("DRAFT");
  const [isMature, setIsMature] = React.useState(false);
  const [warningIds, setWarningIds] = React.useState<string[]>([]);

  const [content, setContent] = React.useState("");
  const [pages, setPages] = React.useState<File[]>([]);
  const [preparedPages, setPreparedPages] = React.useState<PreparedUploadFile[]>([]);
  const [preparingPages, setPreparingPages] = React.useState(false);
  const [importingPages, setImportingPages] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [createdChapterId, setCreatedChapterId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (autoLabel) setNumber(nextNumber);
  }, [autoLabel, nextNumber]);

  React.useEffect(() => {
    if (workType !== "COMIC" || pages.length === 0) {
      setPreparedPages([]);
      setPreparingPages(false);
      return;
    }

    let cancelled = false;
    setPreparingPages(true);

    void prepareUploadFiles({ scope: "pages", files: pages }).then((prepared) => {
      if (cancelled) return;
      setPreparedPages(prepared);
      setPreparingPages(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pages, workType]);

  const pageSummary = React.useMemo(() => {
    if (workType !== "COMIC" || pages.length === 0) return null;
    const originalBytes = pages.reduce((total, file) => total + file.size, 0);
    if (preparedPages.length !== pages.length) {
      return {
        count: pages.length,
        originalBytes,
        optimizedBytes: originalBytes,
        bytesSaved: 0,
        compressedCount: 0,
        ready: false,
      };
    }
    return {
      ...summarizePreparedUploadFiles(preparedPages),
      ready: true,
    };
  }, [pages, preparedPages, workType]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setCreatedChapterId(null);

    if (workType === "NOVEL" && !novelContentHasMeaningfulContent(content)) {
      setError("Content is required for NOVEL");
      return;
    }

    setLoading(true);
    try {
      // Step 1: create chapter (metadata + novel content only)
      setNote("Creating chapter...");

      const payload: any = {
        workId,
        number,
        displayLabel: autoLabel ? null : displayLabel.trim() || null,
        title: (title || (!autoLabel && displayLabel.trim() ? displayLabel.trim() : `Chapter ${number}`)).trim(),
        status,
        isMature,
        warningTagIds: warningIds,
      };
      if (workType === "NOVEL") payload.content = content;

      const res = await fetch("/api/studio/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      const chapter: CreatedChapter | undefined = json?.chapter;
      const chapterId = chapter?.id || json?.chapterId || json?.id;
      if (!chapterId) throw new Error("Chapter created but id is missing");
      setCreatedChapterId(chapterId);

      // Step 2: if comic + pages selected, optimize in browser, upload to R2 (presigned), then commit.
      if (workType === "COMIC" && pages.length) {
        setNote(`Preparing optimization for ${pages.length} pages...`);
        const preparedUploads =
          preparedPages.length === pages.length ? preparedPages : await prepareUploadFiles({ scope: "pages", files: pages });

        const uploads: PageCommit[] = [];
        for (let i = 0; i < preparedUploads.length; i += 1) {
          const prepared = preparedUploads[i];
          const savedBytes = Math.max(0, prepared.originalBytes - prepared.optimizedBytes);
          const noteSuffix = savedBytes > 0 ? ` (save ${formatBytes(savedBytes)})` : "";
          setNote(`Uploading page ${i + 1}/${preparedUploads.length}${noteSuffix}...`);
          const up = await presignAndUpload({
            scope: "pages",
            file: prepared.originalFile,
            preparedFile: prepared,
            workId,
            chapterId,
            optimizationVersion: "pr3-comic-page-opt-v1",
          });
          uploads.push({ url: up.url, key: up.key, order: i + 1 });
        }

        setNote("Saving page list...");
        const commitRes = await fetch(`/api/studio/chapters/${chapterId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pages: uploads }),
        });
        const commitJson = await commitRes.json();
        if (!commitRes.ok) {
          throw new Error(commitJson?.error || "Failed to save the pages. The chapter was created; please re-upload them in Manage Pages.");
        }
      }

      setNote(null);
      router.push(`/studio/works/${workId}`);
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <FloatingNotice
        open={!!error}
        title="Upload error"
        message={error || ""}
        onClose={() => setError(null)}
        actionHref={createdChapterId ? `/studio/works/${workId}/chapters/${createdChapterId}/pages` : undefined}
        actionLabel={createdChapterId ? "Open Manage Pages" : undefined}
      />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <div className="font-semibold">{workTitle}</div>
          <div className="text-xs">Type: {workType}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4 md:col-span-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={autoLabel} onChange={(e) => setAutoLabel(e.target.checked)} />
            <div>
              <div className="text-sm font-semibold">Auto chapter label</div>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Sort Number</span>
              <input
                type="number"
                min={0}
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 0)}
                disabled={autoLabel}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Display Label</span>
              <input
                value={autoLabel ? `Chapter ${number}` : displayLabel}
                onChange={(e) => setDisplayLabel(e.target.value)}
                disabled={autoLabel}
                placeholder="Prolog / Bonus / Chapter 0"
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
              />
            </label>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={!autoLabel && displayLabel.trim() ? displayLabel.trim() : `Chapter ${number}`}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">18+ / Mature (Chapter)</div>
          </div>
        </label>
      </div>

      <MultiSelectPicker
        title="NSFW (Chapter)"
        items={warningTags}
        selectedIds={warningIds}
        onChange={setWarningIds}
      />

      {workType === "NOVEL" ? (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Content</span>
          <NovelRichTextEditor value={content} onChange={setContent} workId={workId} />
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <span className="text-sm font-semibold">Comic Pages</span>
          </div>

          <ComicPageFilesPicker files={pages} setFiles={setPages} onBusyChange={setImportingPages} />

          {pageSummary ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
              <div>
                {pageSummary.count} files · before {formatBytes(pageSummary.originalBytes)}
                {pageSummary.ready ? ` · sesudah ${formatBytes(pageSummary.optimizedBytes)}` : " · menyiapkan optimasi..."}
              </div>
              {pageSummary.ready ? (
                <div>
                  Saved {formatBytes(pageSummary.bytesSaved)} · {pageSummary.compressedCount}/{pageSummary.count} pages adjusted automatically.
                </div>
              ) : null}
            </div>
          ) : null}

          {note ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
              {note}
            </div>
          ) : null}
        </div>
      )}

      {workType !== "COMIC" && note ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
          {note}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading || preparingPages || importingPages}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : importingPages ? "Processing import..." : preparingPages ? "Preparing pages..." : "Create Chapter"}
        </button>
      </div>
    </form>
  );
}
