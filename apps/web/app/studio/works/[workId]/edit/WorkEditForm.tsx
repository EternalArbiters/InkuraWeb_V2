"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import TagMultiInput from "@/components/TagMultiInput";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

type Work = {
  id: string;
  title: string;
  description: string | null;
  type: "NOVEL" | "COMIC";
  coverImage: string | null;
  language: string;
  origin: string;
  completion: string;
  isMature: boolean;
  genres: { id: string; name: string; slug: string }[];
  warningTags: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

type Props = {
  work: Work;
  genres: PickerItem[];
  warningTags: PickerItem[];
};

export default function WorkEditForm({ work, genres, warningTags }: Props) {
  const router = useRouter();
  const [title, setTitle] = React.useState(work.title);
  const [description, setDescription] = React.useState(work.description || "");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">(work.type);
  const [language, setLanguage] = React.useState(work.language || "id");
  const [origin, setOrigin] = React.useState(work.origin || "UNKNOWN");
  const [completion, setCompletion] = React.useState(work.completion || "ONGOING");
  const [isMature, setIsMature] = React.useState(!!work.isMature);

  const [genreIds, setGenreIds] = React.useState<string[]>(work.genres.map((g) => g.id));
  const [warningIds, setWarningIds] = React.useState<string[]>(work.warningTags.map((w) => w.id));
  const [tags, setTags] = React.useState<string[]>(work.tags.map((t) => t.name));

  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [removeCover, setRemoveCover] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("type", type);
      fd.append("language", language);
      fd.append("origin", origin);
      fd.append("completion", completion);
      fd.append("isMature", String(isMature));
      fd.append("genreIds", JSON.stringify(genreIds));
      fd.append("warningTagIds", JSON.stringify(warningIds));
      fd.append("tags", JSON.stringify(tags));
      fd.append("removeCover", String(removeCover));
      if (coverFile) fd.append("cover", coverFile);

      const res = await fetch(`/api/studio/works/${work.id}`, { method: "PATCH", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      router.push(`/studio/works/${work.id}`);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="NOVEL">Novel</option>
            <option value="COMIC">Comic</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            {LANGUAGE_CATALOG.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Completion</span>
          <select
            value={completion}
            onChange={(e) => setCompletion(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="HIATUS">Hiatus</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Origin</span>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="ORIGINAL">Original</option>
            <option value="FANFIC">Fanfic</option>
            <option value="ADAPTATION">Adaptation</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Cover</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
          {work.coverImage ? (
            <label className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
              Remove existing cover
            </label>
          ) : null}
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Server akan auto-crop center + compress (WebP).
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">18+ / Mature</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Viewer wajib opt-in 18+ di Settings sebelum bisa membaca.
            </div>
          </div>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
      </label>

      <MultiSelectPicker title="Genres" subtitle="Unlimited selection." items={genres} selectedIds={genreIds} onChange={setGenreIds} />

      <MultiSelectPicker
        title="Warnings"
        subtitle="Content warnings untuk karya (gore, sexual content, dll)."
        items={warningTags}
        selectedIds={warningIds}
        onChange={setWarningIds}
      />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <TagMultiInput value={tags} onChange={setTags} placeholder="Tambah tag, enter untuk simpan..." />
      </div>

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
