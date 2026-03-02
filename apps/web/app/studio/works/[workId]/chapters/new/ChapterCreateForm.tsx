"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { presignAndUpload } from "@/lib/r2UploadClient";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

type Props = {
  workId: string;
  workTitle: string;
  workType: "NOVEL" | "COMIC";
  nextNumber: number;
  warningTags: PickerItem[];
};

type CreatedChapter = { id: string };

type PageCommit = { url: string; key?: string | null; order?: number };

export default function ChapterCreateForm({ workId, workTitle, workType, nextNumber, warningTags }: Props) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [number, setNumber] = React.useState(nextNumber);
  const [status, setStatus] = React.useState("DRAFT");
  const [isMature, setIsMature] = React.useState(false);
  const [warningIds, setWarningIds] = React.useState<string[]>([]);

  const [content, setContent] = React.useState("");
  const [pages, setPages] = React.useState<File[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [createdChapterId, setCreatedChapterId] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setCreatedChapterId(null);

    if (workType === "NOVEL" && !content.trim()) {
      setError("Content wajib diisi untuk NOVEL");
      return;
    }

    setLoading(true);
    try {
      // Step 1: create chapter (metadata + novel content only)
      setNote("Membuat chapter...");

      const payload: any = {
        workId,
        number,
        title: (title || `Chapter ${number}`).trim(),
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

      // Step 2: if comic + pages selected, upload directly to R2 (presigned), then commit.
      if (workType === "COMIC" && pages.length) {
        const uploads: PageCommit[] = [];
        for (let i = 0; i < pages.length; i += 1) {
          const file = pages[i];
          setNote(`Upload halaman ${i + 1}/${pages.length}...`);
          const up = await presignAndUpload({ scope: "pages", file, workId, chapterId });
          uploads.push({ url: up.url, key: up.key, order: i + 1 });
        }

        setNote("Menyimpan daftar halaman...");
        const commitRes = await fetch(`/api/studio/chapters/${chapterId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pages: uploads }),
        });
        const commitJson = await commitRes.json();
        if (!commitRes.ok) {
          throw new Error(commitJson?.error || "Gagal menyimpan halaman. Chapter sudah dibuat; coba upload ulang di Manage Pages.");
        }
      }

      setNote(null);
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
          <div className="font-semibold">Error</div>
          <div className="mt-1">{error}</div>
          {createdChapterId ? (
            <div className="mt-3">
              <a
                href={`/studio/works/${workId}/chapters/${createdChapterId}/pages`}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold bg-white/60 dark:bg-gray-900/40 hover:brightness-110"
              >
                Buka Manage Pages
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {note ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4 text-sm">
          {note}
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

      <MultiSelectPicker
        title="NSFW (Chapter)"
        subtitle="NSFW / sensitive tags specifically for this chapter."
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
            placeholder="Write the contents of the chapter..."
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Pages (Images)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPages(Array.from(e.target.files || []))}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Kalau kamu pilih file di sini, v13 akan upload langsung ke R2 (presigned) saat kamu klik Create.
          </span>
        </label>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create Chapter"}
        </button>
      </div>
    </form>
  );
}
