import Link from "next/link";
import type { ReactNode } from "react";

function row(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</div>
      <div className="text-sm text-gray-900 dark:text-white break-words">{value}</div>
    </div>
  );
}

export default function WorkInfoPanel({ work }: { work: any }) {
  const uploader = work?.author?.name || work?.author?.username || "Unknown";
  const translatorUser = work?.translator?.name || work?.translator?.username || null;

  const publishType = String(work?.publishType || "ORIGINAL").toUpperCase();
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
          {row("Origin", origin)}
          {row("Language", language)}
          {row("Publish", publishType)}

          {/* Uploader credit depends on publishType */}
          {publishType === "TRANSLATION"
            ? row("Translator", uploader)
            : publishType === "REUPLOAD"
            ? row("Reuploader", uploader)
            : row("Author", uploader)}

          {/* Manual credits (non-original) */}
          {publishType !== "ORIGINAL" && work?.originalAuthorCredit ? row("Original author", work.originalAuthorCredit) : null}
          {publishType === "TRANSLATION" ? (
            work?.translatorCredit ? row("Translator credit", work.translatorCredit) : translatorUser ? row("Translator credit", translatorUser) : null
          ) : null}
          {publishType !== "ORIGINAL" && work?.companyCredit ? row("Company", work.companyCredit) : null}

          {publishType !== "ORIGINAL" && work?.sourceUrl
            ? row(
                "Source",
                <Link
                  className="underline text-blue-700 dark:text-blue-300 block truncate"
                  href={work.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={work.sourceUrl}
                >
                  {work.sourceUrl}
                </Link>
              )
            : null}

          {publishType === "REUPLOAD" && work?.uploaderNote ? row("Note", <span className="whitespace-pre-wrap">{work.uploaderNote}</span>) : null}

          {(work?.prevArcUrl || work?.nextArcUrl) ? row(
            "Arc",
            <div className="flex flex-wrap gap-2">
              {work?.prevArcUrl ? (
                <Link className="underline text-blue-700 dark:text-blue-300 truncate max-w-full" href={work.prevArcUrl} target={/^https?:\/\//i.test(work.prevArcUrl) ? "_blank" : undefined} rel="noreferrer" title={work.prevArcUrl}>
                  Previous Arc
                </Link>
              ) : null}
              {work?.nextArcUrl ? (
                <Link className="underline text-blue-700 dark:text-blue-300 truncate max-w-full" href={work.nextArcUrl} target={/^https?:\/\//i.test(work.nextArcUrl) ? "_blank" : undefined} rel="noreferrer" title={work.nextArcUrl}>
                  Next Arc
                </Link>
              ) : null}
            </div>
          ) : null}

          {row("Chapters", String(work?.chapterCount ?? 0))}
          {row("Favorites", String(work?.likeCount ?? 0))}
          {row("Rating", `${(Math.round(Number(work?.ratingAvg ?? 0) * 10) / 10).toFixed(1)} (${work?.ratingCount ?? 0})`)}
          {row("Updated", updatedLabel)}
        </div>
      </div>
    </div>
  );
}
