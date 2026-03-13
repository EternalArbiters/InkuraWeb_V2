"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

type Props = {
  preferredLanguages: string[];
  onToggle: (code: string) => void;
};

export default function PreferredLanguagesCard({ preferredLanguages, onToggle }: Props) {
  const t = useUILanguageText("Page Settings Account");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div>
        <div className="text-sm font-semibold">{t("Preferred languages")}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LANGUAGE_CATALOG.map((l) => {
          const on = preferredLanguages.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onToggle(l.code)}
              className={
                "px-3 py-1.5 rounded-xl text-sm border transition " +
                (on
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800")
              }
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
