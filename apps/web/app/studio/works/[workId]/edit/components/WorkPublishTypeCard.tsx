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
          <div className="font-semibold">Copyright warning</div>
          <div className="mt-1 text-sm">
            If the rights holder reports a copyright violation, you may be held responsible. To avoid harm to Inkura, readers, and yourself, you will be given
            <b> 1 week</b> after notification to remove the work. If it is not removed within that time, Inkura will remove it automatically.
          </div>
        </div>
      ) : null}
    </div> 
  );
}
