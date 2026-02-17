"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

function roleToPublishType(role: string): "ORIGINAL" | "TRANSLATION" | "REUPLOAD" {
  const r = (role || "").toUpperCase();
  if (r === "TRANSLATOR") return "TRANSLATION";
  if (r === "UPLOADER") return "REUPLOAD";
  return "ORIGINAL";
}

export default function NewWorkForm({
  genres,
  warningTags,
  creatorRole,
}: {
  genres: PickerItem[];
  warningTags: PickerItem[];
  creatorRole: string;
}) {
  const router = useRouter();

  const publishType = roleToPublishType(creatorRole);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">("NOVEL");
  const [isMature, setIsMature] = React.useState(false);

  const [selectedGenreIds, setSelectedGenreIds] = React.useState<string[]>([]);
  const [selectedWarningIds, setSelectedWarningIds] = React.useState<string[]>([]);

  const [originalAuthorCredit, setOriginalAuthorCredit] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [uploaderNote, setUploaderNote] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Title is required");
    if (needsSource) {
      if (!originalAuthorCredit.trim()) return setError("Original author credit is required");
      if (!sourceUrl.trim()) return setError("Source URL is required");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/studio/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          isMature,
          genreIds: selectedGenreIds,
          warningTagIds: selectedWarningIds,
          publishType,
          originalAuthorCredit: needsSource ? originalAuthorCredit : null,
          sourceUrl: needsSource ? sourceUrl : null,
          uploaderNote: publishType === "REUPLOAD" ? uploaderNote : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create work");

      router.push(`/studio/works/${json.work.id}`);
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
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Publish type</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Ditentukan oleh role kamu (<b>{creatorRole}</b>).
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold bg-gray-50 dark:bg-gray-900">
            {publishType}
          </span>
          {needsSource ? <span className="text-xs text-yellow-700 dark:text-yellow-300">Requires credit + source</span> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <label className="text-sm font-semibold">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="text-sm font-semibold">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <option value="NOVEL">Novel</option>
              <option value="COMIC">Comic</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold mt-8">
            <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
            Mature (18+)
          </label>
        </div>
      </div>

      {needsSource ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
          <div className="text-sm font-semibold">Credit & source</div>
          <label className="text-sm font-semibold">
            Original author credit
            <input
              value={originalAuthorCredit}
              onChange={(e) => setOriginalAuthorCredit(e.target.value)}
              placeholder="Nama author asli"
              className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
          </label>

          <label className="text-sm font-semibold">
            Source URL
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
          </label>

          {publishType === "REUPLOAD" ? (
            <label className="text-sm font-semibold">
              Uploader note (optional)
              <textarea
                value={uploaderNote}
                onChange={(e) => setUploaderNote(e.target.value)}
                rows={3}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <MultiSelectPicker title="Genres" subtitle="Pilih genre yang relevan" items={genres} selectedIds={selectedGenreIds} onChange={setSelectedGenreIds} />

      <MultiSelectPicker
        title="NSFW"
        subtitle="Pilih NSFW tags yang relevan (18+ / sensitive)"
        items={warningTags}
        selectedIds={selectedWarningIds}
        onChange={setSelectedWarningIds}
      />

      <button
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
