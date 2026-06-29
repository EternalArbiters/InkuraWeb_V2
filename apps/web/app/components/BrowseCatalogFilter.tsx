type Labels = {
  newest: string;
  liked: string;
  rated: string;
  anyPublishType: string;
  original: string;
  translation: string;
  reupload: string;
  author: string;
  translator: string;
  apply: string;
};

type Props = {
  action: string;
  defaultSort: string;
  defaultPublishType: string;
  defaultAuthor: string;
  defaultTranslator: string;
  labels: Labels;
};

export default function BrowseCatalogFilter({
  action,
  defaultSort,
  defaultPublishType,
  defaultAuthor,
  defaultTranslator,
  labels,
}: Props) {
    const chip =
      "shrink-0 h-9 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-2)] px-4 text-sm font-medium text-[var(--ink-fg)] outline-none transition-colors hover:border-[var(--ink-accent)] focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)]";
    return (
      <div
        className="md:sticky md:top-20 md:z-30 md:border-b md:border-[var(--ink-border)] md:backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--ink-bg) 85%, transparent)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <form action={action} method="get" className="flex items-center gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
            <select name="sort" defaultValue={defaultSort} className={chip}>
              <option value="newest">{labels.newest}</option>
              <option value="liked">{labels.liked}</option>
              <option value="rated">{labels.rated}</option>
            </select>

            <select name="publishType" defaultValue={defaultPublishType} className={chip}>
              <option value="">{labels.anyPublishType}</option>
              <option value="ORIGINAL">{labels.original}</option>
              <option value="TRANSLATION">{labels.translation}</option>
              <option value="REUPLOAD">{labels.reupload}</option>
            </select>

            <input name="author" defaultValue={defaultAuthor} placeholder={labels.author} className={chip} />
            <input name="translator" defaultValue={defaultTranslator} placeholder={labels.translator} className={chip} />

            <button
              type="submit"
              className="shrink-0 ml-auto h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
            >
              {labels.apply}
            </button>
          </form>
        </div>
      </div>
    );
}
