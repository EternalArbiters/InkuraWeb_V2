import Link from "next/link";
import WorkCoverBadges from "./WorkCoverBadges";

type Work = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  type?: string;
  publishType?: string | null;
  isMature?: boolean;
  language?: string | null;
  comicType?: string | null;
  likeCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
  author?: { username?: string | null; name?: string | null } | null;
  updatedAt?: string | null;
};

export default function WorksGrid({ works }: { works: Work[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {works.map((w) => {
        const authorName = w.author?.name || w.author?.username || "Unknown";
        return (
          <Link
            key={w.id}
            href={`/w/${w.slug}`}
            className="group overflow-hidden rounded-[10px] border border-gray-200 bg-white/70 transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
              {w.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
              ) : null}

              <WorkCoverBadges
                work={{
                  type: w.type,
                  publishType: w.publishType,
                  isMature: !!w.isMature,
                  language: w.language,
                  comicType: w.comicType,
                  updatedAt: (w as any).updatedAt,
                }}
              />
            </div>
            <div className="p-3">
              <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">Up by {authorName}</div>
              <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                <span>❤ {w.likeCount ?? 0}</span>
                <span>
                  ⭐ {(Math.round((w.ratingAvg ?? 0) * 10) / 10).toFixed(1)} ({w.ratingCount ?? 0})
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {works.length === 0 ? (
        <div className="col-span-2 md:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No works</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no data to display yet.</p>
        </div>
      ) : null}
    </div>
  );
}
