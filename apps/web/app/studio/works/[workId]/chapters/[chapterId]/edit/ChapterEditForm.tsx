"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import ThumbCropper from "@/app/components/ThumbCropper";
import { presignAndUpload } from "@/lib/r2UploadClient";

type Chapter = {
  id: string;
  title: string;
  number: number;
  status: string;
  isMature: boolean;
  warningTags: { id: string; name: string; slug: string }[];
  text?: { content: string } | null;
  authorNote?: string | null;
  thumbnailImage?: string | null;
  thumbnailKey?: string | null;
  thumbnailFocusX?: number | null;
  thumbnailFocusY?: number | null;
  thumbnailZoom?: number | null;
};

type Props = {
  workId: string;
  workTitle: string;
  workType: "NOVEL" | "COMIC";
  chapter: Chapter;
  warningTags: PickerItem[];
};

function clamp(n: unknown, def: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, v));
}

export default function ChapterEditForm({ workId, workTitle, workType, chapter, warningTags }: Props) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = React.useState(chapter.title || "");
  const [number, setNumber] = React.useState(chapter.number || 0);
  const [status, setStatus] = React.useState(chapter.status || "DRAFT");
  const [isMature, setIsMature] = React.useState(!!chapter.isMature);
  const [warningIds, setWarningIds] = React.useState<string[]>(chapter.warningTags.map((w) => w.id));

  const [content, setContent] = React.useState(chapter.text?.content || "");
  const [authorNote, setAuthorNote] = React.useState(chapter.authorNote || "");

  const [thumbUrl, setThumbUrl] = React.useState<string | null>(chapter.thumbnailImage || null);
  const [thumbKey, setThumbKey] = React.useState<string | null>(chapter.thumbnailKey || null);
  const [thumbUploading, setThumbUploading] = React.useState(false);

  const [thumbFocusX, setThumbFocusX] = React.useState<number>(clamp(chapter.thumbnailFocusX, 50, 0, 100));
  const [thumbFocusY, setThumbFocusY] = React.useState<number>(clamp(chapter.thumbnailFocusY, 50, 0, 100));
  const [thumbZoom, setThumbZoom] = React.useState<number>(clamp(chapter.thumbnailZoom, 1, 1, 2.5));

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function uploadThumb(file: File | null) {
    if (!file) return;
    setError(null);
    setThumbUploading(true);
    try {
      const up = await presignAndUpload({ scope: "pages", file, workId, chapterId: chapter.id });
      setThumbUrl(up.url);
      setThumbKey(up.key);
      // Reset crop to a sensible default for new uploads
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
    setThumbUrl(null);
    setThumbKey(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        title: title || `Chapter ${number}`,
        number,
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
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <div className="font-semibold">{workTitle}</div>
          <div className="text-xs">Type: {workType}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Chapter cover</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Thumbnail yang tampil di list chapter (Webtoon-style). Kalau kosong, sistem ambil otomatis.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
          <ThumbCropper
            src={thumbUrl}
            value={{ focusX: thumbFocusX, focusY: thumbFocusY, zoom: thumbZoom }}
            maxZoom={2.5}
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Chapter Number</span>
          <input
            type="number"
            min={0}
            value={number}
            onChange={(e) => setNumber(parseInt(e.target.value, 10) || 0)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Chapter ${number}`}
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
            <div className="text-xs text-gray-600 dark:text-gray-300">Viewer wajib opt-in 18+.</div>
          </div>
        </label>
      </div>

      <MultiSelectPicker
        title="NSFW (Chapter)"
        subtitle="NSFW / sensitive tags khusus chapter ini."
        items={warningTags}
        selectedIds={warningIds}
        onChange={setWarningIds}
      />

      {workType === "NOVEL" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Content</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            placeholder="Tulis isi chapter..."
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
          <div className="font-semibold">Comic pages</div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Halaman comic dikelola di halaman "Manage Pages".</p>
        </div>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Author message (optional)</span>
        <textarea
          value={authorNote}
          onChange={(e) => setAuthorNote(e.target.value)}
          rows={5}
          placeholder="Pesan dari author/uploader untuk chapter ini..."
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
