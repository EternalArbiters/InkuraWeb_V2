"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { INKURA_LANGUAGE_OPTIONS, type InkuraLanguageCode } from "@/lib/inkuraLanguage";

type Props = {
  inkuraLanguage: InkuraLanguageCode | null;
  onChange: (code: InkuraLanguageCode) => void;
};

export default function InkuraLanguageCard({ inkuraLanguage, onChange }: Props) {
  const t = useUILanguageText("Page Settings Account");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{t("Inkura Language")}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("Choose which language Inkura should use for the website UI.")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {INKURA_LANGUAGE_OPTIONS.map((language) => {
          const selected = inkuraLanguage === language.code;
          return (
            <button
              key={language.code}
              type="button"
              onClick={() => onChange(language.code)}
              aria-pressed={selected}
              className={
                "px-3 py-1.5 rounded-xl text-sm border transition " +
                (selected
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800")
              }
            >
              {language.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
