import { redirect } from "next/navigation";
import SearchPresets from "@/components/SearchPresets";
import { getSearchPageData, type SearchPageRawParams } from "@/server/services/search/searchPage";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import AnalyticsEventTracker from "@/app/components/analytics/AnalyticsEventTracker";

import ActiveFiltersBar from "./_components/ActiveFiltersBar";
import SearchForm from "./_components/SearchForm";
import WorksGrid from "./_components/WorksGrid";
import ListSurface from "@/app/components/ListSurface";
import ScaffoldHeader from "@/app/components/ScaffoldHeader";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchPageRawParams>;
}) {
  const searchParams = await searchParamsPromise;
  const rawType = String(firstParam(searchParams.type) || "").trim().toLowerCase();
  const rawQuery = String(firstParam(searchParams.q) || "").trim();
  const rawTag = String(firstParam(searchParams.tag) || "").trim();

  if (rawType === "authors" || rawType === "translator" || rawType === "users") {
    const next = new URLSearchParams();
    if (rawQuery) next.set("q", rawQuery);
    if (rawType === "authors") next.set("scope", "authors");
    if (rawType === "translator") next.set("scope", "translators");
    redirect(`/search/users${next.toString() ? `?${next.toString()}` : ""}`);
  }

  if (rawType === "tags" && rawQuery && !rawTag) {
    const next = new URLSearchParams();
    next.set("tag", rawQuery);
    redirect(`/search?${next.toString()}`);
  }

  const [data, tPageTitle] = await Promise.all([
    getSearchPageData(searchParams),
    getActiveUILanguageText("Advanced Search", { section: "Page Search" }),
  ]);

  return (
    <ListSurface>
      {/* Title + main search input + advanced filters */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-2">
        <ScaffoldHeader title={tPageTitle} separator={false} />
        <SearchForm
          q={data.q}
          kind={data.kind}
          sort={data.sort}
          tag={data.tag}
          genre={data.genre}
          genres={data.genres}
          warningTags={data.warningTags}
          deviantLoveTags={data.deviantLoveTags}
          langs={data.langs}
          ignoreLang={data.ignoreLang}
          completion={data.completion}
          origin={data.origin}
          publishType={data.publishType}
          comicType={data.comicType}
          author={data.author}
          translator={data.translator}
          minCh={data.minCh}
          maxCh={data.maxCh}
          showMatureFilter={data.showMatureFilter}
          mature={data.mature}
          canViewMature={data.canViewMature}
          defaultHideMature={data.defaultHideMature}
          ignoreBlocked={data.ignoreBlocked}
          includeGenres={data.includeGenres}
          excludeGenres={data.excludeGenres}
          includeMode={data.includeMode}
          includeWarnings={data.includeWarnings}
          excludeWarnings={data.excludeWarnings}
          warningMode={data.warningMode}
          includeDeviant={data.includeDeviant}
          excludeDeviant={data.excludeDeviant}
          deviantMode={data.deviantMode}
          canUseNsfwTags={data.canUseNsfwTags}
          canUseDeviantLoveTags={data.canUseDeviantLoveTags}
        />
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <ActiveFiltersBar hasActiveFilters={data.hasActiveFilters} />

        <div className="mt-4 h-px" style={{ background: "var(--ink-border)" }} />

        {(data.q || data.tag || data.genre || data.author || data.translator || data.hasActiveFilters) ? (
          <AnalyticsEventTracker
            eventType="SEARCH_SUBMIT"
            payload={{
              path: "/search",
              routeName: "search",
              searchQuery: data.q || data.tag || data.genre || data.author || data.translator || "browse",
              searchType: data.kind || "works",
              resultCount: data.works.length,
              metadata: {
                hasActiveFilters: data.hasActiveFilters,
                tag: data.tag || null,
                genre: data.genre || null,
                author: data.author || null,
                translator: data.translator || null,
              },
            }}
          />
        ) : null}

        <WorksGrid works={data.works} canViewMature={data.canViewMature} searchQuery={data.q || data.tag || data.genre || data.author || data.translator || undefined} searchType={data.kind || "works"} />

        <SearchPresets />
      </div>
    </ListSurface>
  );
}
