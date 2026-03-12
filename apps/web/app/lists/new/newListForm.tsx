"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewListForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, description: description.trim(), isPublic }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to create list.");
        return;
      }

      const slug = data?.list?.slug;
      if (slug) {
        router.push(`/lists/${slug}`);
        return;
      }

      router.push("/lists");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-4">
      <div>
        <label className="text-sm font-semibold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          placeholder='example: "Indonesian Romance"'
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/30"
          placeholder="keterangan singkat..."
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span>
          Make public (shareable){" "}
          <span className="text-xs text-gray-600 dark:text-gray-300">— works inside the list still follow the viewer's 18+/Deviant Love gate</span>
        </span>
      </label>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <button
        disabled={saving}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create list"}
      </button>
    </form>
  );
}
