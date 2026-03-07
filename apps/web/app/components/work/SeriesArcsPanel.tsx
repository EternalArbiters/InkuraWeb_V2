import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type SeriesCardItem = {
  href: string;
  title: string;
  coverImage?: string | null;
  active?: boolean;
};

type ArcNavItem = {
  href: string;
  label: string;
  title: string;
  coverImage?: string | null;
};

function CoverThumb({ title, coverImage, square = false }: { title: string; coverImage?: string | null; square?: boolean }) {
  const baseClass = square ? "aspect-square w-14 rounded-xl" : "aspect-[3/4] w-full rounded-xl";

  if (coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImage}
        alt={title}
        className={`${baseClass} object-cover border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${baseClass} flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-lg font-bold text-gray-500 dark:text-gray-400`}
      aria-hidden="true"
    >
      {title.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function SeriesCard({ item }: { item: SeriesCardItem }) {
  const cardClass = item.active
    ? "border-purple-400/60 bg-purple-500/10"
    : "border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-950/40 hover:bg-gray-50 dark:hover:bg-gray-900";

  const content = (
    <div className={`rounded-2xl border p-3 transition ${cardClass}`}>
      <CoverThumb title={item.title} coverImage={item.coverImage} />
      <div className="mt-3 min-w-0">
        <div className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.active ? "Current" : "Arc"}</div>
      </div>
    </div>
  );

  if (item.active) return <div className="w-[140px] shrink-0 sm:w-auto sm:flex-1">{content}</div>;

  return (
    <Link href={item.href} className="w-[140px] shrink-0 sm:w-auto sm:flex-1">
      {content}
    </Link>
  );
}

function ArcButton({ item }: { item: ArcNavItem }) {
  const Icon = item.label === "Previous Arc" ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={item.href}
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-950/40 px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-900"
    >
      <CoverThumb title={item.title} coverImage={item.coverImage} square />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{item.label}</div>
        <div className="mt-1 text-sm font-semibold leading-snug line-clamp-2">{item.title}</div>
      </div>
      <Icon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
    </Link>
  );
}

export default function SeriesArcsPanel({
  items,
  prevArc,
  nextArc,
}: {
  items: SeriesCardItem[];
  prevArc?: ArcNavItem | null;
  nextArc?: ArcNavItem | null;
}) {
  const hasNavigation = !!prevArc || !!nextArc;
  if (!items.length && !hasNavigation) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Series collection</div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">Connected works</div>
      </div>

      {items.length ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:overflow-visible">
          {items.map((item) => (
            <SeriesCard key={`${item.href}:${item.title}`} item={item} />
          ))}
        </div>
      ) : null}

      {hasNavigation ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {prevArc ? <ArcButton item={prevArc} /> : null}
          {nextArc ? <ArcButton item={nextArc} /> : null}
        </div>
      ) : null}
    </div>
  );
}
