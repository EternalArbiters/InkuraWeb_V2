import Link from "next/link";

type WorkPreview = {
  id?: string;
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

function CoverTile({ work, className }: { work?: WorkPreview | null; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800 ${className || ""}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {work?.coverImage ? (
        <img src={work.coverImage} alt={work.title || "Collection preview"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          No cover
        </div>
      )}
    </div>
  );
}

export default function ProfileCollectionCard({ list }: { list: CollectionLike }) {
  const itemCount = typeof list.itemCount === "number" ? list.itemCount : Number(list._count?.items || 0);
  const previews = Array.isArray(list.items) ? list.items.map((item) => item.work).filter(Boolean) : [];
  const lead = previews[0];
  const sideOne = previews[1];
  const sideTwo = previews[2];

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block rounded-[24px] border border-gray-200 bg-white/70 p-4 transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xl font-extrabold tracking-tight">{list.title}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">Collection • {itemCount} work{itemCount === 1 ? "" : "s"}</div>
        </div>
        <span className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[88px_minmax(0,1fr)_56px] gap-3 sm:grid-cols-[104px_minmax(0,1fr)_72px]">
        <CoverTile work={lead} className="aspect-[3/4]" />

        <div className="min-w-0 py-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
            {lead?.title || "Open this collection"}
          </div>
          {list.description ? (
            <div className="mt-2 line-clamp-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {list.description}
            </div>
          ) : (
            <div className="mt-2 line-clamp-4 text-sm text-gray-500 dark:text-gray-400">
              A curated collection of works shared on this profile.
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Updated {formatUpdated(list.updatedAt)}</div>
        </div>

        <div className="flex flex-col gap-2">
          <CoverTile work={sideOne} className="aspect-[3/4]" />
          <CoverTile work={sideTwo} className="aspect-[3/4]" />
        </div>
      </div>
    </Link>
  );
}
