import { redirect } from "next/navigation";
import SearchPresets from "@/components/SearchPresets";
import { getSearchPageData, type SearchPageRawParams } from "@/server/services/search/searchPage";

import ActiveFiltersBar from "./_components/ActiveFiltersBar";
import ResultsHeader from "./_components/ResultsHeader";
import SearchForm from "./_components/SearchForm";
import WorksGrid from "./_components/WorksGrid";

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

  const data = await getSearchPageData(searchParams);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Advance Search</h1>

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

        <ActiveFiltersBar hasActiveFilters={data.hasActiveFilters} />

        <ResultsHeader q={data.q} count={data.works.length} />

        <WorksGrid works={data.works} canViewMature={data.canViewMature} />

        <SearchPresets />
      </div>
    </main>
  );
}
