import Link from "next/link";
import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function FilterPage() {
  const [title, description, bodyText, continueLabel, returnLabel] = await Promise.all([
    getActiveUILanguageText("Filter", { section: "Page Filters" }),
    getActiveUILanguageText("Filters currently live in Search (MVP). This page is reserved for advanced filters later.", { section: "Page Filters" }),
    getActiveUILanguageText("For now, you can filter by type, sort, and keyword on the Search page. Later, this can be expanded with genre, region, tag, status, minimum rating, and more.", { section: "Page Filters" }),
    getActiveUILanguageText("Continue to Search", { section: "Page Filters" }),
    getActiveUILanguageText("Return to All", { section: "Page Contact" }),
  ]);

  return (
    <PageScaffold title={title} description={description}>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{bodyText}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
          >
            {continueLabel}
          </Link>
          <Link
            href="/all"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {returnLabel}
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
