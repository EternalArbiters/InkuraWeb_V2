import Link from "next/link";
import type { ReactNode } from "react";

function row(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 border-b border-gray-100 py-2 dark:border-gray-800 md:grid-cols-[120px_minmax(0,1fr)]">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function textValue(value: ReactNode, preserveWrap = false) {
  return (
    <span className={preserveWrap ? "block whitespace-pre-wrap break-words" : "block max-w-full truncate md:whitespace-normal md:break-words"}>
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
    <div className="border border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="p-4">
        <div className="text-sm font-extrabold">Info</div>
        <div className="mt-3">
          {row(
            "Type",
            <div className="flex flex-wrap gap-2">
              <span className="border border-gray-200 px-2 py-1 text-xs dark:border-gray-800">{String(work?.type || "-")}</span>
              {work?.type === "COMIC" ? (
                <span className="border border-gray-200 px-2 py-1 text-xs dark:border-gray-800">{String(work?.comicType || "UNKNOWN")}</span>
              ) : null}
              {work?.isMature ? <span className="bg-black/70 px-2 py-1 text-xs text-white">18+</span> : null}
            </div>
          )}

          {row("Status", textValue(completion))}
          {row("Origin", textValue(origin))}
          {row("Language", textValue(language))}
          {row("Publish", textValue(publishType))}
          {row("Up by", textValue(uploader))}

          {translatorUser || translatorCredit ? row("Translator", textValue(translatorCredit || translatorUser)) : null}
          {work?.originalAuthorCredit ? row("Original author", textValue(work.originalAuthorCredit)) : null}
          {work?.originalTranslatorCredit ? row("Original translator", textValue(work.originalTranslatorCredit)) : null}
          {companyCredit ? row("Company", textValue(companyCredit)) : null}
          {work?.sourceUrl
            ? row(
                "Source",
                <Link className="block max-w-full truncate text-blue-700 underline dark:text-blue-300" href={work.sourceUrl} target="_blank" rel="noreferrer">
                  {work.sourceUrl}
                </Link>
              )
            : null}

          {work?.uploaderNote ? row("Note", textValue(work.uploaderNote, true)) : null}
          {row("Chapters", textValue(String(work?.chapterCount ?? 0)))}
          {row("Favorites", textValue(String(work?.likeCount ?? 0)))}
          {row("Rating", textValue(`${(Math.round(Number(work?.ratingAvg ?? 0) * 10) / 10).toFixed(1)} (${work?.ratingCount ?? 0})`))}
          {row("Updated", textValue(updatedLabel))}
        </div>
      </div>
    </div>
  );
}
