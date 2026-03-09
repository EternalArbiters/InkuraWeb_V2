import Link from "next/link";
import WorkCoverBadges from "../components/WorkCoverBadges";

export default function WorkCardSquare({ work }: { work: any }) {
  const href = work?.slug ? `/w/${work.slug}` : work?.id ? `/work/${work.id}` : "#";

  return (
    <Link
      href={href}
      className="snap-start shrink-0 w-[160px] sm:w-[190px] overflow-hidden rounded-[16px] border border-gray-200 bg-white transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[16px] bg-gray-100 dark:bg-gray-800">
        {work?.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.coverImage} alt={work?.title || "cover"} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No cover</div>
        )}

        <WorkCoverBadges
          work={{
            type: work?.type,
            publishType: work?.publishType,
            isMature: !!work?.isMature,
            language: work?.language,
            comicType: work?.comicType,
            updatedAt: work?.updatedAt,
          }}
        />
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold leading-snug line-clamp-2">{work?.title || "Untitled"}</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">Up by {work?.author?.name || work?.author?.username || "Unknown"}</div>
      </div>
    </Link>
  );
}
