"use client";

import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type WorkPreview = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
};

type PreviewEntry = { work?: WorkPreview | null } | WorkPreview | null;

type CollectionRailCardProps = {
  href: string;
  title: string;
  description?: string | null;
  itemCount?: number;
  items?: PreviewEntry[];
  layout?: "rail" | "stack";
};

function pickWork(entry: PreviewEntry) {
  if (!entry) return null;
  if (typeof entry === "object" && "work" in entry) return entry.work || null;
  return entry;
}

export default function CollectionRailCard({ href, title, description, itemCount = 0, items = [], layout = "rail" }: CollectionRailCardProps) {
  const t = useUILanguageText();
  const previews = items.map((entry) => pickWork(entry)).filter(Boolean).slice(0, 3) as WorkPreview[];

  return (
    <Link
      href={href}
      className={`${layout === "stack" ? "w-full" : "snap-start shrink-0 w-[240px] sm:w-[280px]"} overflow-hidden rounded-[22px] border border-gray-200/80 bg-white/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-[#08142e]/90`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</div>
          {description ? (
            <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{description}</div>
          ) : null}
        </div>
        <div className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">{itemCount} {t("Item") || "items"}</div>
      </div>

      {previews.length ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {previews.map((work, index) => (
            <div key={work.id || `${href}-${index}`} className="overflow-hidden rounded-[14px] border border-gray-200/70 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
              <div className="aspect-[3/4] overflow-hidden">
                {work.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.coverImage} alt={work.title || title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    {t("No cover") || "No cover"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-[16px] border border-dashed border-gray-300/90 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("Empty collection") || "Empty collection"}
        </div>
      )}
    </Link>
  );
}
