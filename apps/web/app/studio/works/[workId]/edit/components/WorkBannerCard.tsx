"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

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

export default function WorkBannerCard({
  bannerImage,
  removeBanner,
  setRemoveBanner,
  onPickBanner,
  bannerName,
  bannerBytes,
  bannerOptimizationSummary,
  bannerPreparing,
}: {
  bannerImage: string | null;
  removeBanner: boolean;
  setRemoveBanner: (v: boolean) => void;
  onPickBanner: (f: File | null) => void | Promise<void>;
  bannerName: string | null;
  bannerBytes: number | null;
  bannerOptimizationSummary: string | null;
  bannerPreparing: boolean;
}) {
  const t = useUILanguageText();
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{t("Banner Image")}</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {t("Optional: Wide banner for the hero carousel (16:9 recommended).")}
          </div>
        </div>
        {(bannerImage || bannerName) && (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeBanner}
              onChange={(e) => setRemoveBanner(e.target.checked)}
            />
            {t("Remove banner")}
          </label>
        )}
      </div>

      <div className="mt-3 grid gap-3">
        <div className="relative aspect-video overflow-hidden rounded-[10px] border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          {bannerImage && !removeBanner ? (
            <img
              src={bannerImage}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
              {t("No banner")}
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onPickBanner(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <div className="text-[11px] text-gray-600 dark:text-gray-300">
            {t("Auto-optimized before upload. Target max 2MB. Format: JPG/PNG/WebP.")}
          </div>
          {bannerPreparing ? (
            <div className="text-[11px] text-gray-600 dark:text-gray-300">{t("Optimizing banner...")}</div>
          ) : null}
          {bannerName && bannerBytes != null ? (
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              {bannerName} • {formatBytes(bannerBytes)}
            </div>
          ) : null}
          {bannerOptimizationSummary ? (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300">{bannerOptimizationSummary}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
