"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
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
  const t = useUILanguageText();
  const canAddSubtitle = subtitles.length < 5;

  return (
    <div className="rounded-2xl border border-gray-200 p-4 grid gap-3 dark:border-gray-800">
      <div className="grid gap-1">
        <label className="text-sm font-semibold">{t("Title")}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder={t("Work Title")}
        />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t("Subtitles (optional)")}</div>
            <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">{t("Max. 5 subtitles.")}</div>
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
            {t("Add sub title")}
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
                  placeholder={`${t("Subtitle")} ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setSubtitles(subtitles.filter((_, itemIndex) => itemIndex !== index))}
                  className="shrink-0 rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t("Remove")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-sm font-semibold">{t("Type")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="NOVEL">{t("Novel")}</option>
            <option value="COMIC">{t("Comic")}</option>
          </select>
        </div>

        {type === "COMIC" ? (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Comic type")}</label>
            <select
              value={comicType}
              onChange={(e) => setComicType(e.target.value as any)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <option value="UNKNOWN">{t("Unknown")}</option>
              <option value="MANGA">{t("Manga")}</option>
              <option value="MANHWA">{t("Manhwa")}</option>
              <option value="MANHUA">{t("Manhua")}</option>
              <option value="WEBTOON">{t("Webtoon")}</option>
              <option value="WESTERN">{t("Western")}</option>
              <option value="OTHER">{t("Other")}</option>
            </select>
          </div>
        ) : (
          <div />
        )}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">{t("Language")}</label>
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
        <label className="text-sm font-semibold">{t("Origin")}</label>
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value as any)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <option value="UNKNOWN">{t("Unknown")}</option>
          <option value="ORIGINAL">{t("Original")}</option>
          <option value="FANFIC">{t("Fanfic")}</option>
          <option value="ADAPTATION">{t("Adaptation")}</option>
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">{t("Completion")}</label>
        <select
          value={completion}
          onChange={(e) => setCompletion(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <option value="ONGOING">{t("Ongoing")}</option>
          <option value="COMPLETED">{t("Completed")}</option>
          <option value="HIATUS">{t("Hiatus")}</option>
          <option value="CANCELLED">{t("Cancelled")}</option>
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">{t("Description")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder={t("Short synopsis...")}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-semibold">{t("Tags (comma)")}</label>
        <input
          value={tagsRaw}
          onChange={(e) => onTagsRawChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
          placeholder={t("action, romance, comedy")}
        />
        <div className="text-[11px] text-gray-600 dark:text-gray-300">{t("Max. 25 tags.")}</div>
      </div>
    </div>
  );
}
