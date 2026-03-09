"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFile, type PreparedUploadFile } from "@/lib/uploadOptimization";
import type { PickerItem } from "@/components/MultiSelectPicker";

import CreditsSourceFields from "./components/CreditsSourceFields";
import SubmitRow from "./components/SubmitRow";
import WorkArcFields from "./components/WorkArcFields";
import WorkBasicsFields from "./components/WorkBasicsFields";
import WorkCoverCard from "./components/WorkCoverCard";
import WorkPublishTypeCard from "./components/WorkPublishTypeCard";
import WorkSummaryField from "./components/WorkSummaryField";
import WorkTaxonomyFields from "./components/WorkTaxonomyFields";

type PublishType = "ORIGINAL" | "TRANSLATION" | "REUPLOAD";

type Work = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  type: "NOVEL" | "COMIC";
  comicType?: string;
  coverImage: string | null;
  language: string;
  origin: string;
  completion: string;
  isMature: boolean;
  publishType?: PublishType;
  originalAuthorCredit?: string | null;
  originalTranslatorCredit?: string | null;
  sourceUrl?: string | null;
  uploaderNote?: string | null;
  companyCredit?: string | null;
  prevArcUrl?: string | null;
  nextArcUrl?: string | null;
  seriesId?: string | null;
  seriesOrder?: number | null;
  series?: { id: string; title: string } | null;
  genres: { id: string; name: string; slug: string }[];
  warningTags: { id: string; name: string; slug: string }[];
  deviantLoveTags?: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

