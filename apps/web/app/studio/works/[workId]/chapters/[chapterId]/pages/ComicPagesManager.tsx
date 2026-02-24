"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { presignAndUpload } from "@/lib/r2UploadClient";

type Page = { id: string; imageUrl: string; order: number };

type Props = {
  workId: string;
  chapterId: string;
  pages: Page[];
};

export default function ComicPagesManager({ workId, chapterId, pages }: Props) {
  const router = useRouter();
  const [files, setFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function upload() {
    if (!files.length) return;
    setErr(null);
    setLoading(true);
    try {
      const startOrder = pages.length;
      const uploaded = [] as { url: string; key: string; order: number }[];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const up = await presignAndUpload({ scope: "pages", file, workId, chapterId });
        uploaded.push({ url: up.url, key: up.key, order: startOrder + i + 1 });
      }

      const res = await fetch(`/api/studio/chapters/${chapterId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: uploaded }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Commit failed");

      setFiles([]);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function del(pageId: string) {
    if (!confirm("Delete this page?")) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/comic-pages/${pageId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Delete failed");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-2">
        <div className="font-semibold">Add pages</div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={upload}
            disabled={loading || files.length === 0}
            className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Working..." : "Upload"}
          </button>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Tip: upload large chapters in batches (e.g. 10–20 pages).</div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Pages ({pages.length})</div>
          <a href={`/studio/works/${workId}`} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Back to Work
          </a>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">No pages yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white/70 dark:bg-gray-900/40"
              >
                <div className="relative aspect-[3/4] bg-black/5 dark:bg-white/5">
                  <img
                    src={p.imageUrl}
                    alt={`Page ${p.order}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600 dark:text-gray-300">#{p.order}</div>
                  <button
                    type="button"
                    onClick={() => del(p.id)}
                    disabled={loading}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
