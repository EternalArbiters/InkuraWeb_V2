"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import TagMultiInput from "@/components/TagMultiInput";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";
import { presignAndUpload } from "@/lib/r2UploadClient";

type PublishType = "ORIGINAL" | "TRANSLATION" | "REUPLOAD";

type Work = {
  id: string;
  slug: string;
  title: string;
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
  translatorCredit?: string | null;
  companyCredit?: string | null;
  prevArcUrl?: string | null;
  nextArcUrl?: string | null;
  genres: { id: string; name: string; slug: string }[];
  warningTags: { id: string; name: string; slug: string }[];
  deviantLoveTags?: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

type WorkLite = { id: string; slug: string; title: string; type: string; status: string };

type Props = {
  work: Work;
  genres: PickerItem[];
  warningTags: PickerItem[];
  deviantLoveTags: PickerItem[];
};

function hrefForWorkSlug(slug: string) {
  return slug ? `/w/${slug}` : "";
}

export default function WorkEditForm({ work, genres, warningTags, deviantLoveTags }: Props) {
  const router = useRouter();

  // Normalize publishType to a non-optional string literal union so FormData.append is type-safe.
  const publishType: PublishType = ((work.publishType || "ORIGINAL").toUpperCase() as PublishType);
  const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

  const [title, setTitle] = React.useState(work.title);
  const [description, setDescription] = React.useState(work.description || "");
  const [type, setType] = React.useState<"NOVEL" | "COMIC">(work.type);
  const [comicType, setComicType] = React.useState<string>(work.comicType || "UNKNOWN");
  const [language, setLanguage] = React.useState((work.language || "other").toLowerCase() === "unknown" ? "other" : (work.language || "other"));
  const [origin, setOrigin] = React.useState(work.origin || "UNKNOWN");
  const [completion, setCompletion] = React.useState(work.completion || "ONGOING");
  const [isMature, setIsMature] = React.useState(!!work.isMature);

  const [originalAuthorCredit, setOriginalAuthorCredit] = React.useState(work.originalAuthorCredit || "");
  const [originalTranslatorCredit, setOriginalTranslatorCredit] = React.useState(work.originalTranslatorCredit || "");
  const [sourceUrl, setSourceUrl] = React.useState(work.sourceUrl || "");
  const [uploaderNote, setUploaderNote] = React.useState(work.uploaderNote || "");

  const [translatorCredit, setTranslatorCredit] = React.useState(work.translatorCredit || "");
  const [companyCredit, setCompanyCredit] = React.useState(work.companyCredit || "");

  const [prevArcUrl, setPrevArcUrl] = React.useState(work.prevArcUrl || "");
  const [nextArcUrl, setNextArcUrl] = React.useState(work.nextArcUrl || "");

  const [myWorks, setMyWorks] = React.useState<WorkLite[]>([]);
  const [loadingWorks, setLoadingWorks] = React.useState(false);

  const [genreIds, setGenreIds] = React.useState<string[]>(work.genres.map((g) => g.id));
  const [warningIds, setWarningIds] = React.useState<string[]>(work.warningTags.map((w) => w.id));
  const initialDeviantLoveIds = Array.isArray(work.deviantLoveTags) ? work.deviantLoveTags.map((d) => d.id) : [];
  const [deviantLoveTagIds, setDeviantLoveTagIds] = React.useState<string[]>(initialDeviantLoveIds);
  const [isDeviantLove, setIsDeviantLove] = React.useState<boolean>(initialDeviantLoveIds.length > 0);
  const [tags, setTags] = React.useState<string[]>(work.tags.map((t) => t.name));

  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [removeCover, setRemoveCover] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoadingWorks(true);
    fetch(`/api/studio/works`)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        const works = Array.isArray(j?.works) ? (j.works as any[]) : [];
        const lite = works
          .map((w) => ({ id: String(w.id), slug: String(w.slug || ""), title: String(w.title || ""), type: String(w.type || ""), status: String(w.status || "") }))
          .filter((w) => w.id && w.slug && w.id !== work.id);
        setMyWorks(lite);
      })
      .catch(() => null)
      .finally(() => mounted && setLoadingWorks(false));
    return () => {
      mounted = false;
    };
  }, [work.id]);

  function setPrevFromWorkId(id: string) {
    const w = myWorks.find((x) => x.id === id);
    if (!w) return;
    setPrevArcUrl(hrefForWorkSlug(w.slug));
  }

  function setNextFromWorkId(id: string) {
    const w = myWorks.find((x) => x.id === id);
    if (!w) return;
    setNextArcUrl(hrefForWorkSlug(w.slug));
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
      fd.append("description", description);
      fd.append("type", type);
      fd.append("comicType", type === "COMIC" ? comicType : "UNKNOWN");
      fd.append("language", language);
      fd.append("origin", origin);
      fd.append("completion", completion);
      fd.append("isMature", String(isMature));
      fd.append("genreIds", JSON.stringify(genreIds));
      fd.append("warningTagIds", JSON.stringify(warningIds));
      fd.append("deviantLoveTagIds", JSON.stringify(isDeviantLove ? deviantLoveTagIds : []));
      fd.append("tags", JSON.stringify(tags));
      fd.append("removeCover", String(removeCover));

      // credits
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
      if (publishType === "TRANSLATION") {
        fd.append("translatorCredit", translatorCredit);
      }

      // arcs
      fd.append("prevArcUrl", prevArcUrl.trim());
      fd.append("nextArcUrl", nextArcUrl.trim());

      if (coverFile && !removeCover) {
        const up = await presignAndUpload({ scope: "covers", file: coverFile, workId: work.id });
        fd.append("coverUrl", up.url);
        fd.append("coverKey", up.key);
      }

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
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-2">
        <div className="text-sm font-semibold">Publish type</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
        </div>
        <span className="inline-flex w-fit px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold bg-gray-50 dark:bg-gray-900">
          {publishType}
        </span>
      </div>

      {needsSource ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
          <div className="text-sm font-semibold">Credit & source</div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Original author credit (required)</span>
            <input value={originalAuthorCredit} onChange={(e) => setOriginalAuthorCredit(e.target.value)} className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
          </label>

          {publishType === "REUPLOAD" ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Original translator credit (required)</span>
              <input
                value={originalTranslatorCredit}
                onChange={(e) => setOriginalTranslatorCredit(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                placeholder="Contoh: Nama translator / group"
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Source URL (required)</span>
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
          </label>

          {publishType === "TRANSLATION" ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Translator credit (optional)</span>
              <input
                value={translatorCredit}
                onChange={(e) => setTranslatorCredit(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                placeholder="Contoh: Eternal Scans"
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Publisher (optional)</span>
            <input
              value={companyCredit}
              onChange={(e) => setCompanyCredit(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              placeholder="Contoh: Kakao, Naver, Shueisha, dll"
            />
          </label>

          {publishType === "REUPLOAD" ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Uploader note (optional)</span>
              <textarea value={uploaderNote} onChange={(e) => setUploaderNote(e.target.value)} rows={3} className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Series arcs (optional)</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Pilih dari karya yang kamu upload dulu. Kalau tidak ada, isi link external.</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-semibold">Previous arc</div>
            <select
              disabled={loadingWorks}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                setPrevFromWorkId(id);
              }}
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              defaultValue=""
            >
              <option value="">Pick from my works…</option>
              {myWorks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.type})
                </option>
              ))}
            </select>
            <input
              value={prevArcUrl}
              onChange={(e) => setPrevArcUrl(e.target.value)}
              placeholder="Or paste external link…"
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Next arc</div>
            <select
              disabled={loadingWorks}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                setNextFromWorkId(id);
              }}
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              defaultValue=""
            >
              <option value="">Pick from my works…</option>
              {myWorks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.type})
                </option>
              ))}
            </select>
            <input
              value={nextArcUrl}
              onChange={(e) => setNextArcUrl(e.target.value)}
              placeholder="Or paste external link…"
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
          </div>
        </div>
      </div>

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
            onChange={(e) => {
              const next = e.target.value as any;
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

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">18+ / Mature</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Viewer wajib opt-in 18+.</div>
          </div>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Summary</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
      </label>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Cover</div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
            Remove
          </label>
        </div>

        <div className="mt-3 grid grid-cols-[120px_1fr] gap-3 items-start">
          <div className="relative aspect-[3/4] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {work.coverImage && !removeCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.coverImage} alt={work.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No cover</div>
            )}
          </div>
          <div className="grid gap-2">
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="text-sm" />
            <div className="text-[11px] text-gray-600 dark:text-gray-300">Max 2MB. JPG/PNG/WebP.</div>
          </div>
        </div>
      </div>

      <MultiSelectPicker title="Genres" items={genres} selectedIds={genreIds} onChange={setGenreIds} />
      <MultiSelectPicker title="Warnings" items={warningTags} selectedIds={warningIds} onChange={setWarningIds} />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={isDeviantLove} onChange={(e) => setIsDeviantLove(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">Deviant Love</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Tag khusus (butuh unlock). Jika tidak dicentang, tag DL akan dihapus.</div>
          </div>
        </label>
        {isDeviantLove ? (
          <div className="mt-4">
            <MultiSelectPicker title="Deviant Love Tags" items={deviantLoveTags} selectedIds={deviantLoveTagIds} onChange={setDeviantLoveTagIds} />
          </div>
        ) : null}
      </div>

      <TagMultiInput label="Tags" value={tags} onChange={setTags} />

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
