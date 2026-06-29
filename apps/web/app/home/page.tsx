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
    const [trendingComicsLabel, trendingNovelsLabel, originalsLabel, translationsLabel, recentLabel, draftLabel, seeAllLabel] =
      await Promise.all([
        getActiveUILanguageText("Trending Comics", { section: "Page Home" }),
        getActiveUILanguageText("Trending Novels", { section: "Page Home" }),
        getActiveUILanguageText("New Originals", { section: "Page Home" }),
        getActiveUILanguageText("Latest Translations", { section: "Page Home" }),
        getActiveUILanguageText("Recently Updated", { section: "Page Home" }),
        getActiveUILanguageText("Still Draft", { section: "Page Home" }),
        getActiveUILanguageText("See all", { section: "Page Home" }),
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

    return (
      <HomeView
        seeAllLabel={seeAllLabel}
        bannerWorks={bannerWorks}
        railItems={railItems}
      />
    );
  } finally {
    logPageRenderMetric("home", startedAt);
  }
}
