import Link from "next/link";
import GenreTriStatePicker from "@/components/GenreTriStatePicker";
import SearchPresets from "@/components/SearchPresets";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { COMIC_TYPE_CATALOG } from "@/lib/comicTypeCatalog";
import { apiJson } from "@/lib/serverApi";

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


  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Search</h1>

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

          <button className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110">
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
                          Locked: enable it in Settings → Account.
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
                  <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Deviant Love (Locked)</div>
                  <div className="mt-1 text-xs text-yellow-900/80 dark:text-yellow-100/80">
                    Unlock di <b>Settings → Account</b> (confirm 18+ + Deviant Love).
                  </div>
                  <div className="mt-3">
                    <Link href="/settings/account" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                      Open Settings →
                    </Link>
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
                  <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">NSFW (Locked)</div>
                  <div className="mt-1 text-xs text-yellow-900/80 dark:text-yellow-100/80">
                    Unlock di <b>Settings → Account</b> (confirm 18+).
                  </div>
                  <div className="mt-3">
                    <Link href="/settings/account" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                      Open Settings →
                    </Link>
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

        {(genre || tag || giStr || geStr || wiStr || weStr || diStr || deStr || langs.length || completion || origin || minCh || maxCh || mature) ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-300">Active filters:</span>
            <Link href="/search" className="ml-auto text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              Clear all
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {q ? (
              <span>
                Hasil untuk <b>"{q}"</b> • {works.length} item
              </span>
            ) : (
              <span>{works.length} item</span>
            )}
          </div>
          <Link href="/all" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Explore
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {works.map((w: any) => {
            const blur = w.isMature && !canViewMature;
            const authorName = w.author?.name || w.author?.username || "Unknown";
            return (
              <Link
                key={w.id}
                href={`/w/${w.slug}`}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                  {w.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.coverImage}
                      alt={w.title}
                      className={`w-full h-full object-cover group-hover:scale-[1.02] transition ${blur ? "blur-md" : ""}`}
                    />
                  ) : null}
                  {w.isMature ? (
                    <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 text-white">18+</div>
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {w.type} • {authorName}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                    {typeof w.chapterCount === "number" ? `${w.chapterCount} ch` : null}
                    {w.completion ? ` • ${w.completion}` : ""}
                    {w.language ? ` • ${String(w.language).toUpperCase()}` : ""}
                  </div>
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                    <span>{w.likeCount ?? 0}</span>
                    <span>
                      ⭐ {(Math.round((w.ratingAvg ?? 0) * 10) / 10).toFixed(1)} ({w.ratingCount ?? 0})
                    </span>
                  </div>
                  {Array.isArray(w.warningTags) && w.warningTags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.warningTags.slice(0, 3).map((t: any) => (
                        <span
                          key={t.slug}
                          className="text-[10px] px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                        >
                          {t.name}
                        </span>
                      ))}
                      {w.warningTags.length > 3 ? (
                        <span className="text-[10px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                          +{w.warningTags.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}

          {works.length === 0 ? (
            <div className="col-span-2 md:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
              <div className="text-lg font-bold">No results</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Coba keyword lain atau ganti filter.</p>
            </div>
          ) : null}
        </div>

        <SearchPresets />
      </div>
    </main>
  );
}
