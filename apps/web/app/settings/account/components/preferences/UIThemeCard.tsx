"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { useUITheme, type UITheme } from "@/app/components/ui-theme/UIThemeProvider";

type Option = {
  value: UITheme;
  label: string;
  description: string;
};

export default function UIThemeCard() {
  const t = useUILanguageText("Page Settings Account");
  const { uiTheme, setUITheme, ready } = useUITheme();

  const options: Option[] = [
    {
      value: "classic",
      label: t("Classic"),
      description: t("The original Inkura look."),
    },
    {
      value: "modern",
      label: t("Modern"),
      description: t("A cleaner, redesigned look (new)."),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{t("Interface Theme")}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("Switch between the classic and the new Inkura interface. This is separate from light/dark mode.")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = uiTheme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setUITheme(option.value)}
              aria-pressed={selected}
              disabled={!ready}
              className={
                "text-left rounded-xl border p-3 transition disabled:opacity-60 " +
                (selected
                  ? "border-purple-600 ring-1 ring-purple-600 bg-purple-50 dark:bg-purple-950/30"
                  : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{option.label}</span>
                <span
                  aria-hidden
                  className={
                    "h-4 w-4 rounded-full border " +
                    (selected ? "border-purple-600 bg-purple-600" : "border-gray-300 dark:border-gray-600")
                  }
                />
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
