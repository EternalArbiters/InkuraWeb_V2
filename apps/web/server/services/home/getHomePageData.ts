import "server-only";

import {
  PUBLIC_CONTENT_REVALIDATE,
  publicHomeTag,
  publicWorksTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getViewerWithPrefs } from "@/server/services/works/viewer";
import {
  applyViewerWorkInteractions,
  emptyViewerWorkInteractions,
  getViewerWorkInteractions,
} from "@/server/services/works/viewerInteractions";
import { profileHotspot } from "@/server/observability/profiling";
import { listDraftWorksForAdmin } from "@/server/services/works/listDraftWorks";

function sortByRecentActivity(works: any[]): any[] {
  return works.slice().sort((a, b) => {
    const ta = new Date(a.lastChapterPublishedAt ?? a.updatedAt ?? 0).getTime();
    const tb = new Date(b.lastChapterPublishedAt ?? b.updatedAt ?? 0).getTime();
    return tb - ta;
  });
}

export async function getPublicHomePageData() {
  // v2: cache key bumped so stale pre-fix data is not served
  return withCachedPublicData(
    ["public-home:v2"],
    [publicHomeTag(), publicWorksTag()],
    PUBLIC_CONTENT_REVALIDATE.home,
    async () =>
      profileHotspot("home.publicRails", { rails: 5 }, async () => {
        const [trendingComics, trendingNovels, recent, originals, translations] = await Promise.all([
          listPublishedWorksFromSearchParams(new URLSearchParams("type=COMIC&sort=liked&take=20"), {
            viewer: null,
            includeViewerInteractions: false,
          }),
          listPublishedWorksFromSearchParams(new URLSearchParams("type=NOVEL&sort=liked&take=20"), {
            viewer: null,
            includeViewerInteractions: false,
          }),
          listPublishedWorksFromSearchParams(new URLSearchParams("sort=newest&take=20"), {
            viewer: null,
            includeViewerInteractions: false,
          }),
          listPublishedWorksFromSearchParams(new URLSearchParams("publishType=ORIGINAL&sort=newest&take=20"), {
            viewer: null,
            includeViewerInteractions: false,
          }),
          listPublishedWorksFromSearchParams(new URLSearchParams("publishType=TRANSLATION&sort=newest&take=20"), {
            viewer: null,
            includeViewerInteractions: false,
          }),
        ]);

        return {
          trendingComics: trendingComics.works,
          trendingNovels: trendingNovels.works,
          // Sort using coalesce(lastChapterPublishedAt, updatedAt) so order is correct
          // even for works created before lastChapterPublishedAt field existed (nulls)
          recent: sortByRecentActivity(recent.works),
          originals: sortByRecentActivity(originals.works),
          translations: sortByRecentActivity(translations.works),
        };
      })
  );
}


export async function getViewerHomePagePayload(workIds: string[]) {
  const viewer = await getViewerWithPrefs();
  if (!viewer?.id || workIds.length === 0) {
    return { viewer, interactions: emptyViewerWorkInteractions() };
  }

  const interactions = await profileHotspot("home.viewerPayload", { workCount: workIds.length }, () =>
    getViewerWorkInteractions(viewer.id, workIds)
  );
  return { viewer, interactions };
}

export async function getHomePageData() {
  const base = await getPublicHomePageData();

  const allWorkIds = Array.from(
    new Set(
      [
        ...base.trendingComics,
        ...base.trendingNovels,
        ...base.recent,
        ...base.originals,
        ...base.translations,
      ].map((work: any) => work.id)
    )
  );

  const { viewer, interactions } = await getViewerHomePagePayload(allWorkIds);

  // Fetch draft works only for admin — not cached, always fresh
  const draftWorks = viewer?.role === "ADMIN" ? await listDraftWorksForAdmin({ take: 20 }) : [];

  if (!viewer?.id) {
    return { ...base, draftWorks: [] };
  }

  return {
    trendingComics: applyViewerWorkInteractions(base.trendingComics as any[], interactions),
    trendingNovels: applyViewerWorkInteractions(base.trendingNovels as any[], interactions),
    recent: applyViewerWorkInteractions(base.recent as any[], interactions),
    originals: applyViewerWorkInteractions(base.originals as any[], interactions),
    translations: applyViewerWorkInteractions(base.translations as any[], interactions),
    draftWorks,
  };
}
