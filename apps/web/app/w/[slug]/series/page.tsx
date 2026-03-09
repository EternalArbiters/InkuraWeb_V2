import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import { getWorkPageDataBySlug } from "@/server/services/works/workPage";

export const dynamic = "force-dynamic";

type SeriesWorkCard = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  seriesOrder?: number | null;
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
    },
    ...((Array.isArray(work.seriesWorks) ? work.seriesWorks : []).map((item: any) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      coverImage: item.coverImage || null,
      seriesOrder: typeof item.seriesOrder === "number" ? item.seriesOrder : null,
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
              <Link
                key={item.id}
                href={`/w/${item.slug}`}
                className={`overflow-hidden rounded-[16px] border transition ${
                  active
                    ? "border-purple-500/70 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/20"
                    : "border-gray-200 bg-white/80 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[16px] bg-gray-100 dark:bg-gray-800">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                  ) : null}
                  {typeof item.seriesOrder === "number" ? (
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">Arc {item.seriesOrder}</div>
                  ) : null}
                  {active ? (
                    <div className="absolute bottom-2 right-2 rounded-full bg-purple-600 px-2 py-1 text-[10px] font-bold text-white">Current</div>
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
