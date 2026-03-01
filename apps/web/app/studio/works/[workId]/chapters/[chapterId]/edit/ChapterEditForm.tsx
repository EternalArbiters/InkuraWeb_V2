"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
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
  pages?: { id: string; imageUrl: string; imageKey?: string | null; order: number }[];
};

type Props = {
  workId: string;
  workTitle: string;
  workType: "NOVEL" | "COMIC";
  chapter: Chapter;
  warningTags: PickerItem[];
};

export default function ChapterEditForm({ workId, workTitle, workType, chapter, warningTags }: Props) {
  const router = useRouter();
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

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const autoThumb = React.useMemo(() => {
    const pages = Array.isArray(chapter.pages) ? chapter.pages.filter((p) => !!p?.imageUrl) : [];
    if (!pages.length) return null;
    // stable "random": pick based on chapterId hash
    let h = 5381;
    for (let i = 0; i < chapter.id.length; i++) h = (h * 33) ^ chapter.id.charCodeAt(i);
    const idx = (h >>> 0) % pages.length;
    return pages[idx]?.imageUrl || pages[0]?.imageUrl || null;
  }, [chapter.id, chapter.pages]);

  async function uploadThumbnail(file: File) {
    setError(null);
    setThumbUploading(true);
    try {
      const up = await presignAndUpload({ scope: "pages", file, workId, chapterId: chapter.id });
      setThumbUrl(up.url);
      setThumbKey(up.key);
    } catch (e: any) {
      setError(e?.message || "Failed to upload thumbnail");
    } finally {
      setThumbUploading(false);
    }
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

      // Chapter thumbnail (optional)
      payload.thumbnailImage = thumbUrl || null;
      payload.thumbnailKey = thumbUrl ? thumbKey || null : null;

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

      <MultiSelectPicker title="NSFW (Chapter)" subtitle="NSFW / sensitive tags khusus chapter ini." items={warningTags} selectedIds={warningIds} onChange={setWarningIds} />

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
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Halaman comic dikelola di halaman "Manage Pages".
          </p>
        </div>
      )}

      {/* Chapter thumbnail (Webtoon-style) */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Chapter cover (thumbnail)</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Kalau tidak dipilih, sistem akan ambil otomatis dari page (acak tapi stabil).
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setThumbUrl(null);
              setThumbKey(null);
            }}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
            disabled={thumbUploading}
          >
            Use auto
          </button>
        </div>

        <div className="mt-3 grid md:grid-cols-[140px_1fr] gap-4 items-start">
          <div className="w-[140px]">
            <div className="aspect-[3/2] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
              {thumbUrl || autoThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl || autoThumb || ""} alt="thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">No image</div>
              )}
            </div>
            <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">
              Mode: <b>{thumbUrl ? "Custom" : "Auto"}</b>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Upload thumbnail</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadThumbnail(f);
                }}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                disabled={thumbUploading}
              />
              {thumbUploading ? <span className="text-xs text-gray-600 dark:text-gray-300">Uploading…</span> : null}
            </label>

            {workType === "COMIC" && Array.isArray(chapter.pages) && chapter.pages.length ? (
              <div>
                <div className="text-sm font-semibold">Pick from pages</div>
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {chapter.pages.slice(0, 24).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setThumbUrl(p.imageUrl);
                        setThumbKey(p.imageKey || null);
                      }}
                      className={
                        "aspect-[1/1] rounded-xl overflow-hidden border transition " +
                        (thumbUrl === p.imageUrl
                          ? "border-purple-500 ring-2 ring-purple-400"
                          : "border-gray-200 dark:border-gray-800 hover:brightness-95")
                      }
                      title={`Use page #${p.order}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt="page" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
