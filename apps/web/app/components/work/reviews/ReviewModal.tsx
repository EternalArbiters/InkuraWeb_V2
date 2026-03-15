"use client";

import { Star, X } from "lucide-react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function ReviewModal({
  open,
  title,
  draftRating,
  setDraftRating,
  draftTitle,
  setDraftTitle,
  draftBody,
  setDraftBody,
  draftSpoiler,
  setDraftSpoiler,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  draftRating: number;
  setDraftRating: (v: number) => void;
  draftTitle: string;
  setDraftTitle: (v: string) => void;
  draftBody: string;
  setDraftBody: (v: string) => void;
  draftSpoiler: boolean;
  setDraftSpoiler: (v: boolean) => void;
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = useUILanguageText();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="font-bold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Rating
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => {
                const active = draftRating >= v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraftRating(v)}
                    className={`p-1 rounded ${
                      active
                        ? "text-yellow-600 dark:text-yellow-300"
                        : "text-gray-400 dark:text-gray-600"
                    } hover:brightness-110`}
                    aria-label={`${t("Rate")} ${v}`}
                  >
                    <Star size={22} className={active ? "fill-current" : ""} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Title (optional)
            </div>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              placeholder="Short summary"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Your review
            </div>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              className="mt-2 w-full min-h-[140px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              placeholder="Write your thoughts…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draftSpoiler}
              onChange={(e) => setDraftSpoiler(e.target.checked)}
            />
            Contains spoilers
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
              disabled={isPending}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
