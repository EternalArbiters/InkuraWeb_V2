"use client";

export default function CoverCard({
  coverPreview,
  coverFile,
  onPickCover,
}: {
  coverPreview: string | null;
  coverFile: File | null;
  onPickCover: (file: File | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">Cover</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Max 2MB. Format: JPG/PNG/WebP.
      </div>
      <div className="grid md:grid-cols-[140px,1fr] gap-4 items-start">
        <div className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden aspect-[2/3]">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="cover preview"
              className="w-full h-full object-cover"
            />
          ) : null}
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
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              No cover yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
