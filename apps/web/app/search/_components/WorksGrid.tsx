import Link from "next/link";
import WorkCoverBadges from "../../components/WorkCoverBadges";

type Props = {
  works: any[];
  canViewMature: boolean;
};

export default function WorksGrid({ works, canViewMature }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {works.map((w: any) => {
        const blur = w.isMature && !canViewMature;
        const authorName = w.author?.name || w.author?.username || "Unknown";
        return (
          <Link
            key={w.id}
            href={`/w/${w.slug}`}
            className="group overflow-hidden rounded-[16px] border border-gray-200 bg-white/70 transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-[16px] bg-gray-100 dark:bg-gray-800">
              {w.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.coverImage}
                  alt={w.title}
                  className={`w-full h-full object-cover group-hover:scale-[1.02] transition ${blur ? "blur-md" : ""}`}
                />
              ) : null}
              <WorkCoverBadges
                work={{
                  type: w.type,
                  publishType: w.publishType,
                  isMature: !!w.isMature,
                  language: w.language,
                  comicType: w.comicType,
                  updatedAt: w.updatedAt,
                }}
              />
            </div>
            <div className="p-3">
              <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">Up by {authorName}</div>
              <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                {typeof w.chapterCount === "number" ? `${w.chapterCount} ch` : null}
                {w.completion ? ` • ${w.completion}` : ""}
                {w.language ? ` • ${String(w.language).toUpperCase()}` : ""}
              </div>
              <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                <span>{w.likeCount ?? 0}</span>
                <span>
                  ⭐ {(Math.round((w.ratingAvg ?? 0) * 10) / 10).toFixed(1)} ({w.ratingCount ?? 0})
                </span>
              </div>
              {Array.isArray(w.warningTags) && w.warningTags.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.warningTags.slice(0, 3).map((t: any) => (
                    <span
                      key={t.slug}
                      className="text-[10px] px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                    >
                      {t.name}
                    </span>
                  ))}
                  {w.warningTags.length > 3 ? (
                    <span className="text-[10px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                      +{w.warningTags.length - 3}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Link>
        );
      })}

      {works.length === 0 ? (
        <div className="col-span-2 md:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No results</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Coba keyword lain atau ganti filter.</p>
        </div>
      ) : null}
    </div>
  );
}
