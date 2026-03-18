"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import ThumbCropper from "@/app/components/ThumbCropper";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFile, type PreparedUploadFile } from "@/lib/uploadOptimization";
import NovelRichTextEditor from "@/components/NovelRichTextEditor";
import { novelContentHasMeaningfulContent } from "@/lib/novelContent";
import FloatingNotice from "@/app/components/ui/FloatingNotice";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Chapter = {
  id: string;
  title: string;
  number: number;
  label?: string | null;
  status: string;
  isMature?: boolean | null;
  authorNote?: string | null;
  thumbnailImage?: string | null;
  thumbnailKey?: string | null;
  thumbnailFocusX?: number | null;
  thumbnailFocusY?: number | null;
  thumbnailZoom?: number | null;
  text?: { content: string } | null;
  warningTags?: Array<{ id: string }>;
};

type Props = {
  workId: string;
  workTitle: string;
  workType: "NOVEL" | "COMIC";
  chapter: Chapter;
  warningTags: PickerItem[];
};

function clamp(n: unknown, def: number, min: number, max: number) {
  const value = Number(n);
  if (!Number.isFinite(value)) return def;
  return Math.max(min, Math.min(max, value));
}

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

export default function ChapterEditForm({ workId, workTitle, workType, chapter, warningTags }: Props) {
  const router = useRouter();
  const t = useUILanguageText();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [autoNumber, setAutoNumber] = React.useState(!chapter.label);
  const [manualLabel, setManualLabel] = React.useState(chapter.label || "");
  const [title, setTitle] = React.useState(chapter.title || "");
  const [number, setNumber] = React.useState(chapter.number || 0);
  const [status, setStatus] = React.useState(chapter.status || "DRAFT");
  const [isMature, setIsMature] = React.useState(!!chapter.isMature);
  const [warningIds, setWarningIds] = React.useState<string[]>(() =>
    Array.isArray(chapter.warningTags) ? chapter.warningTags.map((tag) => String(tag.id)) : []
  );
  const [content, setContent] = React.useState(chapter.text?.content || "");
  const [authorNote, setAuthorNote] = React.useState(chapter.authorNote || "");

  const [thumbUrl, setThumbUrl] = React.useState<string | null>(chapter.thumbnailImage || null);
  const [thumbKey, setThumbKey] = React.useState<string | null>(chapter.thumbnailKey || null);
  const [thumbUploading, setThumbUploading] = React.useState(false);
  const [thumbPrepared, setThumbPrepared] = React.useState<PreparedUploadFile | null>(null);
  const [thumbOptimizationSummary, setThumbOptimizationSummary] = React.useState<string | null>(null);

  const [thumbFocusX, setThumbFocusX] = React.useState<number>(clamp(chapter.thumbnailFocusX, 50, 0, 100));
  const [thumbFocusY, setThumbFocusY] = React.useState<number>(clamp(chapter.thumbnailFocusY, 50, 0, 100));
  const [thumbZoom, setThumbZoom] = React.useState<number>(clamp(chapter.thumbnailZoom, 1, 1, 2.5));

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (thumbPrepared?.previewUrl) URL.revokeObjectURL(thumbPrepared.previewUrl);
    };
  }, [thumbPrepared?.previewUrl]);

  async function uploadThumb(file: File | null) {
    if (!file) return;
    setError(null);
    setThumbUploading(true);
    try {
      const prepared = await prepareUploadFile({ scope: "pages", file, makePreviewUrl: true });
      const up = await presignAndUpload({
        scope: "pages",
        file,
        preparedFile: prepared,
        workId,
        chapterId: chapter.id,
        optimizationVersion: "pr6-comic-page-opt-v2",
      });
      setThumbPrepared((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return prepared;
      });
      setThumbUrl(up.url);
      setThumbKey(up.key);
      const bytesSaved = Math.max(0, prepared.originalBytes - prepared.optimizedBytes);
      setThumbOptimizationSummary(
        prepared.compressionApplied || bytesSaved > 0
          ? `${formatBytes(prepared.originalBytes)} -> ${formatBytes(prepared.optimizedBytes)}`
          : `No optimization needed (${formatBytes(prepared.optimizedBytes)})`
      );
      setThumbFocusX(50);
      setThumbFocusY(50);
      setThumbZoom(1);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setThumbUploading(false);
    }
  }

  function clearThumb() {
    if (thumbPrepared?.previewUrl) URL.revokeObjectURL(thumbPrepared.previewUrl);
    setThumbPrepared(null);
    setThumbOptimizationSummary(null);
    setThumbUrl(null);
    setThumbKey(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedManualLabel = manualLabel.trim();
    const trimmedTitle = title.trim();

    if (!autoNumber && !trimmedManualLabel) {
      setError("Fill in the Chapter Label if auto mode is turned off.");
      return;
    }

    if (workType === "NOVEL" && !novelContentHasMeaningfulContent(content)) {
      setError("Content is required for NOVEL");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: (trimmedTitle || trimmedManualLabel || `Chapter ${number}`).trim(),
        number,
        label: autoNumber ? null : trimmedManualLabel,
        status,
        isMature,
        warningTagIds: warningIds,
      };
      if (workType === "NOVEL") payload.content = content;
      payload.authorNote = authorNote.trim() ? authorNote : null;

      payload.thumbnailImage = thumbUrl;
      payload.thumbnailKey = thumbKey;
      payload.thumbnailFocusX = Math.round(clamp(thumbFocusX, 50, 0, 100));
      payload.thumbnailFocusY = Math.round(clamp(thumbFocusY, 50, 0, 100));
      payload.thumbnailZoom = clamp(thumbZoom, 1, 1, 2.5);

      const res = await fetch(`/api/studio/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      router.push(`/studio/works/${workId}`);
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <FloatingNotice open={!!error} title="Upload error" message={error || ""} onClose={() => setError(null)} />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <div className="font-semibold">{workTitle}</div>
          <div className="text-xs">Type: {workType}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{t(t("Chapter cover"))}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
          <ThumbCropper
            src={thumbUrl}
            value={{ focusX: thumbFocusX, focusY: thumbFocusY, zoom: thumbZoom }}
            onChange={(v) => {
              setThumbFocusX(v.focusX);
              setThumbFocusY(v.focusY);
              setThumbZoom(v.zoom);
            }}
            disabled={thumbUploading || !thumbUrl}
            onPickImage={() => fileInputRef.current?.click()}
            onRemoveImage={thumbUrl ? clearThumb : undefined}
          />

          <div className="grid gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => uploadThumb(e.target.files?.[0] || null)}
              disabled={thumbUploading}
              className="hidden"
            />
            {thumbOptimizationSummary ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">Optimized thumbnail: {thumbOptimizationSummary}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Chapter label</div>
          </div>

          <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm font-medium">
            <input type="checkbox" checked={autoNumber} onChange={(e) => setAutoNumber(e.target.checked)} />
            Auto chapter label
          </label>
        </div>

        {autoNumber ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Chapter Number</span>
              <input
                type="number"
                min={0}
                value={number}
                readOnly
                className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 outline-none cursor-not-allowed"
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-semibold">{t("Preview")}</span>
              <div className="px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
                Chapter {number}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Chapter Label</span>
              <input
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="Prolog, Bonus, Chapter 0..."
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Chapter Order</span>
              <input
                type="number"
                min={0}
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 0)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoNumber ? `Chapter ${number}` : "Optional title / subtitle"}
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
            <option value="DRAFT">{t("Draft")}</option>
            <option value="PUBLISHED">{t("Published")}</option>
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:col-span-2">
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
          <span className="text-sm font-semibold">{t("Content")}</span>
          <NovelRichTextEditor value={content} onChange={setContent} workId={workId} chapterId={chapter.id} />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
          <div className="font-semibold">Comic pages</div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Comic pages are managed on the "Manage Pages" page.</p>
        </div>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Author message (optional)</span>
        <textarea
          value={authorNote}
          onChange={(e) => setAuthorNote(e.target.value)}
          rows={5}
          placeholder={t("Message from the author/uploader for this chapter...")}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
      </label>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
