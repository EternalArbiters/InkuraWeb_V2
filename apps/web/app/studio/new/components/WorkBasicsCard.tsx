"use client";

import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  subtitles: string[];
  setSubtitles: (v: string[]) => void;
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
};

export default function WorkBasicsCard({
  title,
  setTitle,
  subtitles,
  setSubtitles,
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
}: Props) {
  const canAddSubtitle = subtitles.length < 5;

  return (
    <div className="rounded-2xl border border-gray-200 p-4 grid gap-3 dark:border-gray-800">
      <div className="grid gap-1">
        <label className="text-sm font-semibold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder="Work Title"
        />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Subtitles (optional)</div>
            <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">Maks. 5 subtitle.</div>
          </div>
          <button
            type="button"
            disabled={!canAddSubtitle}
            onClick={() => {
              if (!canAddSubtitle) return;
              setSubtitles([...subtitles, ""]);
            }}
            className="rounded-full border border-purple-400/60 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/10 disabled:opacity-40"
          >
            + Add sub title
          </button>
        </div>

        {subtitles.length ? (
          <div className="grid gap-3">
            {subtitles.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(e) => {
                    const next = [...subtitles];
                    next[index] = e.target.value.slice(0, 200);
                    setSubtitles(next);
                  }}
                  maxLength={200}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  placeholder={`Subtitle ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setSubtitles(subtitles.filter((_, itemIndex) => itemIndex !== index))}
                  className="shrink-0 rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-sm font-semibold">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="NOVEL">Novel</option>
            <option value="COMIC">Comic</option>
          </select>
        </div>

        {type === "COMIC" ? (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Comic type</label>
            <select
              value={comicType}
              onChange={(e) => setComicType(e.target.value as any)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
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
        ) : (
          <div />
        )}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
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
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
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
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
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
          className="min-h-[120px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder="Short synopsis..."
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">Tags (comma)</label>
        <input
          value={tagsRaw}
          onChange={(e) => onTagsRawChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder="action, romance, comedy"
        />
        <div className="text-[11px] text-gray-600 dark:text-gray-300">Maks 25 tags.</div>
      </div>
    </div>
  );
}
