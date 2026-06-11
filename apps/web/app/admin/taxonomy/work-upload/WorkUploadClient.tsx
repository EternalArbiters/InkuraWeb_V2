"use client";

import * as React from "react";
import MultiSelectPicker, { type PickerItem } from "@/components/MultiSelectPicker";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFile, type PreparedUploadFile } from "@/lib/uploadOptimization";
import CoverCard from "@/app/studio/new/components/CoverCard";
import DeviantLoveCard from "@/app/studio/new/components/DeviantLoveCard";
import PublishTypeCard from "@/app/studio/new/components/PublishTypeCard";
import SubmitRow from "@/app/studio/new/components/SubmitRow";
import WorkBasicsCard from "@/app/studio/new/components/WorkBasicsCard";

type UserResult = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

type Props = {
  genres: PickerItem[];
  warningTags: PickerItem[];
  deviantLoveTags: PickerItem[];
  initialUser?: { id: string; username: string | null; name: string | null; image: string | null } | null;
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

export default function WorkUploadClient({ genres, warningTags, deviantLoveTags, initialUser }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [successWorkId, setSuccessWorkId] = React.useState<string | null>(null);

  // User selector
  const [userQuery, setUserQuery] = React.useState("");
  const [userResults, setUserResults] = React.useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<UserResult | null>(initialUser ?? null);
  const [userSearching, setUserSearching] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Work fields
  const [title, setTitle] = React.useState("");
  const [subtitles, setSubtitles] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">("NOVEL");
  const [comicType, setComicType] = React.useState<
    "UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER"
  >("UNKNOWN");
  const [language, setLanguage] = React.useState("other");
  const [origin, setOrigin] = React.useState<"UNKNOWN" | "ORIGINAL" | "FANFIC" | "ADAPTATION">("UNKNOWN");
  const [completion, setCompletion] = React.useState("ONGOING");

  const [publishType, setPublishType] = React.useState<"ORIGINAL" | "TRANSLATION" | "REUPLOAD">("ORIGINAL");
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

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        setUserResults(data.users || []);
      } finally {
        setUserSearching(false);
      }
    }, 300);
  }, [userQuery]);

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

    if (!selectedUser) return setErr("Pilih user terlebih dahulu.");
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
      fd.set("creatorUserId", selectedUser.id);
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

      const res = await fetch("/api/admin/works", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed");

      setSuccessWorkId(json?.work?.id || json?.workId || null);
      setTitle("");
      setSubtitles([]);
      setDescription("");
      setType("NOVEL");
      setComicType("UNKNOWN");
      setLanguage("other");
      setOrigin("UNKNOWN");
      setCompletion("ONGOING");
      setPublishType("ORIGINAL");
      setOriginalAuthorCredit("");
      setOriginalTranslatorCredit("");
      setSourceUrl("");
      setCompanyCredit("");
      setUploaderNote("");
      setSeriesTitle("");
      setSeriesOrder("");
      setIsMature(false);
      setIsDeviantLove(false);
      setGenreIds([]);
      setWarningTagIds([]);
      setDeviantLoveTagIds([]);
      setTags([]);
      setTagsRaw("");
      setCoverPrepared(null);
      setSelectedUser(null);
      setUserQuery("");
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  if (successWorkId) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="rounded-2xl border border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-950/40 px-5 py-4 text-sm text-green-700 dark:text-green-300">
          Karya berhasil dibuat sebagai DRAFT. User bisa melengkapi dan mempublish dari studio mereka.
        </div>
        <button
          type="button"
          onClick={() => setSuccessWorkId(null)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Upload karya lain
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={onSubmit} className="grid gap-4">
        {err ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
            {err}
          </div>
        ) : null}

        {/* User selector */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5">
          <div className="text-sm font-semibold mb-3">Upload atas nama user</div>
          {selectedUser ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">
                {selectedUser.image ? (
                  <img src={selectedUser.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (selectedUser.name || selectedUser.username || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{selectedUser.name || selectedUser.username}</div>
                {selectedUser.username && (
                  <div className="text-xs text-gray-500">@{selectedUser.username}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setUserQuery(""); }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Cari username atau nama..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              {(userResults.length > 0 || userSearching) && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                  {userSearching && (
                    <div className="px-3 py-2 text-xs text-gray-400">Mencari...</div>
                  )}
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setSelectedUser(u); setUserResults([]); setUserQuery(""); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">
                        {u.image ? (
                          <img src={u.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (u.name || u.username || "?").slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{u.name || u.username}</div>
                        {u.username && <div className="text-xs text-gray-500">@{u.username}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {publishType === "TRANSLATION"
              ? "User ini akan menjadi translatorId. Admin tercatat sebagai authorId."
              : "User ini akan menjadi authorId karya."}
          </p>
        </div>

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
          <div className="text-sm font-semibold">Series (optional)</div>
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

        <SubmitRow loading={loading || coverPreparing} />
      </form>
    </div>
  );
}
