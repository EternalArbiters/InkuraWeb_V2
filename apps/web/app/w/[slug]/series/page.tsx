import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";
import { getWorkPageDataBySlug } from "@/server/services/works/workPage";

export const dynamic = "force-dynamic";

type SeriesWorkCard = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  seriesOrder?: number | null;
  type?: string | null;
  comicType?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  language?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
  chapterLoveCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | Date | null;
  genres?: { name?: string | null; slug?: string | null }[] | null;
  deviantLoveTags?: { name?: string | null; slug?: string | null }[] | null;
  author?: { username?: string | null; name?: string | null; image?: string | null } | null;
  translator?: { username?: string | null; name?: string | null; image?: string | null } | null;
};

function sortSeriesWorks(items: SeriesWorkCard[]) {
  return [...items].sort((a, b) => {
    const ao = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

export default async function WorkSeriesPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  const data = await getWorkPageDataBySlug(params.slug);
  if (!data.ok) return notFound();
  if (data.gated) return notFound();

  const work = data.work;
  const seriesTitle = String(work.seriesTitle || "").trim();
  if (!seriesTitle) return notFound();

  const allWorks = sortSeriesWorks([
    {
      id: work.id,
      slug: work.slug,
      title: work.title,
      coverImage: work.coverImage || null,
      seriesOrder: typeof work.seriesOrder === "number" ? work.seriesOrder : null,
      type: work.type,
      comicType: work.comicType,
      publishType: work.publishType,
      isMature: work.isMature,
      language: work.language,
      completion: work.completion,
      chapterCount: work.chapterCount,
      chapterLoveCount: work.chapterLoveCount,
      ratingAvg: work.ratingAvg,
      ratingCount: work.ratingCount,
      updatedAt: work.updatedAt,
      genres: work.genres,
      deviantLoveTags: work.deviantLoveTags,
      author: work.author,
      translator: work.translator,
    },
    ...((Array.isArray(work.seriesWorks) ? work.seriesWorks : []).map((item: any) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      coverImage: item.coverImage || null,
      seriesOrder: typeof item.seriesOrder === "number" ? item.seriesOrder : null,
      type: item.type,
      comicType: item.comicType,
      publishType: item.publishType,
      isMature: item.isMature,
      language: item.language,
      completion: item.completion,
      chapterCount: item.chapterCount,
      chapterLoveCount: item.chapterLoveCount,
      ratingAvg: item.ratingAvg,
      ratingCount: item.ratingCount,
      updatedAt: item.updatedAt,
      genres: item.genres,
      deviantLoveTags: item.deviantLoveTags,
      author: item.author,
      translator: item.translator,
    })) as any[]),
  ]);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex rounded-xl bg-black px-3 py-1 text-sm font-semibold text-white">More in this series</div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{seriesTitle}</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{allWorks.length} works, ordered by arc.</div>
          </div>
          <BackButton href={`/w/${work.slug}`} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {allWorks.map((item) => {
            const active = item.id === work.id;
            return (
              <InteractiveWorkCard
                key={item.id}
                work={item as any}
                topLeftBadge={typeof item.seriesOrder === "number" ? `Arc ${item.seriesOrder}` : null}
                bottomRightBadge={active ? "Current" : null}
                className={active ? "border-purple-500/70 dark:border-purple-500" : ""}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
