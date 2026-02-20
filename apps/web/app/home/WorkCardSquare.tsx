import Link from "next/link";

function typeBadgeClass(type?: string) {
  const t = (type || "").toUpperCase();
  if (t === "NOVEL") return "bg-blue-600 text-white";
  if (t === "COMIC") return "bg-red-600 text-white";
  return "bg-gray-700 text-white";
}

function publishTypeLabel(publishType?: string) {
  const p = (publishType || "").toUpperCase();
  if (p === "ORIGINAL") return "Original";
  if (p === "TRANSLATION") return "Translation";
  if (p === "REUPLOAD") return "Reupload";
  return null;
}

export default function WorkCardSquare({ work }: { work: any }) {
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";
  const type = String(work?.type || "");
  const publishType = publishTypeLabel(work?.publishType);

  return (
    <Link
      href={href}
      className="snap-start shrink-0 w-[160px] sm:w-[190px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
    >
      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {work?.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.coverImage} alt={work?.title || "cover"} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No cover</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <span className={`text-[10px] px-2 py-1 ${typeBadgeClass(type)}`}>{type || "WORK"}</span>
          {publishType ? <span className="text-[10px] px-2 py-1 bg-black/70 text-white">{publishType}</span> : null}
          {work?.isMature ? <span className="text-[10px] px-2 py-1 bg-black text-white">18+</span> : null}
        </div>
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold leading-snug line-clamp-2">{work?.title || "Untitled"}</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
          {work?.author?.name || work?.author?.username || ""}
          {work?.translator?.name || work?.translator?.username ? (
            <span className="opacity-80"> • TL: {work?.translator?.name || work?.translator?.username}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
