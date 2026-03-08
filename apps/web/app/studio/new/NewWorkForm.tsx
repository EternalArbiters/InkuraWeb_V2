"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

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

const MAX_COVER_BYTES = 2 * 1024 * 1024;

export default function NewWorkForm({ genres, warningTags, deviantLoveTags }: Props) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
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
  const [translatorCredit, setTranslatorCredit] = React.useState("");
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

  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function onPickCover(file: File | null) {
    if (!file) {
      setCoverFile(null);
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setErr("Cover terlalu besar (max 2MB).");
      setCoverFile(null);
      return;
    }
    setErr(null);
    setCoverFile(file);
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

    if (!title.trim()) return setErr("Title wajib diisi.");
    if (!coverFile) return setErr("Cover wajib diupload (max 2MB).");

    if (needsSource) {
      if (!originalAuthorCredit.trim()) return setErr("Original author credit wajib diisi.");
      if (!sourceUrl.trim()) return setErr("Source URL wajib diisi.");
    }

    if (publishType === "REUPLOAD") {
      if (!originalTranslatorCredit.trim()) return setErr("Original translator credit wajib diisi untuk Reupload.");
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("type", type);
      fd.set("comicType", comicType);
      fd.set("language", (language || "other").trim().toLowerCase());
      fd.set("origin", origin);
      fd.set("completion", completion);
      fd.set("publishType", publishType);
      fd.set("isMature", isMature ? "true" : "false");
      fd.set("genreIds", JSON.stringify(genreIds));
      fd.set("warningTagIds", JSON.stringify(warningTagIds));
      fd.set("deviantLoveTagIds", JSON.stringify(isDeviantLove ? deviantLoveTagIds : []));
      fd.set("tags", JSON.stringify(tags));

      if (needsSource) {
        fd.set("originalAuthorCredit", originalAuthorCredit.trim());
        fd.set("sourceUrl", sourceUrl.trim());
        if (companyCredit.trim()) fd.set("companyCredit", companyCredit.trim());
      }
      if (publishType === "TRANSLATION") {
        if (translatorCredit.trim()) fd.set("translatorCredit", translatorCredit.trim());
      }
      if (publishType === "REUPLOAD") {
        fd.set("originalTranslatorCredit", originalTranslatorCredit.trim());
        if (uploaderNote.trim()) fd.set("uploaderNote", uploaderNote.trim());
      }
      if (seriesTitle.trim()) fd.set("seriesTitle", seriesTitle.trim());
      if (seriesOrder.trim()) fd.set("seriesOrder", seriesOrder.trim());

      fd.set("cover", coverFile);

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
        coverPreview={coverPreview}
        coverFile={coverFile}
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
        translatorCredit={translatorCredit}
        setTranslatorCredit={setTranslatorCredit}
        companyCredit={companyCredit}
        setCompanyCredit={setCompanyCredit}
        uploaderNote={uploaderNote}
        setUploaderNote={setUploaderNote}
      />

      <WorkBasicsCard
        title={title}
        setTitle={setTitle}
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
        isMature={isMature}
        setIsMature={setIsMature}
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
      <MultiSelectPicker
        title="Warnings"
        items={warningTags}
        selectedIds={warningTagIds}
        onChange={setWarningTagIds}
      />

      <DeviantLoveCard
        deviantLoveTags={deviantLoveTags}
        isDeviantLove={isDeviantLove}
        setIsDeviantLove={setIsDeviantLove}
        deviantLoveTagIds={deviantLoveTagIds}
        setDeviantLoveTagIds={setDeviantLoveTagIds}
      />

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="text-sm font-semibold">Series (optional)</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Use the same series title across works, then set the arc order.</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Series title</span>
            <input
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder="Example: The Eruption Saga"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Arc order</span>
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

      <SubmitRow loading={loading} />
    </form>
  );
}
