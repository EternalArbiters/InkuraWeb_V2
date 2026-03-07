import Link from "next/link";

type SeriesWork = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  seriesOrder?: number | null;
};

function MiniArcButton({
  label,
  work,
}: {
  label: string;
  work: SeriesWork | null | undefined;
}) {
  if (!work) return <div className="hidden md:block" />;

  return (
    <Link
      href={`/w/${work.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-950/40 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-900"
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 shrink-0">
        {work.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{work.title}</div>
      </div>
    </Link>
  );
}

export default function SeriesArcsPanel({ work }: { work: any }) {
  const series = work?.series;
  const items: SeriesWork[] = Array.isArray(series?.works) ? series.works : [];
  if (!series?.title || !items.length) return null;

  const currentId = String(work?.id || "");
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const previousArc = work?.previousArc || (currentIndex > 0 ? items[currentIndex - 1] : null);
  const nextArc = work?.nextArc || (currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null);

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4 md:p-5">
      <div className="inline-flex rounded-lg bg-black/70 px-3 py-1 text-sm font-semibold text-white">More in this series</div>
      <div className="mt-3 text-xl font-extrabold tracking-tight text-yellow-300">{series.title}</div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const active = item.id === currentId;
          return (
            <Link
              key={item.id}
              href={`/w/${item.slug}`}
              className={[
                "group overflow-hidden rounded-2xl border bg-white/30 dark:bg-gray-950/20",
                active
                  ? "border-purple-500/70 ring-1 ring-purple-500/60"
                  : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900",
              ].join(" ")}
            >
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                {item.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {typeof item.seriesOrder === "number" ? `Arc ${item.seriesOrder}` : "Series entry"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 md:items-start">
        <MiniArcButton label="Previous Arc" work={previousArc} />
        <MiniArcButton label="Next Arc" work={nextArc} />
      </div>
    </section>
  );
}
