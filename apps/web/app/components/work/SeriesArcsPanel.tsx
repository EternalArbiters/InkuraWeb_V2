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

function ArcCard({ arc }: { arc: ArcLink }) {
  return (
    <Link
      href={arc.href}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/60 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30 dark:hover:bg-gray-900"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
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
  previousArc,
  nextArc,
}: {
  seriesTitle?: string | null;
  works?: SeriesWork[];
  currentWorkId: string;
  currentWorkSlug: string;
  previousArc?: ArcLink | null;
  nextArc?: ArcLink | null;
}) {
  const items = Array.isArray(works) ? works : [];
  const hasPanel = !!seriesTitle || items.length > 0 || previousArc || nextArc;
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

        {items.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const active = item.id === currentWorkId;
              return (
                <Link
                  key={item.id}
                  href={`/w/${item.slug}`}
                  className={`overflow-hidden rounded-2xl border transition ${
                    active
                      ? "border-purple-500/70 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/20"
                      : "border-gray-200 bg-white/80 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900"
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    ) : null}
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
