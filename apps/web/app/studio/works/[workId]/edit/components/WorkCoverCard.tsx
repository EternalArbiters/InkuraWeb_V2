"use client";

export default function WorkCoverCard({
  title,
  coverImage,
  removeCover,
  setRemoveCover,
  setCoverFile,
}: {
  title: string;
  coverImage: string | null;
  removeCover: boolean;
  setRemoveCover: (v: boolean) => void;
  setCoverFile: (f: File | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Cover</div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={removeCover}
            onChange={(e) => setRemoveCover(e.target.checked)}
          />
          Remove
        </label>
      </div>

      <div className="mt-3 grid grid-cols-[120px_1fr] gap-3 items-start">
        <div className="relative aspect-[3/4] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {coverImage && !removeCover ? (
            <img
              src={coverImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
              No cover
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <div className="text-[11px] text-gray-600 dark:text-gray-300">
            Max 2MB. JPG/PNG/WebP.
          </div>
        </div>
      </div>
    </div>
  );
}
