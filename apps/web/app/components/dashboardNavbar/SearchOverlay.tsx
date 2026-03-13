"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { SEARCH_TYPES } from "./constants";

export default function SearchOverlay({
  open,
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  onSubmit,
  onClose,
}: {
  open: boolean;
  searchType: string;
  setSearchType: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const t = useUILanguageText("Navigation");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-6 px-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
              {t("Search anything on")}{" "}
              <span className="text-pink-500 font-bold">Inkura</span>
            </h2>
            <form
              onSubmit={onSubmit}
              className="relative flex w-full items-stretch overflow-hidden rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="relative w-[120px] shrink-0">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="h-full w-full appearance-none bg-transparent pl-4 pr-9 py-2 text-sm text-gray-700 dark:text-white outline-none"
                >
                  {SEARCH_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(opt[0].toUpperCase() + opt.slice(1))}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                />
              </div>

              <div className="w-px bg-gray-300/80 dark:bg-gray-700" />

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(`Search ${searchType}...`)}
                className="min-w-0 flex-1 bg-transparent px-4 py-2 pr-20 text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
              />

              <button
                type="submit"
                className="absolute right-0 inset-y-0 w-16 rounded-r-full bg-gradient-to-r from-blue-500 to-purple-600 text-white transition hover:brightness-110 flex items-center justify-center"
                aria-label={t("Search")}
                title={t("Search")}
              >
                <Search size={16} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
