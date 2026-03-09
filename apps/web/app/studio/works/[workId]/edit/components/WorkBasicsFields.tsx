"use client";

import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";

export default function WorkBasicsFields({
  title,
  setTitle,
  subtitle,
  setSubtitle,
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
}: {
  title: string;
  setTitle: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
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
}) {
  return (
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
        <span className="text-sm font-semibold">Subtitle (optional)</span>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Optional subtitle / alternate title"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Type</span>
        <select
          value={type}
          onChange={(e) => {
            const next = e.target.value as "NOVEL" | "COMIC";
            setType(next);
            if (next !== "COMIC") setComicType("UNKNOWN");
          }}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
    </div>
  );
}
