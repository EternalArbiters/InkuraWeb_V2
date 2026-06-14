import WorkRail from "./WorkRail";
import HeroBanner from "./HeroBanner";
import HomeView from "./HomeView";
import { getHomePageData } from "@/server/services/home/getHomePageData";
import { getBannerWorks } from "@/server/services/home/getBannerWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { logPageRenderMetric } from "@/server/observability/metrics";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const startedAt = Date.now();

  try {
    const [{ trendingComics, trendingNovels, recent, originals, translations, draftWorks }, bannerWorks] =
      await Promise.all([getHomePageData(), getBannerWorks()]);
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

    const hero = bannerWorks.length > 0 ? <HeroBanner works={bannerWorks} /> : null;

    const rails = (
      <>
        <WorkRail title={trendingComicsLabel} href="/browse/trending-comics" works={trendingComics} />
        <WorkRail title={trendingNovelsLabel} href="/browse/trending-novels" works={trendingNovels} />
        <WorkRail title={originalsLabel} href="/browse/new-originals" works={originals} />
        <WorkRail title={translationsLabel} href="/browse/latest-translations" works={translations} />
        <WorkRail title={recentLabel} href="/browse/recent-updates" works={recent} />
        {draftWorks && draftWorks.length > 0 ? (
          <WorkRail title={draftLabel} href="/browse/still-drafts" works={draftWorks} />
        ) : null}
      </>
    );

    return (
      <HomeView
        title={homeTitle}
        searchLabel={searchLabel}
        libraryLabel={libraryLabel}
        hero={hero}
        rails={rails}
      />
    );
  } finally {
    logPageRenderMetric("home", startedAt);
  }
}
