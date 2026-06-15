"use client";

import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Genre = { slug: string; name: string };

type Props = {
  kind: string;
  sort: string;
  genre: string;
  tag: string;
  genres: Genre[];
  labels: { newest: string; mostLiked: string; bestRated: string; anyGenre: string; tags: string };
};

export default function SearchFilterBar({ kind, sort, genre, tag, genres, labels }: Props) {
  const { uiTheme } = useUITheme();

  const genreOptions = (
    <>
      <option value="">{labels.anyGenre}</option>
      {genres.map((g) => (
        <option key={g.slug} value={g.slug}>{g.name}</option>
      ))}
    </>
  );

  if (uiTheme === "modern") {
    const chip =
      "h-9 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-2)] px-4 text-sm font-medium text-[var(--ink-fg)] outline-none transition-colors hover:border-[var(--ink-accent)] focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)]";
    return (
      <div
        className="sticky top-20 z-30 border-b border-[var(--ink-border)] backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--ink-bg) 85%, transparent)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <select name="kind" form="search-form" defaultValue={kind || "all"} className={chip}>
              <option value="all">All</option>
              <option value="novel">Novel</option>
              <option value="comic">Comic</option>
            </select>
            <select name="sort" form="search-form" defaultValue={sort || "newest"} className={chip}>
              <option value="newest">{labels.newest}</option>
              <option value="liked">{labels.mostLiked}</option>
              <option value="rated">{labels.bestRated}</option>
            </select>
            <select name="genre" form="search-form" defaultValue={genre || ""} className={chip}>
              {genreOptions}
            </select>
            <input name="tag" form="search-form" defaultValue={tag} placeholder={labels.tags} className={chip} />
          </div>
        </div>
      </div>
    );
  }

  /* Classic mode — inline below the main form */
  const classicChip =
    "rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900";
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mt-3 flex flex-wrap gap-2">
        <select name="kind" form="search-form" defaultValue={kind || "all"} className={classicChip}>
          <option value="all">All</option>
          <option value="novel">Novel</option>
          <option value="comic">Comic</option>
        </select>
        <select name="sort" form="search-form" defaultValue={sort || "newest"} className={classicChip}>
          <option value="newest">{labels.newest}</option>
          <option value="liked">{labels.mostLiked}</option>
          <option value="rated">{labels.bestRated}</option>
        </select>
        <select name="genre" form="search-form" defaultValue={genre || ""} className={classicChip}>
          {genreOptions}
        </select>
        <input name="tag" form="search-form" defaultValue={tag} placeholder={labels.tags} className={classicChip} />
      </div>
    </div>
  );
}
