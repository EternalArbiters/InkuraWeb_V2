import ActionLink from "@/app/components/ActionLink";
import LockLabel from "@/app/components/LockLabel";
import GenreTriStatePicker from "@/components/GenreTriStatePicker";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type Props = {
  q: string;
  kind: string;
  sort: string;
  tag: string;
  genre: string;

  genres: any[];
  warningTags: any[];
  deviantLoveTags: any[];

  langs: string[];
  ignoreLang: boolean;

  completion: string;
  origin: string;
  publishType: string;
  comicType: string;
  author: string;
  translator: string;
  minCh: number;
  maxCh: number;

  showMatureFilter: boolean;
  mature: string;
  canViewMature: boolean;
  defaultHideMature: boolean;

  ignoreBlocked: boolean;

  includeGenres: string[];
  excludeGenres: string[];
  includeMode: "and" | "or";

  includeWarnings: string[];
  excludeWarnings: string[];
  warningMode: "and" | "or";

  includeDeviant: string[];
  excludeDeviant: string[];
  deviantMode: "and" | "or";

  canUseNsfwTags: boolean;
  canUseDeviantLoveTags: boolean;
};

export default async function SearchForm({
  q,
  kind,
  sort,
  tag,
  genre,
  genres,
  warningTags,
  deviantLoveTags,
  langs,
  ignoreLang,
  completion,
  origin,
  publishType,
  comicType,
  author,
  translator,
  minCh,
  maxCh,
  showMatureFilter,
  mature,
  canViewMature,
  defaultHideMature,
  ignoreBlocked,
  includeGenres,
  excludeGenres,
  includeMode,
  includeWarnings,
  excludeWarnings,
  warningMode,
  includeDeviant,
  excludeDeviant,
  deviantMode,
  canUseNsfwTags,
  canUseDeviantLoveTags,
}: Props) {
  const [
    tSearchTitle, tNewest, tMostLiked, tBestRated, tAnyGenre, tSearch,
    tAdvancedFilters, tLanguage, tStatusPublishChapters, tCompletion,
    tAny, tOngoing, tCompleted, tHiatus, tCancelled,
    tOrigin, tOriginal, tFanfic, tAdaptation, tUnknown,
    tPublishType, tTranslation, tReupload, tComicType,
    tAuthor, tMinChapters, tMaxChapters, tTranslator,
    tMature, tHideDefault, tInclude, tOnly,
    tGenreIncludeMode, tOrAny, tAndAll,
    tDeviantIncludeMode, tNsfwIncludeMode,
    tIgnoreLangPref, tIgnoreBlockedGenres,
    tSearchForTitle, tTag, tEnableSettings,
    tSearchDeviantLove, tSearchNsfw, tSearchGenre, tClearAll,
  ] = await Promise.all([
    getActiveUILanguageText("Advance Search", { section: "Page Search" }),
    getActiveUILanguageText("Newest"),
    getActiveUILanguageText("Most liked"),
    getActiveUILanguageText("Best rated"),
    getActiveUILanguageText("Any genre"),
    getActiveUILanguageText("Search"),
    getActiveUILanguageText("Advanced Filters"),
    getActiveUILanguageText("Language"),
    getActiveUILanguageText("Status / Publish / Chapters"),
    getActiveUILanguageText("Completion"),
    getActiveUILanguageText("Any"),
    getActiveUILanguageText("Ongoing"),
    getActiveUILanguageText("Completed"),
    getActiveUILanguageText("Hiatus"),
    getActiveUILanguageText("Cancelled"),
    getActiveUILanguageText("Origin"),
    getActiveUILanguageText("Original"),
    getActiveUILanguageText("Fanfic"),
    getActiveUILanguageText("Adaptation"),
    getActiveUILanguageText("Unknown"),
    getActiveUILanguageText("Publish type"),
    getActiveUILanguageText("Translation"),
    getActiveUILanguageText("Reupload"),
    getActiveUILanguageText("Comic type"),
    getActiveUILanguageText("Author (username / name)"),
    getActiveUILanguageText("Min chapters", { section: "Page Search" }),
    getActiveUILanguageText("Max chapters", { section: "Page Search" }),
    getActiveUILanguageText("Translator (username / name)"),
    getActiveUILanguageText("Mature / 18+"),
    getActiveUILanguageText("Hide (default)"),
    getActiveUILanguageText("Include"),
    getActiveUILanguageText("Only", { section: "Page Search" }),
    getActiveUILanguageText("Genre include mode:"),
    getActiveUILanguageText("OR (any included)"),
    getActiveUILanguageText("AND (all included)"),
    getActiveUILanguageText("Deviant include mode:"),
    getActiveUILanguageText("NSFW include mode:"),
    getActiveUILanguageText("Ignore my language preferences (settings)", { section: "Page Search" }),
    getActiveUILanguageText("Ignore my blocked genres/NSFW (settings)", { section: "Page Search" }),
    getActiveUILanguageText("Search for title, description...."),
    getActiveUILanguageText("Tags"),
    getActiveUILanguageText("Enable it in Settings → Account."),
    getActiveUILanguageText("Search for deviant love tag..."),
    getActiveUILanguageText("Search for NSFW tag..."),
    getActiveUILanguageText("Search for genre..."),
    getActiveUILanguageText("Clear All"),
  ]);
  return (
    <form
      className="mt-6"
      action="/search"
      method="get"
    >
      {/* Row 1: main search + submit */}
      <div className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={tSearchForTitle}
          className="flex-1 px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-base outline-none focus:ring-2 focus:ring-purple-500 ink-input"
        />
        <button className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-base font-semibold text-white hover:brightness-110">
          {tSearch}
        </button>
      </div>

      {/* Row 2: secondary filter chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          name="kind"
          defaultValue={kind || "all"}
          className="rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ink-input"
        >
          <option value="all">All</option>
          <option value="novel">Novel</option>
          <option value="comic">Comic</option>
        </select>

        <select
          name="sort"
          defaultValue={sort || "newest"}
          className="rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ink-input"
        >
          <option value="newest">{tNewest}</option>
          <option value="liked">{tMostLiked}</option>
          <option value="rated">{tBestRated}</option>
        </select>

        <select
          name="genre"
          defaultValue={genre || ""}
          className="rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ink-input"
        >
          <option value="">{tAnyGenre}</option>
          {genres.map((g: any) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>

        <input
          name="tag"
          defaultValue={tag}
          placeholder={tTag}
          className="rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 ink-input"
        />
      </div>

      {/* Advanced filters */}
      <details className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 ink-panel">
        <summary className="cursor-pointer select-none text-sm font-semibold">{tAdvancedFilters}</summary>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 ink-panel">
            <div className="text-sm font-semibold text-[var(--ink-fg,inherit)]">{tLanguage}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LANGUAGE_CATALOG.slice(0, 10).map((l) => (
                <label key={l.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="lang" value={l.code} defaultChecked={langs.includes(l.code)} />
                  {l.label}
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
              <input type="checkbox" name="ignoreLang" value="1" defaultChecked={ignoreLang} />
              {tIgnoreLangPref}
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 ink-panel">
            <div className="text-sm font-semibold text-[var(--ink-fg,inherit)]">{tStatusPublishChapters}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tCompletion}
                <select
                  name="completion"
                  defaultValue={completion || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                >
                  <option value="">{tAny}</option>
                  <option value="ONGOING">{tOngoing}</option>
                  <option value="COMPLETED">{tCompleted}</option>
                  <option value="HIATUS">{tHiatus}</option>
                  <option value="CANCELLED">{tCancelled}</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tOrigin}
                <select
                  name="origin"
                  defaultValue={origin || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                >
                  <option value="">{tAny}</option>
                  <option value="ORIGINAL">{tOriginal}</option>
                  <option value="FANFIC">{tFanfic}</option>
                  <option value="ADAPTATION">{tAdaptation}</option>
                  <option value="UNKNOWN">{tUnknown}</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tPublishType}
                <select
                  name="publishType"
                  defaultValue={publishType || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                >
                  <option value="">{tAny}</option>
                  <option value="ORIGINAL">{tOriginal}</option>
                  <option value="TRANSLATION">{tTranslation}</option>
                  <option value="REUPLOAD">{tReupload}</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tComicType}
                <select
                  name="comicType"
                  defaultValue={comicType || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                >
                  <option value="">{tAny}</option>
                  {COMIC_TYPE_CATALOG.filter((x) => x.value !== "UNKNOWN").map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                  <option value="UNKNOWN">{tUnknown}</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tAuthor}
                <input
                  name="author"
                  defaultValue={author}
                  placeholder="username / name"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tMinChapters}
                <input
                  name="minCh"
                  type="number"
                  min={0}
                  defaultValue={minCh || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
                {tMaxChapters}
                <input
                  name="maxCh"
                  type="number"
                  min={0}
                  defaultValue={maxCh || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 col-span-2">
                {tTranslator}
                <input
                  name="translator"
                  defaultValue={translator}
                  placeholder="username / name"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 ink-input"
                />
              </label>

              {showMatureFilter ? (
                <label className="text-xs text-gray-600 dark:text-gray-300 col-span-2">
                  {tMature}
                  <select
                    name="mature"
                    defaultValue={mature || (defaultHideMature ? "hide" : "include")}
                    disabled={!canViewMature}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 disabled:opacity-60"
                  >
                    <option value="hide">{tHideDefault}</option>
                    <option value="include">{tInclude}</option>
                    <option value="only">{tOnly}</option>
                  </select>
                  {!canViewMature ? (
                    <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <LockLabel text="Mature" />
                        <span>{tEnableSettings}</span>
                      </span>
                    </div>
                  ) : null}
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <GenreTriStatePicker
            genres={genres}
            initialInclude={includeGenres}
            initialExclude={excludeGenres}
            nameInclude="gi"
            nameExclude="ge"
            title="Genres"
            placeholder={tSearchGenre}
            fallbackFetch="genres"
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-2">
              {tGenreIncludeMode}
              <select
                name="gmode"
                defaultValue={includeMode === "and" ? "and" : "or"}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1 ink-input"
              >
                <option value="or">{tOrAny}</option>
                <option value="and">{tAndAll}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4">
          {canUseDeviantLoveTags ? (
            <>
              <GenreTriStatePicker
                genres={deviantLoveTags}
                initialInclude={includeDeviant}
                initialExclude={excludeDeviant}
                nameInclude="di"
                nameExclude="de"
                title="Deviant Love"
                placeholder={tSearchDeviantLove}
                fallbackFetch="deviantLove"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2">
                  {tDeviantIncludeMode}
                  <select
                    name="dmode"
                    defaultValue={deviantMode === "and" ? "and" : "or"}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1 ink-input"
                  >
                    <option value="or">{tOrAny}</option>
                    <option value="and">{tAndAll}</option>
                  </select>
                </label>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/30 p-4">
              <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                <LockLabel text="Deviant Love" />
              </div>
              <div className="mt-1 text-xs text-yellow-900/80 dark:text-yellow-100/80">
                Deviant Love is locked. Confirm the required settings to unlock it. Warning: opening this genre may be psychologically disturbing!
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          {canUseNsfwTags ? (
            <>
              <GenreTriStatePicker
                genres={warningTags}
                initialInclude={includeWarnings}
                initialExclude={excludeWarnings}
                nameInclude="wi"
                nameExclude="we"
                title="NSFW"
                placeholder={tSearchNsfw}
                fallbackFetch="warnings"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2">
                  {tNsfwIncludeMode}
                  <select
                    name="wmode"
                    defaultValue={warningMode === "and" ? "and" : "or"}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1 ink-input"
                  >
                    <option value="or">{tOrAny}</option>
                    <option value="and">{tAndAll}</option>
                  </select>
                </label>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/30 p-4">
              <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                <LockLabel text="NSFW" />
              </div>
              <div className="mt-1 text-xs text-yellow-900/80 dark:text-yellow-100/80">
                NSFW is locked. Confirm the required settings to unlock it. Minors are not allowed to open it.
              </div>
            </div>
          )}
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 ink-muted-text">
          <input type="checkbox" name="ignoreBlocked" value="1" defaultChecked={ignoreBlocked} />
          {tIgnoreBlockedGenres}
        </label>
      </details>
    </form>
  );
}
