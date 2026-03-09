import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";

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
  translator?: { username?: string | null; name?: string | null; image?: string | null } | null;
  updatedAt?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
};

export default function WorksGrid({
  works,
  showRecentUpdateBadge = false,
}: {
  works: Work[];
  showRecentUpdateBadge?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {works.map((w) => (
        <InteractiveWorkCard key={w.id} work={w} showRecentUpdateBadge={showRecentUpdateBadge} />
      ))}

      {works.length === 0 ? (
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white/70 p-6 md:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="text-lg font-bold">No works</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no data to display yet.</p>
        </div>
      ) : null}
    </div>
  );
}
