import Link from "next/link";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import GenreTriStatePicker from "@/components/GenreTriStatePicker";
import SearchPresets from "@/components/SearchPresets";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { parseJsonStringArray } from "@/lib/prefs";

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

    // advanced
    lang?: string | string[];
    completion?: string;
    origin?: string;
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

  // Genre tri-state
  let includeGenres = splitList(searchParams.gi);
  let excludeGenres = splitList(searchParams.ge);
  const includeMode = (searchParams.gmode || "or").toLowerCase() === "and" ? "and" : "or";

  // Warning tri-state
  let includeWarnings = splitList(searchParams.wi);
  let excludeWarnings = splitList(searchParams.we);
  const warningMode = (searchParams.wmode || "or").toLowerCase() === "and" ? "and" : "or";

  const completion = (searchParams.completion || "").toUpperCase();
  const origin = (searchParams.origin || "").toUpperCase();
  const minCh = Math.max(0, parseInt(toStr(searchParams.minCh), 10) || 0);
  const maxCh = Math.max(0, parseInt(toStr(searchParams.maxCh), 10) || 0);
  const mature = (searchParams.mature || "").toLowerCase(); // hide|include|only
  const ignoreBlocked = (searchParams.ignoreBlocked || "") === "1";
  const ignoreLang = (searchParams.ignoreLang || "") === "1";

  // Session prefs (for default blocking & mature behavior)
  const session = await getServerSession(authOptions);
  const me = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          matureOptIn: true,
          preferredLanguagesJson: true,
          blockedGenres: { select: { id: true, slug: true } },
          blockedWarnings: { select: { id: true, slug: true } },
        },
      })
    : null;

  const userMatureOptIn = !!me?.matureOptIn;
  const preferredLangs = me ? parseJsonStringArray(me.preferredLanguagesJson) : [];
  const blockedGenreIds = me ? me.blockedGenres.map((g) => g.id) : [];
  const blockedWarningIds = me ? me.blockedWarnings.map((w) => w.id) : [];

  // Normalize include/exclude conflicts
  excludeGenres = excludeGenres.filter((g) => !includeGenres.includes(g));
  excludeWarnings = excludeWarnings.filter((w) => !includeWarnings.includes(w));

  // Languages from query OR user prefs
  let langs = toStrArr(searchParams.lang)
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  langs = Array.from(new Set(langs));
  if (!ignoreLang && langs.length === 0 && preferredLangs.length) {
    langs = preferredLangs.map((s) => String(s).toLowerCase());
  }

  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const warningTags = await prisma.warningTag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const tagSlug = tag
    ? tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    : "";

  const where: any = { status: "PUBLISHED" };
  if (kind === "novel") where.type = "NOVEL";
  if (kind === "comic") where.type = "COMIC";

  const AND: any[] = [];

  // Basic genre dropdown (legacy)
  if (genre) {
    AND.push({ genres: { some: { slug: genre } } });
  }

  // Genre tri-state include/exclude
  if (includeGenres.length) {
    if (includeMode === "and") {
      AND.push(...includeGenres.map((slug) => ({ genres: { some: { slug } } })));
    } else {
      AND.push({ genres: { some: { slug: { in: includeGenres } } } });
    }
  }
  if (excludeGenres.length) {
    AND.push({ genres: { none: { slug: { in: excludeGenres } } } });
  }

  // Warning tri-state include/exclude
  if (includeWarnings.length) {
    if (warningMode === "and") {
      AND.push(...includeWarnings.map((slug) => ({ warningTags: { some: { slug } } })));
    } else {
      AND.push({ warningTags: { some: { slug: { in: includeWarnings } } } });
    }
  }
  if (excludeWarnings.length) {
    AND.push({ warningTags: { none: { slug: { in: excludeWarnings } } } });
  }

  // Completion/origin
  if (completion) {
    AND.push({ completion });
  }
  if (origin) {
    AND.push({ origin });
  }

  // Chapter count range
  if (minCh > 0) AND.push({ chapterCount: { gte: minCh } });
  if (maxCh > 0) AND.push({ chapterCount: { lte: maxCh } });

  // Mature filter (hide/include/only)
  const defaultHideMature = !userMatureOptIn; // user hasn't opted in
  const effectiveMature = mature || (defaultHideMature ? "hide" : "include");
  if (effectiveMature === "hide") AND.push({ isMature: false });
  if (effectiveMature === "only") AND.push({ isMature: true });

  // Tag filter
  if (tag) {
    AND.push({
      tags: {
        some: {
          OR: [
            ...(tagSlug ? [{ slug: tagSlug }] : []),
            { name: { contains: tag, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  // Keyword
  if (q) {
    AND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Language filter
  if (langs.length) {
    AND.push({ language: { in: langs } });
  }

  // User blocking defaults
  if (me && !ignoreBlocked) {
    if (blockedGenreIds.length) AND.push({ genres: { none: { id: { in: blockedGenreIds } } } });
    if (blockedWarningIds.length) AND.push({ warningTags: { none: { id: { in: blockedWarningIds } } } });
  }

  if (AND.length) where.AND = AND;

  let orderBy: any = { updatedAt: "desc" };
  if (sort === "liked") orderBy = { likeCount: "desc" };
  if (sort === "rated") orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { updatedAt: "desc" }];

  const works = await prisma.work.findMany({
    where,
    orderBy,
    take: 60,
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      type: true,
      likeCount: true,
      ratingAvg: true,
      ratingCount: true,
      isMature: true,
      language: true,
      completion: true,
      chapterCount: true,
      warningTags: { select: { name: true, slug: true } },
      author: { select: { username: true, name: true } },
    },
  });

  const giStr = includeGenres.join(",");
  const geStr = excludeGenres.join(",");
  const wiStr = includeWarnings.join(",");
  const weStr = excludeWarnings.join(",");

  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (kind && kind !== "all") baseParams.kind = kind;
  if (sort && sort !== "newest") baseParams.sort = sort;
  if (tag) baseParams.tag = tag;
  if (genre) baseParams.genre = genre;
  if (giStr) baseParams.gi = giStr;
  if (geStr) baseParams.ge = geStr;
  if (includeMode === "and") baseParams.gmode = "and";
  if (wiStr) baseParams.wi = wiStr;
  if (weStr) baseParams.we = weStr;
  if (warningMode === "and") baseParams.wmode = "and";
  if (langs.length) baseParams.lang = langs.join(",");
  if (completion) baseParams.completion = completion;
  if (origin) baseParams.origin = origin;
  if (minCh) baseParams.minCh = String(minCh);
  if (maxCh) baseParams.maxCh = String(maxCh);
  if (mature) baseParams.mature = mature;
  if (ignoreBlocked) baseParams.ignoreBlocked = "1";
  if (ignoreLang) baseParams.ignoreLang = "1";

  const canViewMature = userMatureOptIn;

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
            {genres.map((g) => (
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
            <summary className="cursor-pointer select-none text-sm font-semibold">
              Advanced Filters
            </summary>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="text-sm font-semibold">Language</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {LANGUAGE_CATALOG.slice(0, 10).map((l) => (
                    <label key={l.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="lang"
                        value={l.code}
                        defaultChecked={langs.includes(l.code)}
                      />
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
                <div className="text-sm font-semibold">Status / Origin / Chapters / NSFW</div>
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
                    NSFW
                    <select
                      name="mature"
                      defaultValue={mature || (defaultHideMature ? "hide" : "include")}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-transparent border border-gray-200 dark:border-gray-800"
                    >
                      <option value="hide">Hide (default)</option>
                      <option value="include">Include</option>
                      <option value="only">Only</option>
                    </select>
                    {!canViewMature ? (
                      <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                        Hey, you! NSWF is not for minors. It's also haram.
                      </div>
                    ) : null}
                  </label>
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
              <GenreTriStatePicker
                genres={warningTags}
                initialInclude={includeWarnings}
                initialExclude={excludeWarnings}
                nameInclude="wi"
                nameExclude="we"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">Warning include mode:</span>
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
            </div>
          </details>
        </form>

        {(genre || tag || giStr || geStr || wiStr || weStr || langs.length || completion || origin || minCh || maxCh || mature) ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-300">Active filters:</span>
            <Link
              href="/search"
              className="ml-auto text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
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
          {works.map((w) => {
            const blur = w.isMature && !canViewMature;
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
                    {w.type} • {w.author.name || w.author.username}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                    {w.chapterCount} ch • {w.completion}
                    {w.language ? ` • ${w.language.toUpperCase()}` : ""}
                  </div>
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                    <span> {w.likeCount}</span>
                    <span>⭐ {(Math.round(w.ratingAvg * 10) / 10).toFixed(1)} ({w.ratingCount})</span>
                  </div>
                  {w.warningTags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.warningTags.slice(0, 3).map((t) => (
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
