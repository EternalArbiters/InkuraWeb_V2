"use client";

import BackButton from "@/app/components/BackButton";

type Page = { id: string; imageUrl: string; order: number };

export default function PagesGrid({
  workId,
  pages,
  loading,
  onUseAsCover,
  onDelete,
}: {
  workId: string;
  pages: Page[];
  loading: boolean;
  onUseAsCover: (url: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Pages ({pages.length})</div>
        <BackButton href={`/studio/works/${workId}`} />
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
          No pages yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pages.map((p) => (
            <div
              key={p.id}
              className="border border-gray-200 dark:border-gray-800 overflow-hidden bg-white/70 dark:bg-gray-900/40"
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
                  onClick={() => onUseAsCover(p.imageUrl)}
                  disabled={loading}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-60"
                >
                  Use as cover
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
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
  );
}
