import "server-only";

import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getViewerWithPrefs } from "@/server/services/works/viewer";
import {
  applyViewerWorkInteractions,
  emptyViewerWorkInteractions,
  getViewerWorkInteractions,
} from "@/server/services/works/viewerInteractions";

export async function getHomePageData() {
  const viewer = await getViewerWithPrefs();

  const [trendingComics, trendingNovels, recent, originals, translations] = await Promise.all([
    listPublishedWorksFromSearchParams(new URLSearchParams("type=COMIC&sort=liked&take=20"), {
      viewer,
      includeViewerInteractions: false,
    }),
    listPublishedWorksFromSearchParams(new URLSearchParams("type=NOVEL&sort=liked&take=20"), {
      viewer,
      includeViewerInteractions: false,
    }),
    listPublishedWorksFromSearchParams(new URLSearchParams("sort=newest&take=20"), {
      viewer,
      includeViewerInteractions: false,
    }),
    listPublishedWorksFromSearchParams(new URLSearchParams("publishType=ORIGINAL&sort=newest&take=20"), {
      viewer,
      includeViewerInteractions: false,
    }),
    listPublishedWorksFromSearchParams(new URLSearchParams("publishType=TRANSLATION&sort=newest&take=20"), {
      viewer,
      includeViewerInteractions: false,
    }),
  ]);

  let interactions = null;
  if (viewer?.id) {
    const allWorkIds = [
      ...trendingComics.works,
      ...trendingNovels.works,
      ...recent.works,
      ...originals.works,
      ...translations.works,
    ].map((work: any) => work.id);

    interactions = allWorkIds.length
      ? await getViewerWorkInteractions(viewer.id, allWorkIds)
      : emptyViewerWorkInteractions();
  }

  return {
    trendingComics: interactions ? applyViewerWorkInteractions(trendingComics.works as any[], interactions) : trendingComics.works,
    trendingNovels: interactions ? applyViewerWorkInteractions(trendingNovels.works as any[], interactions) : trendingNovels.works,
    recent: interactions ? applyViewerWorkInteractions(recent.works as any[], interactions) : recent.works,
    originals: interactions ? applyViewerWorkInteractions(originals.works as any[], interactions) : originals.works,
    translations: interactions ? applyViewerWorkInteractions(translations.works as any[], interactions) : translations.works,
  };
}
