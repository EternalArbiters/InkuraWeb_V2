"use client";

import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

export default function WorkBasicsCard({
  title,
  setTitle,
  type,
  setType,
  comicType,
  setComicType,
  language,
  setLanguage,
  origin,
  setOrigin,
  completion,
  setCompletion,
  description,
  setDescription,
  tagsRaw,
  onTagsRawChange,
}: {
  title: string;
  setTitle: (v: string) => void;
  type: "NOVEL" | "COMIC";
  setType: (v: "NOVEL" | "COMIC") => void;
  comicType: "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER";
  setComicType: (v: any) => void;
  language: string;
  setLanguage: (v: string) => void;
  origin: "UNKNOWN" | "ORIGINAL" | "FANFIC" | "ADAPTATION";
  setOrigin: (v: any) => void;
  completion: string;
  setCompletion: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  tagsRaw: string;
  onTagsRawChange: (raw: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-semibold">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
            placeholder="Work Title"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-semibold">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
          >
            <option value="NOVEL">Novel</option>
            <option value="COMIC">Comic</option>
          </select>
        </div>
      </div>

      {type === "COMIC" ? (
        <div className="grid gap-1">
          <label className="text-sm font-semibold">Comic type</label>
          <select
            value={comicType}
            onChange={(e) => setComicType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
          >
            <option value="UNKNOWN">Unknown</option>
            <option value="MANGA">Manga</option>
            <option value="MANHWA">Manhwa</option>
            <option value="MANHUA">Manhua</option>
            <option value="WEBTOON">Webtoon</option>
            <option value="WESTERN">Western</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      ) : null}

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
        >
          {LANGUAGE_CATALOG.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Origin</label>
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
        >
          <option value="UNKNOWN">Unknown</option>
          <option value="ORIGINAL">Original</option>
          <option value="FANFIC">Fanfic</option>
          <option value="ADAPTATION">Adaptation</option>
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Completion</label>
        <select
          value={completion}
          onChange={(e) => setCompletion(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
        >
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="HIATUS">Hiatus</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>


      <div className="grid gap-1">
        <label className="text-sm font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm min-h-[120px]"
          placeholder="Sinopsis singkat..."
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Tags (comma)</label>
        <input
          value={tagsRaw}
          onChange={(e) => onTagsRawChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
          placeholder="action, romance, comedy"
        />
        <div className="text-[11px] text-gray-600 dark:text-gray-300">Maks 25 tags.</div>
      </div>
    </div>
  );
}
