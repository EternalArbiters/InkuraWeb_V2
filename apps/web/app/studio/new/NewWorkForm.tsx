"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

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
  const [comicType, setComicType] = React.useState<"UNKNOWN" | "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "WESTERN" | "OTHER">("UNKNOWN");
  const [language, setLanguage] = React.useState("unknown");
  const [origin, setOrigin] = React.useState("UNKNOWN");
  const [completion, setCompletion] = React.useState("ONGOING");

  const [publishType, setPublishType] = React.useState<"ORIGINAL" | "TRANSLATION" | "REUPLOAD">("ORIGINAL");
  const [originalAuthorCredit, setOriginalAuthorCredit] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [uploaderNote, setUploaderNote] = React.useState("");

  const [isMature, setIsMature] = React.useState(false);
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

  const needsCredit = publishType === "TRANSLATION";
  const needsSource = publishType === "TRANSLATION" || publishType === "REUPLOAD";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!title.trim()) {
      setErr("Title wajib diisi.");
      return;
    }
    if (!coverFile) {
      setErr("Cover wajib diupload (max 2MB).");
      return;
    }
    if (needsCredit && !originalAuthorCredit.trim()) {
      setErr("Original author credit wajib diisi untuk Translation.");
      return;
    }
    if (needsSource && !sourceUrl.trim()) {
      setErr("Source URL wajib diisi untuk Translation / Reupload.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("type", type);
      fd.set("comicType", comicType);
      fd.set("language", language.trim().toLowerCase() || "unknown");
      fd.set("origin", origin);
      fd.set("completion", completion);
      fd.set("publishType", publishType);
      fd.set("isMature", isMature ? "true" : "false");
      fd.set("genreIds", JSON.stringify(genreIds));
      fd.set("warningTagIds", JSON.stringify(warningTagIds));
      fd.set("deviantLoveTagIds", JSON.stringify(deviantLoveTagIds));
      fd.set("tags", JSON.stringify(tags));

      if (publishType !== "ORIGINAL") {
        fd.set("sourceUrl", sourceUrl.trim());
      }
      if (publishType === "TRANSLATION") {
        fd.set("originalAuthorCredit", originalAuthorCredit.trim());
      }
      if (publishType === "REUPLOAD" && uploaderNote.trim()) {
        fd.set("uploaderNote", uploaderNote.trim());
      }

      fd.set("cover", coverFile);

      const res = await fetch("/api/studio/works", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed");
      router.push(`/studio/works/${json?.work?.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Cover (wajib)</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Max 2MB. Format: JPG/PNG/WebP.</div>
        <div className="grid md:grid-cols-[180px,1fr] gap-4 items-start">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden aspect-[2/3]">
            {coverPreview ? <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="grid gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickCover(e.target.files?.[0] || null)}
              className="text-sm"
            />
            {coverFile ? (
              <div className="text-[11px] text-gray-600 dark:text-gray-300">
                {coverFile.name} • {(coverFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            ) : (
              <div className="text-[11px] text-gray-600 dark:text-gray-300">Belum ada cover.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="grid gap-1">
          <div className="text-sm font-semibold">Publish type (per karya)</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Pilih tiap kali kamu post karya (bukan role akun).</div>
        </div>

        <select
          value={publishType}
          onChange={(e) => setPublishType(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
        >
          <option value="ORIGINAL">Original (Author)</option>
          <option value="TRANSLATION">Translation (Translator)</option>
          <option value="REUPLOAD">Reupload (Reuploader)</option>
        </select>

        {publishType !== "ORIGINAL" ? (
          <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/40 p-4 text-sm">
            <div className="font-semibold">Peringatan hak cipta</div>
            <div className="mt-1 text-sm">
              Jika terjadi pelanggaran hak cipta, kamu bisa dipermasalahkan. Kamu akan diberikan waktu untuk menarik karya itu dalam
              <b> 1 minggu</b> setelah notifikasi diberikan. Jika tidak, karya akan dihapus otomatis oleh Inkura.
            </div>
          </div>
        ) : null}

        {needsCredit ? (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Original author credit (wajib)</label>
            <input
              value={originalAuthorCredit}
              onChange={(e) => setOriginalAuthorCredit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Contoh: Nama author asli / studio / dll"
            />
          </div>
        ) : null}

        {needsSource ? (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Source URL (wajib)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Link source / raw / original posting"
            />
          </div>
        ) : null}

        {publishType === "REUPLOAD" ? (
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Catatan (opsional)</label>
            <textarea
              value={uploaderNote}
              onChange={(e) => setUploaderNote(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm min-h-[88px]"
              placeholder="Contoh: alasan reupload, info tambahan, dsb"
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Judul karya"
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
          <label className="text-sm font-semibold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm min-h-[92px]"
            placeholder="Sinopsis / ringkasan"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Language</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="en / id / jp / ..."
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Origin</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
            >
              <option value="UNKNOWN">Unknown</option>
              <option value="JP">JP</option>
              <option value="KR">KR</option>
              <option value="CN">CN</option>
              <option value="ID">ID</option>
              <option value="US">US</option>
              <option value="OTHER">Other</option>
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
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
          <span className="text-sm font-semibold">18+ / NSFW (mature)</span>
        </label>

        <div className="grid gap-1">
          <label className="text-sm font-semibold">Tags (comma separated)</label>
          <input
            value={tagsRaw}
            onChange={(e) => syncTags(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
            placeholder="romance, action, school life"
          />
          <div className="text-[11px] text-gray-600 dark:text-gray-300">Max 25 tags.</div>
        </div>
      </div>

      <MultiSelectPicker title="Genres" subtitle="Pilih genre yang cocok." items={genres} selectedIds={genreIds} onChange={setGenreIds} />
      <MultiSelectPicker
        title="NSFW tags"
        subtitle="Tag sensitif/NSFW. (Konten mature akan disembunyikan untuk user yang belum unlock 18+.)"
        items={warningTags}
        selectedIds={warningTagIds}
        onChange={setWarningTagIds}
      />

      <MultiSelectPicker
        title="Deviant Love tags"
        subtitle="Tag Deviant Love (locked by default for readers; requires 18+ + Deviant Love unlock)."
        items={deviantLoveTags}
        selectedIds={deviantLoveTagIds}
        onChange={setDeviantLoveTagIds}
      />

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
