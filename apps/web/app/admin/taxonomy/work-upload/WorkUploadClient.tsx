"use client";

import { useState, useRef, useEffect } from "react";

type UserResult = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

const LANGUAGES = [
  { value: "id", label: "Indonesian 🇮🇩" },
  { value: "en", label: "English 🇬🇧" },
  { value: "ja", label: "Japanese 🇯🇵" },
  { value: "zh", label: "Chinese 🇨🇳" },
  { value: "ko", label: "Korean 🇰🇷" },
  { value: "unknown", label: "Unknown" },
];

export default function WorkUploadClient() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"COMIC" | "NOVEL">("COMIC");
  const [publishType, setPublishType] = useState<"ORIGINAL" | "TRANSLATION" | "REUPLOAD">("ORIGINAL");
  const [language, setLanguage] = useState("unknown");
  const [description, setDescription] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [userSearching, setUserSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; slug?: string; error?: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (userQuery.length < 2) { setUserResults([]); return; }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, publishType, language, creatorUserId: selectedUser.id, description }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, slug: data.slug });
        setTitle(""); setDescription(""); setSelectedUser(null); setUserQuery("");
      } else {
        setResult({ ok: false, error: data.error || "Failed" });
      }
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const publishTypeHint: Record<string, string> = {
    ORIGINAL: "authorId = user yang dipilih",
    TRANSLATION: "translatorId = user yang dipilih, authorId = admin",
    REUPLOAD: "authorId = user yang dipilih",
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5">
        <h2 className="text-base font-semibold mb-4">Upload karya atas nama user</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Creator user search */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
              Creator (user pemilik karya)
            </label>
            {selectedUser ? (
              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{selectedUser.name || selectedUser.username}</div>
                  {selectedUser.username && <div className="text-xs text-neutral-500">@{selectedUser.username}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setUserQuery(""); }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
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
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {(userResults.length > 0 || userSearching) && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                    {userSearching && (
                      <div className="px-3 py-2 text-xs text-neutral-400">Mencari...</div>
                    )}
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedUser(u); setUserResults([]); setUserQuery(""); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">
                          {u.image
                            ? <img src={u.image} alt="" className="h-full w-full object-cover" />
                            : (u.name || u.username || "?").slice(0, 1).toUpperCase()
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.name || u.username}</div>
                          {u.username && <div className="text-xs text-neutral-500">@{u.username}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
              Judul karya
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Type + PublishType */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "COMIC" | "NOVEL")}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
              >
                <option value="COMIC">Comic</option>
                <option value="NOVEL">Novel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">Publish type</label>
              <select
                value={publishType}
                onChange={(e) => setPublishType(e.target.value as "ORIGINAL" | "TRANSLATION" | "REUPLOAD")}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
              >
                <option value="ORIGINAL">Original</option>
                <option value="TRANSLATION">Translation</option>
                <option value="REUPLOAD">Re-upload</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-400 -mt-2">{publishTypeHint[publishType]}</p>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">Bahasa</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
              Deskripsi <span className="font-normal normal-case">(opsional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sinopsis singkat..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedUser || !title.trim()}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? "Membuat karya..." : "Buat karya (DRAFT)"}
          </button>
        </form>
      </div>

      {result && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${result.ok ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40 text-green-700 dark:text-green-300" : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}>
          {result.ok
            ? <>Karya berhasil dibuat sebagai DRAFT. Slug: <strong>{result.slug}</strong>. User bisa melengkapi detail di studio mereka.</>
            : <>Gagal: {result.error}</>
          }
        </div>
      )}

      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
        <strong>Catatan:</strong> Karya dibuat berstatus DRAFT. User yang dipilih akan menjadi author/translator-nya. Admin tercatat sebagai uploader di <code>uploadedByAdminId</code> untuk audit trail.
      </div>
    </div>
  );
}
