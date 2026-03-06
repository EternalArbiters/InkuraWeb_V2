import Link from "next/link";
import type { ReactNode } from "react";

function row(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function ellipsisText(value: ReactNode, title?: string) {
  return (
    <span title={title} className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
      {value}
    </span>
  );
}

export default function WorkInfoPanel({ work }: { work: any }) {
  const uploader = work?.author?.name || work?.author?.username || "Unknown";
  const translatorUser = work?.translator?.name || work?.translator?.username || null;
  const translatorCredit = work?.translatorCredit || null;
  const companyCredit = work?.companyCredit || null;

  const publishType = String(work?.publishType || "ORIGINAL");
  const completion = String(work?.completion || "ONGOING");
  const origin = String(work?.origin || "UNKNOWN");
  const language = work?.language ? String(work.language).toUpperCase() : "UNKNOWN";

  const updated = work?.updatedAt ? new Date(work.updatedAt) : null;
  const updatedLabel = updated ? updated.toLocaleString() : "-";

  return (
    <div className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50">
      <div className="p-4">
        <div className="text-sm font-extrabold">Info</div>
        <div className="mt-3">
          {row("Type", (
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-800">{String(work?.type || "-")}</span>
              {work?.type === "COMIC" ? (
                <span className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-800">{String(work?.comicType || "UNKNOWN")}</span>
              ) : null}
              {work?.isMature ? <span className="px-2 py-1 text-xs bg-black/70 text-white">18+</span> : null}
            </div>
          ))}

          {row("Status", completion)}
          {row("Origin", ellipsisText(origin, origin))}
          {row("Language", ellipsisText(language, language))}
          {row("Publish", ellipsisText(publishType, publishType))}
          {row("Up by", ellipsisText(uploader, uploader))}

          {translatorUser || translatorCredit ? row("Translator", ellipsisText(translatorCredit || translatorUser, String(translatorCredit || translatorUser))) : null}

          {work?.originalAuthorCredit ? row("Original author", ellipsisText(work.originalAuthorCredit, work.originalAuthorCredit)) : null}

          {work?.originalTranslatorCredit ? row("Original translator", ellipsisText(work.originalTranslatorCredit, work.originalTranslatorCredit)) : null}
          {companyCredit ? row("Company", ellipsisText(companyCredit, companyCredit)) : null}
          {work?.sourceUrl ? row(
            "Source",
            <Link
              className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap underline text-blue-700 dark:text-blue-300"
              href={work.sourceUrl}
              target="_blank"
              rel="noreferrer"
              title={work.sourceUrl}
            >
              {work.sourceUrl}
            </Link>
          ) : null}

          {work?.uploaderNote ? row("Note", <span className="whitespace-pre-wrap">{work.uploaderNote}</span>) : null}

          {work?.prevArcUrl ? row(
            "Prev arc",
            <Link
              className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap underline text-blue-700 dark:text-blue-300"
              href={work.prevArcUrl}
              target="_blank"
              rel="noreferrer"
              title={work.prevArcUrl}
            >
              {work.prevArcUrl}
            </Link>
          ) : null}
          {work?.nextArcUrl ? row(
            "Next arc",
            <Link
              className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap underline text-blue-700 dark:text-blue-300"
              href={work.nextArcUrl}
              target="_blank"
              rel="noreferrer"
              title={work.nextArcUrl}
            >
              {work.nextArcUrl}
            </Link>
          ) : null}

          {row("Chapters", ellipsisText(String(work?.chapterCount ?? 0), String(work?.chapterCount ?? 0)))}
          {row("Favorites", ellipsisText(String(work?.likeCount ?? 0), String(work?.likeCount ?? 0)))}
          {row("Rating", ellipsisText(`${(Math.round(Number(work?.ratingAvg ?? 0) * 10) / 10).toFixed(1)} (${work?.ratingCount ?? 0})`, `${(Math.round(Number(work?.ratingAvg ?? 0) * 10) / 10).toFixed(1)} (${work?.ratingCount ?? 0})`))}
          {row("Updated", ellipsisText(updatedLabel, updatedLabel))}
        </div>
      </div>
    </div>
  );
}
