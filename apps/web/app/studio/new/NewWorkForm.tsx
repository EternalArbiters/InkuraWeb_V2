"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { type PickerItem } from "@/components/MultiSelectPicker";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFile, type PreparedUploadFile } from "@/lib/uploadOptimization";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import CoverCard from "./components/CoverCard";
import DeviantLoveCard from "./components/DeviantLoveCard";
import PublishTypeCard from "./components/PublishTypeCard";
import SubmitRow from "./components/SubmitRow";
import WorkBasicsCard from "./components/WorkBasicsCard";

type Props = {
  genres: PickerItem[];
  warningTags: PickerItem[];
  deviantLoveTags: PickerItem[];
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

function buildOptimizationSummary(prepared: PreparedUploadFile | null) {
  if (!prepared) return null;
  const bytesSaved = Math.max(0, prepared.originalBytes - prepared.optimizedBytes);
  if (prepared.compressionApplied || bytesSaved > 0) {
    return `${formatBytes(prepared.originalBytes)} → ${formatBytes(prepared.optimizedBytes)}`;
  }
  return `No optimization needed (${formatBytes(prepared.optimizedBytes)})`;
}

export default function NewWorkForm({ genres, warningTags, deviantLoveTags }: Props) {
  const router = useRouter();
  const t = useUILanguageText();

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [subtitles, setSubtitles] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">("NOVEL");
  const [comicType, setComicType] = React.useState<
    "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER"
  >("UNKNOWN");
  const [language, setLanguage] = React.useState("other");
  const [origin, setOrigin] = React.useState<
    "UNKNOWN" | "ORIGINAL" | "FANFIC" | "ADAPTATION"
  >("UNKNOWN");
  const [completion, setCompletion] = React.useState("ONGOING");

  const [publishType, setPublishType] = React.useState<
    "ORIGINAL" | "TRANSLATION" | "REUPLOAD"
  >("ORIGINAL");
  const [originalAuthorCredit, setOriginalAuthorCredit] = React.useState("");
  const [originalTranslatorCredit, setOriginalTranslatorCredit] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [companyCredit, setCompanyCredit] = React.useState("");
  const [uploaderNote, setUploaderNote] = React.useState("");
  const [seriesTitle, setSeriesTitle] = React.useState("");
  const [seriesOrder, setSeriesOrder] = React.useState("");

  const [isMature, setIsMature] = React.useState(false);
  const [isDeviantLove, setIsDeviantLove] = React.useState(false);
  const [genreIds, setGenreIds] = React.useState<string[]>([]);
  const [warningTagIds, setWarningTagIds] = React.useState<string[]>([]);
  const [deviantLoveTagIds, setDeviantLoveTagIds] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagsRaw, setTagsRaw] = React.useState("");

  const [coverPrepared, setCoverPrepared] = React.useState<PreparedUploadFile | null>(null);
  const [coverPreparing, setCoverPreparing] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (coverPrepared?.previewUrl) URL.revokeObjectURL(coverPrepared.previewUrl);
    };
  }, [coverPrepared?.previewUrl]);

  React.useEffect(() => {
    if (!isMature && warningTagIds.length) setWarningTagIds([]);
  }, [isMature, warningTagIds.length]);

  async function onPickCover(file: File | null) {
    if (coverPrepared?.previewUrl) URL.revokeObjectURL(coverPrepared.previewUrl);
    if (!file) {
      setCoverPrepared(null);
      setCoverPreparing(false);
      return;
    }
    setCoverPreparing(true);
    setErr(null);
    try {
      const prepared = await prepareUploadFile({ scope: "covers", file, makePreviewUrl: true });
      setCoverPrepared(prepared);
    } catch {
      setCoverPrepared(null);
      setErr("Failed to process the cover.");
    } finally {
      setCoverPreparing(false);
    }
  }

  function syncTags(raw: string) {
    setTagsRaw(raw);
    const next = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);
    setTags(next);
  }

  const needsSource = publishType !== "ORIGINAL";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!title.trim()) return setErr("Title is required.");
    if (!coverPrepared) return setErr("A cover upload is required.");

    if (needsSource) {
      if (!originalAuthorCredit.trim()) return setErr("Original author credit is required.");
      if (!sourceUrl.trim()) return setErr("Source URL is required.");
    }

    if (publishType === "REUPLOAD") {
      if (!originalTranslatorCredit.trim()) return setErr("Original translator credit is required for Reupload.");
    }

    setLoading(true);
    try {
      const coverUpload = await presignAndUpload({
        scope: "covers",
        file: coverPrepared.originalFile,
        preparedFile: coverPrepared,
        optimizationVersion: "pr4-cover-opt-v1",
      });

      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("subtitleEntries", JSON.stringify(subtitles));
      fd.set("description", description.trim());
      fd.set("type", type);
      fd.set("comicType", comicType);
      fd.set("language", (language || "other").trim().toLowerCase());
      fd.set("origin", origin);
      fd.set("completion", completion);
      fd.set("publishType", publishType);
      fd.set("isMature", isMature ? "true" : "false");
      fd.set("genreIds", JSON.stringify(genreIds));
      fd.set("warningTagIds", JSON.stringify(isMature ? warningTagIds : []));
      fd.set("deviantLoveTagIds", JSON.stringify(isDeviantLove ? deviantLoveTagIds : []));
      fd.set("tags", JSON.stringify(tags));
      fd.set("coverUrl", coverUpload.url);
      fd.set("coverKey", coverUpload.key);

      if (needsSource) {
        fd.set("originalAuthorCredit", originalAuthorCredit.trim());
        fd.set("sourceUrl", sourceUrl.trim());
        if (companyCredit.trim()) fd.set("companyCredit", companyCredit.trim());
      }
      if (publishType === "REUPLOAD") {
        fd.set("originalTranslatorCredit", originalTranslatorCredit.trim());
        if (uploaderNote.trim()) fd.set("uploaderNote", uploaderNote.trim());
      }
      if (seriesTitle.trim()) fd.set("seriesTitle", seriesTitle.trim());
      if (seriesOrder.trim()) fd.set("seriesOrder", seriesOrder.trim());

      const res = await fetch("/api/studio/works", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed");
      router.push(`/studio/works/${json?.work?.id}`);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {err}
        </div>
      ) : null}

      <CoverCard
        coverPreview={coverPrepared?.previewUrl || null}
        coverName={coverPrepared?.originalFile.name || null}
        coverBytes={coverPrepared?.optimizedBytes ?? null}
        coverOptimizationSummary={buildOptimizationSummary(coverPrepared)}
        coverPreparing={coverPreparing}
        onPickCover={onPickCover}
      />

      <PublishTypeCard
        publishType={publishType}
        setPublishType={setPublishType}
        originalAuthorCredit={originalAuthorCredit}
        setOriginalAuthorCredit={setOriginalAuthorCredit}
        originalTranslatorCredit={originalTranslatorCredit}
        setOriginalTranslatorCredit={setOriginalTranslatorCredit}
        sourceUrl={sourceUrl}
        setSourceUrl={setSourceUrl}
        companyCredit={companyCredit}
        setCompanyCredit={setCompanyCredit}
        uploaderNote={uploaderNote}
        setUploaderNote={setUploaderNote}
      />

      <WorkBasicsCard
        title={title}
        setTitle={setTitle}
        subtitles={subtitles}
        setSubtitles={setSubtitles}
        type={type}
        setType={setType}
        comicType={comicType}
        setComicType={setComicType}
        language={language}
        setLanguage={setLanguage}
        origin={origin}
        setOrigin={setOrigin}
        completion={completion}
        setCompletion={setCompletion}
        description={description}
        setDescription={setDescription}
        tagsRaw={tagsRaw}
        onTagsRawChange={syncTags}
      />


      <MultiSelectPicker
        title="Genres"
        items={genres}
        selectedIds={genreIds}
        onChange={setGenreIds}
      />

      <DeviantLoveCard
        warningTags={warningTags}
        isMature={isMature}
        setIsMature={setIsMature}
        warningTagIds={warningTagIds}
        setWarningTagIds={setWarningTagIds}
        deviantLoveTags={deviantLoveTags}
        isDeviantLove={isDeviantLove}
        setIsDeviantLove={setIsDeviantLove}
        deviantLoveTagIds={deviantLoveTagIds}
        setDeviantLoveTagIds={setDeviantLoveTagIds}
      />

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
<div className="text-sm font-semibold">{t("Series (optional)")}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">{t("Series title")}</span>
            <input
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder={t("Example: The Eruption Saga")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">{t("Arc order")}</span>
            <input
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="1"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </label>
        </div>
      </div>

      <SubmitRow loading={loading || coverPreparing} />
    </form>
  );
}
