"use client";

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

export default function CoverCard({
  coverPreview,
  coverName,
  coverBytes,
  coverOptimizationSummary,
  coverPreparing,
  onPickCover,
}: {
  coverPreview: string | null;
  coverName: string | null;
  coverBytes: number | null;
  coverOptimizationSummary: string | null;
  coverPreparing: boolean;
  onPickCover: (file: File | null) => void | Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">Cover</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Auto-optimized before upload. Target max 2MB. Format: JPG/PNG/WebP.
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
            onChange={(e) => void onPickCover(e.target.files?.[0] || null)}
            className="text-sm"
          />
          {coverPreparing ? (
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              Optimizing cover...
            </div>
          ) : coverName && coverBytes != null ? (
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              {coverName} • {formatBytes(coverBytes)}
            </div>
          ) : (
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              No cover yet.
            </div>
          )}
          {coverOptimizationSummary ? (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
              {coverOptimizationSummary}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
