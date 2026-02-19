"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_COVER = 2 * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"NOVEL" | "COMIC" | "FILM">("NOVEL");
  const [genres, setGenres] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [postingRole, setPostingRole] = useState<"AUTHOR" | "TRANSLATOR" | "REUPLOADER">("AUTHOR");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copyrightNotice = useMemo(() => {
    if (postingRole === "AUTHOR") return null;
    return (
      <div className="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900 p-4 text-sm">
        <div className="font-semibold mb-1">Peringatan Hak Cipta</div>
        <p>
          Jika anda memilih role <span className="font-semibold">Translator</span> atau <span className="font-semibold">Reuploader</span>,
          pelanggaran hak cipta anda bisa dipermasalahkan. Anda akan diberikan waktu untuk menarik karya itu dalam
          <span className="font-semibold"> 1 minggu</span> setelah notifikasi diberikan. Jika tidak, karya akan dihapus otomatis oleh Inkura.
        </p>
      </div>
    );
  }, [postingRole]);

  const onPickCover = (file: File | null) => {
    setError(null);
    setCoverPreview(null);
    setCoverFile(null);

    if (!file) return;

    if (file.size > MAX_COVER) {
      setError("Cover maksimal 2MB");
      return;
    }

    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const submit = async () => {
    setError(null);

    if (!title.trim()) return setError("Judul wajib diisi");
    if (!description.trim()) return setError("Deskripsi wajib diisi");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("type", type);
      fd.set("genres", genres.trim());
      fd.set("nsfw", String(nsfw));
      fd.set("postingRole", postingRole);
      if (coverFile) fd.set("cover", coverFile);

      const res = await fetch("/api/works", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Gagal membuat karya");
        return;
      }

      router.push("/all");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-28 px-4 md:px-6 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Create New Work</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6">
        Role kamu cukup <span className="font-semibold">User</span> / <span className="font-semibold">Admin</span>. Role Author/Translator/Reuploader dipilih per karya.
      </p>

      <div className="grid gap-5">
        {/* Cover */}
        <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Cover</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Maksimal 2MB.</div>
            </div>
            <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white text-sm cursor-pointer">
              Pilih file
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickCover(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="mt-4">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="cover preview" className="w-full max-h-72 object-cover rounded-xl border" />
            ) : (
              <div className="w-full h-40 rounded-xl border border-dashed flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada cover
              </div>
            )}
          </div>
        </div>

        {/* Main form */}
        <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Judul</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Judul karya"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[110px]"
                placeholder="Sinopsis / deskripsi singkat"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white">Tipe</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="NOVEL">Novel</option>
                  <option value="COMIC">Comic</option>
                  <option value="FILM">Film</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white">Dipost sebagai</label>
                <select
                  value={postingRole}
                  onChange={(e) => setPostingRole(e.target.value as any)}
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="AUTHOR">Author</option>
                  <option value="TRANSLATOR">Translator</option>
                  <option value="REUPLOADER">Reuploader</option>
                </select>
              </div>
            </div>

            {copyrightNotice}

            {/* Genre + NSFW (rapi center) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-center text-center font-semibold text-gray-900 dark:text-white min-h-[28px]">
                  Genre
                </div>
                <div className="mt-3">
                  <input
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="contoh: fantasy, romance, drama"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Pisahkan dengan koma.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-center text-center font-semibold text-gray-900 dark:text-white min-h-[28px]">
                  NSFW / 18+
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setNsfw((v) => !v)}
                    className={`w-16 h-9 rounded-full flex items-center px-1 shadow-inner transition ${
                      nsfw ? "bg-gradient-to-r from-red-600 to-pink-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                    }`}
                    aria-label="Toggle NSFW"
                  >
                    <span className="w-7 h-7 rounded-full bg-white shadow" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Kalau belum centang 18+ di Settings, karya NSFW tidak akan muncul di halaman list.
                </p>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white font-semibold disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
