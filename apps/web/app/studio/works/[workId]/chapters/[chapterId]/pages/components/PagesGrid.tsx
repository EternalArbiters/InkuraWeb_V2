"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import BackButton from "@/app/components/BackButton";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Page = { id: string; imageUrl: string; order: number };

export default function PagesGrid({
  workId,
  pages,
  loading,
  onUseAsCover,
  onDelete,
  onMove,
}: {
  workId: string;
  pages: Page[];
  loading: boolean;
  onUseAsCover: (url: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const t = useUILanguageText();

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Pages ({pages.length})</div>
        </div>
        <BackButton href={`/studio/works/${workId}`} />
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
          No pages yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((p, index) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/40"
            >
              <div className="relative aspect-[3/4] bg-black/5 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={`${t("Page")} ${p.order}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="grid gap-3 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600 dark:text-gray-300">#{p.order}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onMove(p.id, "up")}
                      disabled={loading || index === 0}
                      aria-label={t("Move page up")}
                      title={t("Move page up")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-40 dark:border-gray-800"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(p.id, "down")}
                      disabled={loading || index === pages.length - 1}
                      aria-label={t("Move page down")}
                      title={t("Move page down")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-40 dark:border-gray-800"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
