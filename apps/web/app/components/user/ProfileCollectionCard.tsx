import Link from "next/link";
import { cache } from "react";

import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

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
  itemCount?: number;
  _count?: { items?: number };
  items?: Array<{ work?: WorkPreview | null }>;
};

const getCollectionLabels = cache(async () => ({
  noCover: await getActiveUILanguageText("No cover"),
  openCollection: await getActiveUILanguageText("Open collection"),
}));

function PreviewCard({
  listSlug,
  work,
  noCoverLabel,
  openCollectionLabel,
}: {
  listSlug: string;
  work?: WorkPreview | null;
  noCoverLabel: string;
  openCollectionLabel: string;
}) {
  return (
    <Link
      href={`/lists/${listSlug}`}
      className="w-[8.25rem] shrink-0 snap-start overflow-hidden rounded-[10px] border border-gray-200/80 bg-white/70 transition hover:border-purple-400/60 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-900"
      aria-label={openCollectionLabel}
      title={openCollectionLabel}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
        {work?.coverImage ? (
          <img src={work.coverImage} alt={work.title || noCoverLabel} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            {noCoverLabel}
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function ProfileCollectionCard({ list }: { list: CollectionLike }) {
  const labels = await getCollectionLabels();
  const itemCount = typeof list.itemCount === "number" ? list.itemCount : Number(list._count?.items || 0);
  const previews = Array.isArray(list.items) ? list.items.map((item) => item.work).filter(Boolean).slice(0, 5) : [];
  const openCollectionText = itemCount > 0 ? `${labels.openCollection} (${itemCount})` : labels.openCollection;

  return (
    <section className="space-y-3 rounded-[22px] border border-gray-200/80 bg-white/40 p-4 dark:border-gray-800 dark:bg-gray-950/15">
      <Link
        href={`/lists/${list.slug}`}
        className="block text-2xl font-extrabold tracking-tight text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
      >
        {list.title}
      </Link>

      {previews.length ? (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {previews.map((work, index) => (
            <PreviewCard
              key={work?.id || `${list.id}-${index}`}
              listSlug={list.slug}
              work={work}
              noCoverLabel={labels.noCover}
              openCollectionLabel={labels.openCollection}
            />
          ))}
        </div>
      ) : (
        <Link
          href={`/lists/${list.slug}`}
          className="flex min-h-28 items-center justify-center rounded-[10px] border border-dashed border-gray-300 text-sm font-medium text-gray-500 transition hover:bg-white/70 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/60"
        >
          {openCollectionText}
        </Link>
      )}
    </section>
  );
}
