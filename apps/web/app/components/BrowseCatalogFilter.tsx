"use client";

import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

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
  const { uiTheme } = useUITheme();

  if (uiTheme === "modern") {
    const chip =
      "h-9 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-2)] px-4 text-sm font-medium text-[var(--ink-fg)] outline-none transition-colors hover:border-[var(--ink-accent)] focus:border-[var(--ink-accent)] focus:ring-1 focus:ring-[var(--ink-accent)] placeholder:text-[var(--ink-muted)]";
    return (
      <div
        className="sticky top-20 z-30 border-b border-[var(--ink-border)] backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--ink-bg) 85%, transparent)" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <form action={action} method="get" className="flex flex-wrap items-center gap-2 py-3">
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
              className="ml-auto h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
            >
              {labels.apply}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Classic mode ── */
  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900";
  return (
    <div className="mx-auto max-w-6xl px-4">
      <form
        action={action}
        method="get"
        className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[160px_200px_1fr_1fr_140px]"
      >
        <select name="sort" defaultValue={defaultSort} className={inputClass}>
          <option value="newest">{labels.newest}</option>
          <option value="liked">{labels.liked}</option>
          <option value="rated">{labels.rated}</option>
        </select>
        <select name="publishType" defaultValue={defaultPublishType} className={inputClass}>
          <option value="">{labels.anyPublishType}</option>
          <option value="ORIGINAL">{labels.original}</option>
          <option value="TRANSLATION">{labels.translation}</option>
          <option value="REUPLOAD">{labels.reupload}</option>
        </select>
        <input name="author" defaultValue={defaultAuthor} placeholder={labels.author} className={inputClass} />
        <input name="translator" defaultValue={defaultTranslator} placeholder={labels.translator} className={inputClass} />
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white hover:brightness-110"
        >
          {labels.apply}
        </button>
      </form>
    </div>
  );
}