type Props = {
  work: Work;
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

export default function WorkEditForm({ work, genres, warningTags, deviantLoveTags }: Props) {
  const router = useRouter();

  const [publishType, setPublishType] = React.useState<PublishType>(((work.publishType || "ORIGINAL").toUpperCase() as PublishType));
  const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

  const [title, setTitle] = React.useState(work.title);
  const [subtitle, setSubtitle] = React.useState(work.subtitle || "");
  const [description, setDescription] = React.useState(work.description || "");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">(work.type);
  const [comicType, setComicType] = React.useState<string>(work.comicType || "UNKNOWN");
  const [language, setLanguage] = React.useState(
    (work.language || "other").toLowerCase() === "unknown" ? "other" : (work.language || "other")
  );
  const [origin, setOrigin] = React.useState(work.origin || "UNKNOWN");
  const [completion, setCompletion] = React.useState(work.completion || "ONGOING");
  const [isMature, setIsMature] = React.useState(!!work.isMature);

  const [originalAuthorCredit, setOriginalAuthorCredit] = React.useState(work.originalAuthorCredit || "");
  const [originalTranslatorCredit, setOriginalTranslatorCredit] = React.useState(work.originalTranslatorCredit || "");
  const [sourceUrl, setSourceUrl] = React.useState(work.sourceUrl || "");
  const [uploaderNote, setUploaderNote] = React.useState(work.uploaderNote || "");

  const [companyCredit, setCompanyCredit] = React.useState(work.companyCredit || "");

  const [seriesTitle, setSeriesTitle] = React.useState(work.series?.title || "");
  const [seriesOrder, setSeriesOrder] = React.useState(work.seriesOrder ? String(work.seriesOrder) : "");


  const [genreIds, setGenreIds] = React.useState<string[]>(work.genres.map((g) => g.id));
  const [warningIds, setWarningIds] = React.useState<string[]>(work.warningTags.map((w) => w.id));
  const initialDeviantLoveIds = Array.isArray(work.deviantLoveTags)
    ? work.deviantLoveTags.map((d) => d.id)
    : [];
  const [deviantLoveTagIds, setDeviantLoveTagIds] = React.useState<string[]>(initialDeviantLoveIds);
  const [isDeviantLove, setIsDeviantLove] = React.useState<boolean>(initialDeviantLoveIds.length > 0);
  const [tags, setTags] = React.useState<string[]>(work.tags.map((t) => t.name));

  const [coverPrepared, setCoverPrepared] = React.useState<PreparedUploadFile | null>(null);
  const [coverPreparing, setCoverPreparing] = React.useState(false);
  const [removeCover, setRemoveCover] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (coverPrepared?.previewUrl) URL.revokeObjectURL(coverPrepared.previewUrl);
    };
  }, [coverPrepared?.previewUrl]);

  React.useEffect(() => {
    if (!isMature && warningIds.length) setWarningIds([]);
  }, [isMature, warningIds.length]);

  async function onPickCover(file: File | null) {
    if (coverPrepared?.previewUrl) URL.revokeObjectURL(coverPrepared.previewUrl);
    if (!file) {
      setCoverPrepared(null);
      setCoverPreparing(false);
      return;
    }
    setCoverPreparing(true);
    setError(null);
    setRemoveCover(false);
    try {
      const prepared = await prepareUploadFile({ scope: "covers", file, makePreviewUrl: true });
      setCoverPrepared(prepared);
    } catch {
      setCoverPrepared(null);
      setError("Failed to process cover");
    } finally {
      setCoverPreparing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsSource) {
      if (!originalAuthorCredit.trim()) return setError("Original author credit is required");
      if (!sourceUrl.trim()) return setError("Source URL is required");
    }
    if (publishType === "REUPLOAD") {
      if (!originalTranslatorCredit.trim()) return setError("Original translator credit is required for Reupload");
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("subtitle", subtitle.trim());
      fd.append("description", description);
      fd.append("type", type);
      fd.append("comicType", type === "COMIC" ? comicType : "UNKNOWN");
      fd.append("language", language);
      fd.append("origin", origin);
      fd.append("completion", completion);
      fd.append("isMature", String(isMature));
      fd.append("genreIds", JSON.stringify(genreIds));
      fd.append("warningTagIds", JSON.stringify(isMature ? warningIds : []));
      fd.append("deviantLoveTagIds", JSON.stringify(isDeviantLove ? deviantLoveTagIds : []));
      fd.append("tags", JSON.stringify(tags));
      fd.append("removeCover", String(removeCover));

      fd.append("publishType", publishType);
      if (needsSource) {
        fd.append("originalAuthorCredit", originalAuthorCredit);
        fd.append("sourceUrl", sourceUrl);
        fd.append("companyCredit", companyCredit.trim());
      }
      if (publishType === "REUPLOAD") {
        fd.append("originalTranslatorCredit", originalTranslatorCredit);
        fd.append("uploaderNote", uploaderNote);
      }

      fd.append("seriesTitle", seriesTitle.trim());
      fd.append("seriesOrder", seriesOrder.trim());
      fd.append("prevArcUrl", "");
      fd.append("nextArcUrl", "");

      if (coverPrepared && !removeCover) {
        const up = await presignAndUpload({
          scope: "covers",
          file: coverPrepared.originalFile,
          preparedFile: coverPrepared,
          workId: work.id,
          optimizationVersion: "pr4-cover-opt-v1",
        });
        fd.append("coverUrl", up.url);
        fd.append("coverKey", up.key);
      }

      const res = await fetch(`/api/studio/works/${work.id}`, { method: "PATCH", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      router.push(`/studio/works/${work.id}`);
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

      <WorkPublishTypeCard publishType={publishType} setPublishType={setPublishType} />

      <CreditsSourceFields
        needsSource={needsSource}
        publishType={publishType}
        originalAuthorCredit={originalAuthorCredit}
        setOriginalAuthorCredit={setOriginalAuthorCredit}
        originalTranslatorCredit={originalTranslatorCredit}
        setOriginalTranslatorCredit={setOriginalTranslatorCredit}
        sourceUrl={sourceUrl}
        setSourceUrl={setSourceUrl}
        uploaderNote={uploaderNote}
        setUploaderNote={setUploaderNote}
        companyCredit={companyCredit}
        setCompanyCredit={setCompanyCredit}
      />

      <WorkArcFields
        seriesTitle={seriesTitle}
        setSeriesTitle={setSeriesTitle}
        seriesOrder={seriesOrder}
        setSeriesOrder={setSeriesOrder}
      />

      <WorkBasicsFields
        title={title}
        setTitle={setTitle}
        subtitle={subtitle}
        setSubtitle={setSubtitle}
        type={type}
        setType={setType}
        comicType={comicType}
        setComicType={setComicType}
        language={language}
        setLanguage={setLanguage}
        completion={completion}
        setCompletion={setCompletion}
        origin={origin}
        setOrigin={setOrigin}
      />

      <WorkSummaryField description={description} setDescription={setDescription} />

      <WorkCoverCard
        title={work.title}
        coverImage={removeCover ? null : (coverPrepared?.previewUrl || work.coverImage)}
        removeCover={removeCover}
        setRemoveCover={setRemoveCover}
        onPickCover={onPickCover}
        coverName={coverPrepared?.originalFile.name || null}
        coverBytes={coverPrepared?.optimizedBytes ?? null}
        coverOptimizationSummary={buildOptimizationSummary(coverPrepared)}
        coverPreparing={coverPreparing}
      />

      <WorkTaxonomyFields
        genres={genres}
        genreIds={genreIds}
        setGenreIds={setGenreIds}
        warningTags={warningTags}
        warningIds={warningIds}
        setWarningIds={setWarningIds}
        isMature={isMature}
        setIsMature={setIsMature}
        deviantLoveTags={deviantLoveTags}
        isDeviantLove={isDeviantLove}
        setIsDeviantLove={setIsDeviantLove}
        deviantLoveTagIds={deviantLoveTagIds}
        setDeviantLoveTagIds={setDeviantLoveTagIds}
        tags={tags}
        setTags={setTags}
      />

      <SubmitRow loading={loading || coverPreparing} />
    </form>
  );
}
