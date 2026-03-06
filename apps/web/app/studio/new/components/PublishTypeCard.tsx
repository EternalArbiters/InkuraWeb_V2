"use client";

export default function PublishTypeCard({
  publishType,
  setPublishType,
  originalAuthorCredit,
  setOriginalAuthorCredit,
  originalTranslatorCredit,
  setOriginalTranslatorCredit,
  sourceUrl,
  setSourceUrl,
  translatorCredit,
  setTranslatorCredit,
  companyCredit,
  setCompanyCredit,
  uploaderNote,
  setUploaderNote,
}: {
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD";
  setPublishType: (v: "ORIGINAL" | "TRANSLATION" | "REUPLOAD") => void;
  originalAuthorCredit: string;
  setOriginalAuthorCredit: (v: string) => void;
  originalTranslatorCredit: string;
  setOriginalTranslatorCredit: (v: string) => void;
  sourceUrl: string;
  setSourceUrl: (v: string) => void;
  translatorCredit: string;
  setTranslatorCredit: (v: string) => void;
  companyCredit: string;
  setCompanyCredit: (v: string) => void;
  uploaderNote: string;
  setUploaderNote: (v: string) => void;
}) {
  const needsSource = publishType !== "ORIGINAL";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="grid gap-1">
        <div className="text-sm font-semibold">Publish type</div>
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

      {needsSource ? (
        <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/40 p-4 text-sm">
          <div className="font-semibold">Peringatan hak cipta</div>
          <div className="mt-1 text-sm">
            Jika terjadi pelanggaran hak cipta, kamu bisa dipermasalahkan. Kamu akan diberikan waktu untuk menarik karya itu dalam
            <b> 1 minggu</b> setelah notifikasi diberikan. Jika tidak, karya akan dihapus otomatis oleh Inkura.
          </div>
        </div>
      ) : null}

      {needsSource ? (
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Original author credit (required)</label>
            <input
              value={originalAuthorCredit}
              onChange={(e) => setOriginalAuthorCredit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Contoh: Nama author asli / studio / dll"
            />
          </div>

          {publishType === "REUPLOAD" ? (
            <div className="grid gap-1">
              <label className="text-sm font-semibold">Original translator credit (required)</label>
              <input
                value={originalTranslatorCredit}
                onChange={(e) => setOriginalTranslatorCredit(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                placeholder="Contoh: Nama translator / group"
              />
            </div>
          ) : null}

          <div className="grid gap-1">
            <label className="text-sm font-semibold">Source URL (required)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Link source / raw / original posting"
            />
          </div>

          {publishType === "TRANSLATION" ? (
            <div className="grid gap-1">
              <label className="text-sm font-semibold">Translator credit (optional)</label>
              <input
                value={translatorCredit}
                onChange={(e) => setTranslatorCredit(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                placeholder="Contoh: Eternal Scans"
              />
            </div>
          ) : null}

          <div className="grid gap-1">
            <label className="text-sm font-semibold">Company / Publisher (optional)</label>
            <input
              value={companyCredit}
              onChange={(e) => setCompanyCredit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Contoh: Kakao, Naver, Shueisha, dll"
            />
          </div>

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
      ) : null}
    </div>
  );
}
