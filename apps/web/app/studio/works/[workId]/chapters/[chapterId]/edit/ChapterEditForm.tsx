"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

type Chapter = {
  id: string;
  title: string;
  number: number;
  status: string;
  isMature: boolean;
  warningTags: { id: string; name: string; slug: string }[];
  text?: { content: string } | null;
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

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

      <MultiSelectPicker title="Warnings (Chapter)" subtitle="Content warnings khusus chapter ini." items={warningTags} selectedIds={warningIds} onChange={setWarningIds} />

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

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
