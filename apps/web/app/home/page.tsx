import Link from "next/link";
import WorkRail from "./WorkRail";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getHomePageData } from "@/server/services/home/getHomePageData";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { logPageRenderMetric } from "@/server/observability/metrics";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const startedAt = Date.now();

  try {
    await requirePageUserId("/home");
    const { trendingComics, trendingNovels, recent, originals, translations, draftWorks } = await getHomePageData();
    const [homeTitle, searchLabel, libraryLabel, trendingComicsLabel, trendingNovelsLabel, originalsLabel, translationsLabel, recentLabel, draftLabel] =
      await Promise.all([
        getActiveUILanguageText("Home", { section: "Page Home" }),
        getActiveUILanguageText("Search", { section: "Navigation" }),
        getActiveUILanguageText("Library", { section: "Navigation" }),
        getActiveUILanguageText("Trending Comics", { section: "Page Home" }),
        getActiveUILanguageText("Trending Novels", { section: "Page Home" }),
        getActiveUILanguageText("New Originals", { section: "Page Home" }),
        getActiveUILanguageText("Latest Translations", { section: "Page Home" }),
        getActiveUILanguageText("Recently Updated", { section: "Page Home" }),
        getActiveUILanguageText("Still Draft", { section: "Page Home" }),
      ]);

    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{homeTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/search"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
              >
                {searchLabel}
              </Link>
              <Link
                href="/library"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
              >
                {libraryLabel}
              </Link>
            </div>
          </header>

          <WorkRail title={trendingComicsLabel} href="/browse/trending-comics" works={trendingComics} />
          <WorkRail title={trendingNovelsLabel} href="/browse/trending-novels" works={trendingNovels} />
          <WorkRail title={originalsLabel} href="/browse/new-originals" works={originals} />
          <WorkRail title={translationsLabel} href="/browse/latest-translations" works={translations} />
          <WorkRail title={recentLabel} href="/browse/recent-updates" works={recent} />
          {draftWorks && draftWorks.length > 0 ? (
            <WorkRail title={draftLabel} href="/browse/still-drafts" works={draftWorks} />
          ) : null}

          <footer className="pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
            Inkura v16
          </footer>
        </div>
      </main>
    );
  } finally {
    logPageRenderMetric("home", startedAt);
  }
}
