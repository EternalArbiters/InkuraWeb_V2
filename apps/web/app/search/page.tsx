import SearchPresets from "@/components/SearchPresets";
import { apiJson } from "@/server/http/apiJson";

import ActiveFiltersBar from "./_components/ActiveFiltersBar";
import ResultsHeader from "./_components/ResultsHeader";
import SearchForm from "./_components/SearchForm";
import WorksGrid from "./_components/WorksGrid";

export const dynamic = "force-dynamic";

function splitList(v?: string) {
  return (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function toStr(v: unknown): string {
  if (Array.isArray(v)) return v[0] || "";
  return typeof v === "string" ? v : "";
}

function toStrArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => String(x).split(","));
  if (typeof v === "string") return v.split(",");
  return [];
}

export default async function SearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    kind?: string;
    sort?: string;
    tag?: string;
    genre?: string;
    gi?: string;
    ge?: string;
    gmode?: string;

    // warnings tri-state
    wi?: string;
    we?: string;
    wmode?: string;

    // deviant love tri-state
    di?: string;
    de?: string;
    dmode?: string;

    // advanced
    lang?: string | string[];
    completion?: string;
    origin?: string;
    publishType?: string;
    comicType?: string;
    author?: string;
    translator?: string;
    minCh?: string;
    maxCh?: string;
    mature?: string;
    ignoreBlocked?: string;
    ignoreLang?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  const q = (searchParams.q || "").trim();
  const kind = (searchParams.kind || "all").toLowerCase();
  const sort = (searchParams.sort || "newest").toLowerCase();
  const tag = (searchParams.tag || "").trim();
  const genre = (searchParams.genre || "").trim();

  const publishType = (searchParams.publishType || "").toUpperCase();
  const author = (searchParams.author || "").trim();
  const translator = (searchParams.translator || "").trim();
  const comicType = (searchParams.comicType || "").toUpperCase();

  // Genre tri-state
  let includeGenres = splitList(searchParams.gi);
  let excludeGenres = splitList(searchParams.ge);
  const includeMode = (searchParams.gmode || "or").toLowerCase() === "and" ? "and" : "or";

  // Warning tri-state
  let includeWarnings = splitList(searchParams.wi);
  let excludeWarnings = splitList(searchParams.we);
  const warningMode = (searchParams.wmode || "or").toLowerCase() === "and" ? "and" : "or";

  // Deviant Love tri-state
  let includeDeviant = splitList(searchParams.di);
  let excludeDeviant = splitList(searchParams.de);
  const deviantMode = (searchParams.dmode || "or").toLowerCase() === "and" ? "and" : "or";

  const completion = (searchParams.completion || "").toUpperCase();
  const origin = (searchParams.origin || "").toUpperCase();
  const minCh = Math.max(0, parseInt(toStr(searchParams.minCh), 10) || 0);
  const maxCh = Math.max(0, parseInt(toStr(searchParams.maxCh), 10) || 0);
  const mature = (searchParams.mature || "").toLowerCase(); // hide|include|only
  const ignoreBlocked = (searchParams.ignoreBlocked || "") === "1";
  const ignoreLang = (searchParams.ignoreLang || "") === "1";

  // User preferences (optional)
  const prefsRes = await apiJson<{
    prefs: {
      adultConfirmed: boolean;
      deviantLoveConfirmed: boolean;
      preferredLanguages: string[];
      blockedGenreIds: string[];
      blockedWarningIds: string[];
      blockedDeviantLoveIds: string[];
    };
  }>("/api/me/preferences");

  const prefs = prefsRes.ok ? prefsRes.data.prefs : null;

  // v14: adultConfirmed alone unlocks mature content.
  const canViewMatureByPrefs = !!prefs?.adultConfirmed;
  const showMatureFilter = !!prefs?.adultConfirmed;
  const canUseNsfwTags = !!prefs?.adultConfirmed;
  const canUseDeviantLoveTags = !!prefs?.adultConfirmed && !!prefs?.deviantLoveConfirmed;

  // NSFW filters are age-locked
  if (!canUseNsfwTags) {
    includeWarnings = [];
    excludeWarnings = [];
  }

  // Deviant Love filters are locked
  if (!canUseDeviantLoveTags) {
    includeDeviant = [];
    excludeDeviant = [];
  }

  // Normalize include/exclude conflicts
  excludeGenres = excludeGenres.filter((g) => !includeGenres.includes(g));
  excludeWarnings = excludeWarnings.filter((w) => !includeWarnings.includes(w));
  excludeDeviant = excludeDeviant.filter((d) => !includeDeviant.includes(d));

  // Languages from query OR user prefs
  let langs = toStrArr(searchParams.lang)
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  langs = Array.from(new Set(langs));

  if (!ignoreLang && langs.length === 0 && prefs?.preferredLanguages?.length) {
    langs = prefs.preferredLanguages.map((s) => String(s).toLowerCase());
  }

  const [genresRes, warningsRes, deviantRes] = await Promise.all([
    apiJson<{ genres: any[] }>("/api/genres?take=200"),
    apiJson<{ warningTags: any[] }>("/api/warnings?take=100"),
    apiJson<{ deviantLoveTags: any[] }>("/api/deviant-love?take=200"),
  ]);

  const genres = genresRes.ok ? genresRes.data.genres : [];
  const warningTags = warningsRes.ok ? warningsRes.data.warningTags : [];
  const deviantLoveTags = deviantRes.ok ? deviantRes.data.deviantLoveTags : [];

  // Query API works
  const qs = new URLSearchParams();
  qs.set("take", "60");
  if (q) qs.set("q", q);
  if (kind === "novel") qs.set("type", "NOVEL");
  if (kind === "comic") qs.set("type", "COMIC");
  if (sort && sort !== "newest") qs.set("sort", sort);
  if (tag) qs.set("tag", tag);
  if (genre) qs.set("genre", genre);

  if (publishType === "ORIGINAL" || publishType === "TRANSLATION" || publishType === "REUPLOAD") qs.set("publishType", publishType);
  if (author) qs.set("author", author);
  if (translator) qs.set("translator", translator);
  if (comicType) qs.set("comicType", comicType);

  if (includeGenres.length) qs.set("gi", includeGenres.join(","));
  if (excludeGenres.length) qs.set("ge", excludeGenres.join(","));
  if (includeMode === "and") qs.set("gmode", "and");

  if (canUseNsfwTags) {
    if (includeWarnings.length) qs.set("wi", includeWarnings.join(","));
    if (excludeWarnings.length) qs.set("we", excludeWarnings.join(","));
    if (warningMode === "and") qs.set("wmode", "and");
  }

  if (canUseDeviantLoveTags) {
    if (includeDeviant.length) qs.set("di", includeDeviant.join(","));
    if (excludeDeviant.length) qs.set("de", excludeDeviant.join(","));
    if (deviantMode === "and") qs.set("dmode", "and");
  }

  if (langs.length) qs.set("lang", langs.join(","));
  if (completion) qs.set("completion", completion);
  if (origin) qs.set("origin", origin);
  if (minCh) qs.set("minCh", String(minCh));
  if (maxCh) qs.set("maxCh", String(maxCh));
  if (mature) qs.set("mature", mature);
  if (ignoreBlocked) qs.set("ignoreBlocked", "1");
  if (ignoreLang) qs.set("ignoreLang", "1");

  const worksRes = await apiJson<{ works: any[]; viewer: any }>(`/api/works?${qs.toString()}`);
  const works = worksRes.ok ? worksRes.data.works : [];

  const viewer = worksRes.ok ? worksRes.data.viewer : null;
  const canViewMature = !!viewer?.canViewMature || canViewMatureByPrefs;
  const defaultHideMature = !canViewMature;

  const giStr = includeGenres.join(",");
  const geStr = excludeGenres.join(",");
  const wiStr = includeWarnings.join(",");
  const weStr = excludeWarnings.join(",");
  const diStr = includeDeviant.join(",");
  const deStr = excludeDeviant.join(",");

  const hasActiveFilters = !!(
    genre ||
    tag ||
    giStr ||
    geStr ||
    wiStr ||
    weStr ||
    diStr ||
    deStr ||
    langs.length ||
    completion ||
    origin ||
    minCh ||
    maxCh ||
    mature
  );

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Advance Search</h1>

        <SearchForm
          q={q}
          kind={kind}
          sort={sort}
          tag={tag}
          genre={genre}
          genres={genres}
          warningTags={warningTags}
          deviantLoveTags={deviantLoveTags}
          langs={langs}
          ignoreLang={ignoreLang}
          completion={completion}
          origin={origin}
          publishType={publishType}
          comicType={comicType}
          author={author}
          translator={translator}
          minCh={minCh}
          maxCh={maxCh}
          showMatureFilter={showMatureFilter}
          mature={mature}
          canViewMature={canViewMature}
          defaultHideMature={defaultHideMature}
          ignoreBlocked={ignoreBlocked}
          includeGenres={includeGenres}
          excludeGenres={excludeGenres}
          includeMode={includeMode}
          includeWarnings={includeWarnings}
          excludeWarnings={excludeWarnings}
          warningMode={warningMode}
          includeDeviant={includeDeviant}
          excludeDeviant={excludeDeviant}
          deviantMode={deviantMode}
          canUseNsfwTags={canUseNsfwTags}
          canUseDeviantLoveTags={canUseDeviantLoveTags}
        />

        <ActiveFiltersBar hasActiveFilters={hasActiveFilters} />

        <ResultsHeader q={q} count={works.length} />

        <WorksGrid works={works} canViewMature={canViewMature} />

        <SearchPresets />
      </div>
    </main>
  );
}
