import Link from "next/link";
import WorkCoverBadges from "./WorkCoverBadges";
import UploaderIdentityLink from "@/app/components/UploaderIdentityLink";

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
  author?: { username?: string | null; name?: string | null; image?: string | null } | null;
  updatedAt?: string | null;
};

export default function WorksGrid({ works }: { works: Work[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {works.map((w) => {
        return (
          <div
            key={w.id}
            className="group overflow-hidden rounded-[10px] border border-gray-200 bg-white/70 transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50"
          >
            <Link href={`/w/${w.slug}`} className="block">
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
              <div className="p-3 pb-0">
                <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
              </div>
            </Link>
            <div className="px-3 pt-2">
              <UploaderIdentityLink user={w.author} className="w-full" textClassName="text-xs text-gray-600 dark:text-gray-300" />
            </div>
            <div className="p-3 pt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
              <span>❤ {w.likeCount ?? 0}</span>
              <span>
                ⭐ {(Math.round((w.ratingAvg ?? 0) * 10) / 10).toFixed(1)} ({w.ratingCount ?? 0})
              </span>
            </div>
          </div>
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
