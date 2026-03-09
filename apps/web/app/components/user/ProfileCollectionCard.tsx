import Link from "next/link";

type WorkPreview = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
};

type CollectionLike = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  updatedAt: Date | string;
  itemCount?: number;
  _count?: { items?: number };
  items?: Array<{ work?: WorkPreview | null }>;
};

function formatUpdated(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PreviewCard({ listSlug, work }: { listSlug: string; work?: WorkPreview | null }) {
  return (
    <Link
      href={`/lists/${listSlug}`}
      className="w-[8.75rem] shrink-0 snap-start overflow-hidden rounded-[10px] border border-gray-200 bg-white/80 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900 sm:w-[9.25rem]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
        {work?.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.coverImage} alt={work.title || "Collection preview"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No cover</div>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{work?.title || "Open collection"}</div>
      </div>
    </Link>
  );
}

export default function ProfileCollectionCard({ list }: { list: CollectionLike }) {
  const itemCount = typeof list.itemCount === "number" ? list.itemCount : Number(list._count?.items || 0);
  const previews = Array.isArray(list.items) ? list.items.map((item) => item.work).filter(Boolean).slice(0, 5) : [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/30">
        <div className="inline-flex rounded-xl bg-black px-3 py-1 text-sm font-semibold text-white">Collection</div>
        <Link
          href={`/lists/${list.slug}`}
          className="mt-3 inline-flex text-2xl font-extrabold tracking-tight text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
        >
          {list.title}
        </Link>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Collection • {itemCount} work{itemCount === 1 ? "" : "s"}
        </div>
        {list.description ? (
          <div className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{list.description}</div>
        ) : null}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Updated {formatUpdated(list.updatedAt)}</div>

        {previews.length ? (
          <div className="mt-4 max-w-[20rem] overflow-hidden sm:max-w-[21rem] md:max-w-full">
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {previews.map((work, index) => (
                <PreviewCard key={work?.id || `${list.id}-${index}`} listSlug={list.slug} work={work} />
              ))}
            </div>
          </div>
        ) : (
          <Link
            href={`/lists/${list.slug}`}
            className="mt-4 flex min-h-28 items-center justify-center rounded-[10px] border border-dashed border-gray-300 text-sm font-medium text-gray-500 transition hover:bg-white/70 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/60"
          >
            Open collection
          </Link>
        )}
      </div>
    </section>
  );
}
