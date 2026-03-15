import Link from "next/link";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type Props = {
  hasActiveFilters: boolean;
};

export default async function ActiveFiltersBar({ hasActiveFilters }: Props) {
  if (!hasActiveFilters) return null;
  const [tActiveFilters, tClearAll] = await Promise.all([
    getActiveUILanguageText("Active filters:"),
    getActiveUILanguageText("Clear All"),
  ]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-600 dark:text-gray-300">{tActiveFilters}</span>
      <Link href="/search" className="ml-auto text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
        {tClearAll}
      </Link>
    </div>
  );
}
