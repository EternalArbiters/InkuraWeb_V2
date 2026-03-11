"use client";

import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  subtitles: string[];
  setSubtitles: (v: string[]) => void;
  type: "NOVEL" | "COMIC";
  setType: (v: "NOVEL" | "COMIC") => void;
  comicType: string;
  setComicType: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  completion: string;
  setCompletion: (v: string) => void;
  origin: string;
  setOrigin: (v: string) => void;
};

export default function WorkBasicsFields({
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
  completion,
  setCompletion,
  origin,
  setOrigin,
}: Props) {
  const canAddSubtitle = subtitles.length < 5;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="grid gap-2 md:col-span-2">
        <span className="text-sm font-semibold">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          required
        />
      </label>

      <div className="grid gap-3 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Subtitles (optional)</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maks. 5 subtitle.</div>
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
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

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Type</span>
        <select
          value={type}
          onChange={(e) => {
            const next = e.target.value as "NOVEL" | "COMIC";
            setType(next);
            if (next !== "COMIC") setComicType("UNKNOWN");
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <option value="NOVEL">Novel</option>
          <option value="COMIC">Comic</option>
        </select>
      </label>

      {type === "COMIC" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Comic type</span>
          <select
            value={comicType}
            onChange={(e) => setComicType(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          >
            {COMIC_TYPE_CATALOG.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Language</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
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
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
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
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <option value="UNKNOWN">Unknown</option>
          <option value="ORIGINAL">Original</option>
          <option value="FANFIC">Fanfic</option>
          <option value="ADAPTATION">Adaptation</option>
        </select>
      </label>
    </div>
  );
}
