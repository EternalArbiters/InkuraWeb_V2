"use client";

import { Search } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { SEARCH_TYPES } from "./constants";

export default function DesktopSearch({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  onSubmit,
}: {
  searchType: string;
  setSearchType: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const t = useUILanguageText("Navigation");

  return (
    <form onSubmit={onSubmit} className="flex items-center w-[420px]">
      <div className="flex flex-1 border border-blue-500 bg-white dark:bg-gray-800 rounded-full overflow-hidden shadow-md">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="px-3 text-sm border-r bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          {SEARCH_TYPES.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt[0].toUpperCase() + opt.slice(1))}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t(`Search ${searchType}...`)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 bg-transparent text-gray-800 dark:text-white focus:outline-none"
        />
        <button type="submit" className="px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white" aria-label={t("Search")}>
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}
