import Link from "next/link";

type SeriesWork = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  seriesOrder?: number | null;
};

type ArcLink = {
  href: string;
  title: string;
  coverImage?: string | null;
  label: string;
};

function sortSeriesWorks(items: SeriesWork[]) {
  return [...items].sort((a, b) => {
    const ao = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

function pickNearbySeriesWorks(items: SeriesWork[], currentWorkId: string, limit = 5) {
  if (items.length <= limit) return items;
  const currentIndex = items.findIndex((item) => item.id === currentWorkId);
  if (currentIndex < 0) return items.slice(0, limit);

  let start = Math.max(0, currentIndex - Math.floor(limit / 2));
  let end = start + limit;
  if (end > items.length) {
    end = items.length;
    start = Math.max(0, end - limit);
  }
  return items.slice(start, end);
}

function ArcCard({ arc }: { arc: ArcLink }) {
  return (
    <Link
      href={arc.href}
      className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-white/60 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30 dark:hover:bg-gray-900"
    >
      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[8px] border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
        {arc.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arc.coverImage} alt={arc.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-500">ARC</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{arc.label}</div>
        <div className="truncate text-sm font-extrabold text-gray-900 dark:text-white">{arc.title}</div>
      </div>
    </Link>
  );
}

export default function SeriesArcsPanel({
  seriesTitle,
  works,
  currentWorkId,
  currentWorkSlug,
  currentWorkTitle,
  currentWorkCoverImage,
  currentWorkSeriesOrder,
  previousArc,
  nextArc,
}: {
  seriesTitle?: string | null;
  works?: SeriesWork[];
  currentWorkId: string;
  currentWorkSlug: string;
  currentWorkTitle: string;
  currentWorkCoverImage?: string | null;
  currentWorkSeriesOrder?: number | null;
  previousArc?: ArcLink | null;
  nextArc?: ArcLink | null;
}) {
  const otherItems = Array.isArray(works) ? works : [];
  const allSeriesItems = sortSeriesWorks([
    {
      id: currentWorkId,
      slug: currentWorkSlug,
      title: currentWorkTitle,
      coverImage: currentWorkCoverImage || null,
      seriesOrder: typeof currentWorkSeriesOrder === "number" ? currentWorkSeriesOrder : null,
    },
    ...otherItems.filter((item) => item.id !== currentWorkId),
  ]);

  const nearbyItems = pickNearbySeriesWorks(allSeriesItems, currentWorkId, 5);
  const hasPanel = !!seriesTitle || nearbyItems.length > 1 || previousArc || nextArc;
  if (!hasPanel) return null;

  const titleNode = seriesTitle ? (
    <Link
      href={`/w/${currentWorkSlug}/series`}
      className="mt-3 inline-flex text-2xl font-extrabold tracking-tight text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
    >
      {seriesTitle}
    </Link>
  ) : (
    <div className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Series</div>
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/30">
        <div className="inline-flex rounded-xl bg-black px-3 py-1 text-sm font-semibold text-white">More in this series</div>
        {titleNode}

        {nearbyItems.length ? (
          <div className="mt-4 max-w-[20rem] overflow-hidden sm:max-w-[21rem]">
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nearbyItems.map((item) => {
                const active = item.id === currentWorkId;
                return (
                  <Link
                    key={item.id}
                    href={`/w/${item.slug}`}
                    className={`w-[9.25rem] shrink-0 snap-start overflow-hidden rounded-[10px] border transition sm:w-[9.75rem] ${
                      active
                        ? "border-purple-500/70 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/20"
                        : "border-gray-200 bg-white/80 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900"
                    }`}
                  >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No cover</div>
                    )}
                    {typeof item.seriesOrder === "number" ? (
                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                        Arc {item.seriesOrder}
                      </div>
                    ) : null}
                    {active ? (
                      <div className="absolute bottom-2 right-2 rounded-full bg-purple-600 px-2 py-1 text-[10px] font-bold text-white">Current</div>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                  </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {previousArc || nextArc ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {previousArc ? <ArcCard arc={previousArc} /> : <div className="hidden sm:block" />}
            {nextArc ? <ArcCard arc={nextArc} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
