import ActionLink from "@/app/components/ActionLink";
import LockLabel from "@/app/components/LockLabel";
import GenreTriStatePicker from "@/components/GenreTriStatePicker";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

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

export default function SearchForm({
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
  return (
    <form
      className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_180px_180px_220px_180px_140px] gap-3"
      action="/search"
      method="get"
    >
      <input
        name="q"
        defaultValue={q}
        placeholder="Search for title, description...."
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
      />

      <select
        name="kind"
        defaultValue={kind || "all"}
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <option value="all">All</option>
        <option value="novel">Novel</option>
        <option value="comic">Comic</option>
      </select>

      <select
        name="sort"
        defaultValue={sort || "newest"}
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <option value="newest">Newest</option>
        <option value="liked">Most liked</option>
        <option value="rated">Best rated</option>
      </select>

      <select
        name="genre"
        defaultValue={genre || ""}
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <option value="">Any genre</option>
        {genres.map((g: any) => (
          <option key={g.slug} value={g.slug}>
            {g.name}
          </option>
        ))}
      </select>

      <input
        name="tag"
        defaultValue={tag}
        placeholder="Tag"
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
      />

      <button className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110">
        Search
      </button>

      {/* Advanced filters */}
      <details className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:col-span-6">
        <summary className="cursor-pointer select-none text-sm font-semibold">Advanced Filters</summary>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-sm font-semibold">Language</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LANGUAGE_CATALOG.slice(0, 10).map((l) => (
                <label key={l.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="lang" value={l.code} defaultChecked={langs.includes(l.code)} />
                  {l.label}
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" name="ignoreLang" value="1" defaultChecked={ignoreLang} />
              Ignore my language preferences (settings)
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-sm font-semibold">Status / Publish / Chapters</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-300">
                Completion
                <select
                  name="completion"
                  defaultValue={completion || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                >
                  <option value="">Any</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="HIATUS">Hiatus</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Origin
                <select
                  name="origin"
                  defaultValue={origin || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                >
                  <option value="">Any</option>
                  <option value="ORIGINAL">Original</option>
                  <option value="FANFIC">Fanfic</option>
                  <option value="ADAPTATION">Adaptation</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Publish type
                <select
                  name="publishType"
                  defaultValue={publishType || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                >
                  <option value="">Any</option>
                  <option value="ORIGINAL">Original</option>
                  <option value="TRANSLATION">Translation</option>
                  <option value="REUPLOAD">Reupload</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Comic type
                <select
                  name="comicType"
                  defaultValue={comicType || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                >
                  <option value="">Any</option>
                  {COMIC_TYPE_CATALOG.filter((x) => x.value !== "UNKNOWN").map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Author
                <input
                  name="author"
                  defaultValue={author}
                  placeholder="username / name"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Min chapters
                <input
                  name="minCh"
                  type="number"
                  min={0}
                  defaultValue={minCh || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300">
                Max chapters
                <input
                  name="maxCh"
                  type="number"
                  min={0}
                  defaultValue={maxCh || ""}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                />
              </label>

              <label className="text-xs text-gray-600 dark:text-gray-300 col-span-2">
                Translator
                <input
                  name="translator"
                  defaultValue={translator}
                  placeholder="username / name"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                />
              </label>

              {showMatureFilter ? (
                <label className="text-xs text-gray-600 dark:text-gray-300 col-span-2">
                  Mature
                  <select
                    name="mature"
                    defaultValue={mature || (defaultHideMature ? "hide" : "include")}
                    disabled={!canViewMature}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800 disabled:opacity-60"
                  >
                    <option value="hide">Hide (default)</option>
                    <option value="include">Include</option>
                    <option value="only">Only</option>
                  </select>
                  {!canViewMature ? (
                    <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <LockLabel text="Mature" />
                        <span>Enable it in Settings → Account.</span>
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
            placeholder="Search for genre..."
            fallbackFetch="genres"
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300">Genre include mode:</span>
              <select
                name="gmode"
                defaultValue={includeMode === "and" ? "and" : "or"}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1"
              >
                <option value="or">OR (any included)</option>
                <option value="and">AND (all included)</option>
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
                placeholder="Search for deviant love tag..."
                fallbackFetch="deviantLove"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">Deviant include mode:</span>
                  <select
                    name="dmode"
                    defaultValue={deviantMode === "and" ? "and" : "or"}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1"
                  >
                    <option value="or">OR (any included)</option>
                    <option value="and">AND (all included)</option>
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
                Deviant Love tersegel. Konfirmasi beberapa hal di setting untuk membukanya. Peringatan, membuka jenis genre ini dapat merusak kewarasan!
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
                placeholder="Search for NSFW tag..."
                fallbackFetch="warnings"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">NSFW include mode:</span>
                  <select
                    name="wmode"
                    defaultValue={warningMode === "and" ? "and" : "or"}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1"
                  >
                    <option value="or">OR (any included)</option>
                    <option value="and">AND (all included)</option>
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
                NSFW tersegel. Konfirmasi beberapa hal di setting untuk membukanya. Anak dibawah umur dilarang membukanya.
              </div>
            </div>
          )}
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input type="checkbox" name="ignoreBlocked" value="1" defaultChecked={ignoreBlocked} />
          Ignore my blocked genres/NSFW (settings)
        </label>
      </details>
    </form>
  );
}
