"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("Title cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/lists/${listId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: t, description: description.trim(), isPublic }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Failed to save.");
          return;
        }
        const nextList = data?.list || { title: t, description: description.trim(), isPublic };
        setTitle(nextList.title || t);
        setDescription(nextList.description || "");
        setIsPublic(!!nextList.isPublic);
        onSaved?.(nextList);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      } catch {
        setError("Network error.");
      }
    });
  };

  const del = async () => {
    if (!confirm("Hapus list ini?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          alert(data?.error || "Failed to delete.");
          return;
        }
        router.push("/lists");
      } catch {
        alert("Network error.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="text-sm font-extrabold">Manage list</div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          <span>Public (shareable)</span>
        </label>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="flex-1 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110 disabled:opacity-60"
          >
            {saved ? "Saved" : pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={del}
            className="px-4 py-2 rounded-xl border border-red-300 text-red-600 font-semibold hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
