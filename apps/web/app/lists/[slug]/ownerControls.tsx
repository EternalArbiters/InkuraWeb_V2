"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function ListOwnerControls({
  listId,
  initialTitle,
  initialDescription,
  initialPublic,
  onSaved,
}: {
  listId: string;
  initialTitle: string;
  initialDescription: string;
  initialPublic: boolean;
  onSaved?: (list: { title: string; description?: string | null; isPublic: boolean }) => void;
}) {
  const router = useRouter();
  const t = useUILanguageText("Page Lists");
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError(t("List title cannot be empty."));
      return;
    }

    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/lists/${listId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            description: description.trim() || null,
            isPublic,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || t("Failed to save."));
          return;
        }
        const nextList = data?.list || { title: nextTitle, description: description.trim(), isPublic };
        setTitle(nextList.title || nextTitle);
        setDescription(nextList.description || "");
        setIsPublic(!!nextList.isPublic);
        onSaved?.(nextList);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      } catch {
        setError(t("Network error."));
      }
    });
  };

  const del = async () => {
    if (!confirm(t("Delete this list?"))) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          alert(data?.error || t("Failed to delete."));
          return;
        }
        router.push("/lists");
      } catch {
        alert(t("Network error."));
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="text-sm font-extrabold">{t("Manage list")}</div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("Title")}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("Description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          <span>{t("Public (shareable)")}</span>
        </label>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {saved ? <div className="text-sm text-emerald-600">{t("Saved!")}</div> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={save}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
          >
            {isPending ? t("Saving...") : t("Save")}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={del}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30 disabled:opacity-60"
          >
            {t("Delete list")}
          </button>
        </div>
      </div>
    </div>
  );
}
