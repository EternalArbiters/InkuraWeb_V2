"use client";

const LABELS: Record<string, string> = {
  ORIGINAL: "Original (Author)",
  TRANSLATION: "Translation (Translator)",
  REUPLOAD: "Reupload (Reuploader)",
};

export default function WorkPublishTypeCard({
  publishType,
  setPublishType,
}: {
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD";
  setPublishType: (v: "ORIGINAL" | "TRANSLATION" | "REUPLOAD") => void;
}) {
  const needsSource = publishType !== "ORIGINAL";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">Publish type</div>

      <select
        value={publishType}
        onChange={(e) => setPublishType(e.target.value as "ORIGINAL" | "TRANSLATION" | "REUPLOAD")}
        className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="ORIGINAL">{LABELS.ORIGINAL}</option>
        <option value="TRANSLATION">{LABELS.TRANSLATION}</option>
        <option value="REUPLOAD">{LABELS.REUPLOAD}</option>
      </select>

      {needsSource ? (
        <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/40 p-4 text-sm">
          <div className="font-semibold">Peringatan hak cipta</div>
          <div className="mt-1 text-sm">
            Jika pemilik karya melaporkan adanya pelanggaran hak cipta, kamu bisa dipermasalahkan. Untuk menghindari kerugian yang diterima Inkura, pembaca dan dirimu sendiri. Kamu akan diberikan waktu untuk menarik karya itu dalam
            <b> 1 minggu</b> setelah notifikasi diberikan. Jika dalam waktu itu, karya tidak di hapus, karya akan dihapus otomatis oleh Inkura.
          </div>
        </div>
      ) : null}
    </div>
  );
}
