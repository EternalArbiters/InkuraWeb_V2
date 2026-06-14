import WorkRail from "./WorkRail";
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
    const [homeTitle, searchLabel, libraryLabel, trendingComicsLabel, trendingNovelsLabel, originalsLabel, translationsLabel, recentLabel, draftLabel, seeAllLabel, readLabel] =
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
        getActiveUILanguageText("See all", { section: "Page Home" }),
        getActiveUILanguageText("Read", { section: "Page Home" }),
      ]);

    const railItems = [
      { title: trendingComicsLabel, href: "/browse/trending-comics", works: trendingComics },
      { title: trendingNovelsLabel, href: "/browse/trending-novels", works: trendingNovels },
      { title: originalsLabel, href: "/browse/new-originals", works: originals },
      { title: translationsLabel, href: "/browse/latest-translations", works: translations },
      { title: recentLabel, href: "/browse/recent-updates", works: recent },
      ...(draftWorks && draftWorks.length > 0
        ? [{ title: draftLabel, href: "/browse/still-drafts", works: draftWorks }]
        : []),
    ];

    // Classic UI keeps the original server-rendered rails untouched; modern UI
    // rebuilds them from the structured data (railItems) in a Webtoon-style grid.
    const rails = (
      <>
        {railItems.map((rail) => (
          <WorkRail key={rail.href} title={rail.title} href={rail.href} works={rail.works} />
        ))}
      </>
    );

    return (
      <HomeView
        title={homeTitle}
        searchLabel={searchLabel}
        libraryLabel={libraryLabel}
        seeAllLabel={seeAllLabel}
        readLabel={readLabel}
        bannerWorks={bannerWorks}
        rails={rails}
        railItems={railItems}
      />
    );
  } finally {
    logPageRenderMetric("home", startedAt);
  }
}
