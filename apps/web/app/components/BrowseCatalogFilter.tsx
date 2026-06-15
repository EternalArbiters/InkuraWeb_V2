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
  const isModern = uiTheme === "modern";

  const inputClass = isModern
    ? "w-full rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] px-4 py-3 text-[var(--ink-fg)] placeholder:text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--ink-accent)]"
    : "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900";

  const wrapClass = isModern
    ? "mt-6 rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-4"
    : "mt-6";

  return (
    <div className={wrapClass}>
    <form
      action={action}
      method="get"
      className="grid grid-cols-1 gap-3 md:grid-cols-[160px_200px_1fr_1fr_140px]"
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

      <input
        name="author"
        defaultValue={defaultAuthor}
        placeholder={labels.author}
        className={inputClass}
      />
      <input
        name="translator"
        defaultValue={defaultTranslator}
        placeholder={labels.translator}
        className={inputClass}
      />
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
