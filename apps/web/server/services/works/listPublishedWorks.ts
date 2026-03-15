import "server-only";

import prisma from "@/server/db/prisma";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import { parseCursor, parseSkip, parseTake, nextCursorFromRows } from "@/server/db/pagination";
import { workCardSelect } from "@/server/db/selectors";
import { getViewerWithPrefs, type ViewerWithPrefs } from "./viewer";
import { profileHotspot } from "@/server/observability/profiling";
import {
  applyViewerWorkInteractions,
  getViewerWorkInteractions,
  type ViewerWorkInteractions,
} from "./viewerInteractions";

function splitCsv(v: string | null): string[] {
  return (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function getAllCsv(searchParams: URLSearchParams, key: string): string[] {
  const vals = searchParams.getAll(key);
  const merged = vals.flatMap((x) => String(x).split(","));
  return merged
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function upperEnum(v: string | null) {
  return (v || "").trim().toUpperCase();
}

function tagToSlug(tag: string) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function legacyDeviantGenreSlugs() {
  // Older DBs may have these as Genre rows. Treat them as Deviant Love for gating.
  const base = new Set<string>([
    ...deviantLoveTagSlugs(),
    "lgbtq",
    "bara-ml",
    "alpha-beta-omega",
  ]);
  return Array.from(base);
}

export type ListPublishedWorksOptions = {
  viewer?: ViewerWithPrefs | null;
  includeViewerInteractions?: boolean;
  viewerWorkInteractions?: ViewerWorkInteractions | null;
};

function withViewerSummary(viewer: ViewerWithPrefs | null, canViewMature: boolean, canViewDeviantLove: boolean) {
  if (!viewer) return null;

  return {
    adultConfirmed: viewer.adultConfirmed,
    deviantLoveConfirmed: viewer.deviantLoveConfirmed,
    canViewMature,
    canViewDeviantLove,
    role: viewer.role,
  };
}

export async function listPublishedWorksFromSearchParams(
  searchParams: URLSearchParams,
  options?: ListPublishedWorksOptions
) {
  // Basic
  const type = upperEnum(searchParams.get("type")); // NOVEL | COMIC
  const q = (searchParams.get("q") || "").trim();
  const genre = (searchParams.get("genre") || "").trim().toLowerCase();
  const tag = (searchParams.get("tag") || "").trim();

  // Tri-state (csv slugs)
  const includeGenres = splitCsv(searchParams.get("gi"));
  const excludeGenres = splitCsv(searchParams.get("ge"));
  const gmode = (searchParams.get("gmode") || "or").toLowerCase() === "and" ? "and" : "or";

  let includeWarnings = splitCsv(searchParams.get("wi"));
  let excludeWarnings = splitCsv(searchParams.get("we"));
  const wmode = (searchParams.get("wmode") || "or").toLowerCase() === "and" ? "and" : "or";

  // Deviant Love tri-state (csv slugs)
  let includeDeviant = splitCsv(searchParams.get("di"));
  let excludeDeviant = splitCsv(searchParams.get("de"));
  const dmode = (searchParams.get("dmode") || "or").toLowerCase() === "and" ? "and" : "or";

  // Advanced
  const completion = upperEnum(searchParams.get("completion"));
  const origin = upperEnum(searchParams.get("origin"));
  const minCh = Math.max(0, parseInt(searchParams.get("minCh") || "0", 10) || 0);
  const maxCh = Math.max(0, parseInt(searchParams.get("maxCh") || "0", 10) || 0);

  // NSFW
  const mature = (searchParams.get("mature") || "").toLowerCase(); // hide|include|only

  // Prefs overrides
  const ignoreBlocked = (searchParams.get("ignoreBlocked") || "") === "1";
  const ignoreLang = (searchParams.get("ignoreLang") || "") === "1";

  // Language
  let langs = getAllCsv(searchParams, "lang");

  // Creator/publish filters (v12)
  const author = (searchParams.get("author") || "").trim();
  const translator = (searchParams.get("translator") || "").trim();
  const publishType = upperEnum(searchParams.get("publishType")); // ORIGINAL | TRANSLATION | REUPLOAD
  const comicType = upperEnum(searchParams.get("comicType")); // MANGA | MANHWA | MANHUA | WEBTOON | ...

  // Pagination
  const take = parseTake(searchParams, { def: 24, min: 1, max: 60 });
  const skip = parseSkip(searchParams, { def: 0, min: 0, max: 5000 });
  const cursor = parseCursor(searchParams);

  // Sorting
  const sort = (searchParams.get("sort") || "newest").toLowerCase(); // newest|liked|rated

  const viewer = options && "viewer" in options ? options.viewer ?? null : await getViewerWithPrefs();

  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = !!viewer && (viewer.role === "ADMIN" || viewer.adultConfirmed);

  const canViewDeviantLove =
    !!viewer && (viewer.role === "ADMIN" || (viewer.adultConfirmed && viewer.deviantLoveConfirmed));

  // NSFW tag filters are age-locked. If the viewer isn't 18+ confirmed (or not logged in),
  // ignore wi/we completely so it can't be used via URL tricks.
  const canUseNsfwTags = !!viewer && (viewer.role === "ADMIN" || viewer.adultConfirmed === true);
  if (!canUseNsfwTags) {
    includeWarnings = [];
    excludeWarnings = [];
  }

  // Deviant Love filters are locked. Ignore di/de if not unlocked.
  if (!canViewDeviantLove) {
    includeDeviant = [];
    excludeDeviant = [];
  }

  // Language default from prefs
  if (!ignoreLang && langs.length === 0 && viewer?.preferredLanguages?.length) {
    langs = viewer.preferredLanguages;
  }

  // Normalize include/exclude conflicts
  const includeGenresSet = new Set(includeGenres);
  const includeWarningsSet = new Set(includeWarnings);
  const includeDeviantSet = new Set(includeDeviant);
  const effectiveExcludeGenres = excludeGenres.filter((g) => !includeGenresSet.has(g));
  const effectiveExcludeWarnings = excludeWarnings.filter((w) => !includeWarningsSet.has(w));
  const effectiveExcludeDeviant = excludeDeviant.filter((d) => !includeDeviantSet.has(d));

  const isAdmin = !!viewer && viewer.role === "ADMIN";
  const where: any = isAdmin ? {} : { status: "PUBLISHED" };

  if (type === "NOVEL" || type === "COMIC") where.type = type;

  if (
    comicType === "MANGA" ||
    comicType === "MANHWA" ||
    comicType === "MANHUA" ||
    comicType === "WEBTOON" ||
    comicType === "WESTERN" ||
    comicType === "OTHER" ||
    comicType === "UNKNOWN"
  ) {
    // UI should omit this param for "Any".
    where.comicType = comicType;
  }

  // Mature enforcement
  if (!canViewMature) {
    where.isMature = false;
  } else {
    if (mature === "hide") where.isMature = false;
    if (mature === "only") where.isMature = true;
    // include => no filter
  }

  const AND: any[] = [];

  // Genre dropdown (legacy)
  if (genre) {
    AND.push({ genres: { some: { slug: genre } } });
  }

  // Genre tri-state
  if (includeGenres.length) {
    if (gmode === "and") {
      AND.push(...includeGenres.map((slug) => ({ genres: { some: { slug } } })));
    } else {
      AND.push({ genres: { some: { slug: { in: includeGenres } } } });
    }
  }
  if (effectiveExcludeGenres.length) {
    AND.push({ genres: { none: { slug: { in: effectiveExcludeGenres } } } });
  }

  // Warning tri-state
  if (includeWarnings.length) {
    if (wmode === "and") {
      AND.push(...includeWarnings.map((slug) => ({ warningTags: { some: { slug } } })));
    } else {
      AND.push({ warningTags: { some: { slug: { in: includeWarnings } } } });
    }
  }
  if (effectiveExcludeWarnings.length) {
    AND.push({ warningTags: { none: { slug: { in: effectiveExcludeWarnings } } } });
  }

  // Deviant Love gating + tri-state
  if (!canViewDeviantLove) {
    // Hide any work that has at least 1 deviantLoveTag.
    AND.push({ deviantLoveTags: { none: {} } });
    // Also hide legacy deviant genres (older DBs).
    const legacy = legacyDeviantGenreSlugs();
    if (legacy.length) AND.push({ genres: { none: { slug: { in: legacy } } } });
  } else {
    if (includeDeviant.length) {
      if (dmode === "and") {
        AND.push(
          ...includeDeviant.map((slug) => ({
            OR: [{ deviantLoveTags: { some: { slug } } }, { genres: { some: { slug } } }],
          }))
        );
      } else {
        AND.push({
          OR: [
            { deviantLoveTags: { some: { slug: { in: includeDeviant } } } },
            { genres: { some: { slug: { in: includeDeviant } } } },
          ],
        });
      }
    }
    if (effectiveExcludeDeviant.length) {
      AND.push({ deviantLoveTags: { none: { slug: { in: effectiveExcludeDeviant } } } });
      AND.push({ genres: { none: { slug: { in: effectiveExcludeDeviant } } } });
    }
  }

  // Completion/origin
  if (completion) AND.push({ completion });
  if (origin) AND.push({ origin });

  // Chapter count
  if (minCh > 0) AND.push({ chapterCount: { gte: minCh } });
  if (maxCh > 0) AND.push({ chapterCount: { lte: maxCh } });

  // Tag filter
  if (tag) {
    const slug = tagToSlug(tag);
    AND.push({
      tags: {
        some: {
          OR: [
            { name: { contains: tag, mode: "insensitive" as const } },
            ...(slug ? [{ slug }] : []),
          ],
        },
      },
    });
  }

  // Keyword
  if (q) {
    AND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { slug: { contains: q.toLowerCase(), mode: "insensitive" as const } },
      ],
    });
  }

  // Language
  if (langs.length) {
    AND.push({ language: { in: Array.from(new Set(langs)) } });
  }

  // Publish type
  if (
    publishType === "ORIGINAL" ||
    publishType === "TRANSLATION" ||
    publishType === "REUPLOAD"
  ) {
    AND.push({ publishType });
  }

  // Author / Translator
  if (author) {
    AND.push({
      author: {
        OR: [
          { username: { contains: author, mode: "insensitive" as const } },
          { name: { contains: author, mode: "insensitive" as const } },
        ],
      },
    });
  }
  if (translator) {
    AND.push({
      translator: {
        OR: [
          { username: { contains: translator, mode: "insensitive" as const } },
          { name: { contains: translator, mode: "insensitive" as const } },
        ],
      },
    });
  }

  // User blocks (by ids)
  if (viewer && !ignoreBlocked) {
    if (viewer.blockedGenreIds.length) {
      AND.push({ genres: { none: { id: { in: viewer.blockedGenreIds } } } });
    }
    if (viewer.blockedWarningIds.length) {
      AND.push({ warningTags: { none: { id: { in: viewer.blockedWarningIds } } } });
    }
    if (viewer.blockedDeviantLoveIds.length) {
      AND.push({ deviantLoveTags: { none: { id: { in: viewer.blockedDeviantLoveIds } } } });
    }
  }

  if (AND.length) where.AND = AND;

  let orderBy: any = [{ updatedAt: "desc" }, { id: "desc" }];
  if (sort === "liked") orderBy = [{ likeCount: "desc" }, { id: "desc" }];
  if (sort === "rated") {
    orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { updatedAt: "desc" }, { id: "desc" }];
  }

  const query: any = {
    where,
    orderBy,
    take,
    select: workCardSelect,
  };

  const probeMeta = {
    sort,
    type: type || "ANY",
    publishType: publishType || "ANY",
    comicType: comicType || "ANY",
    hasQuery: !!q,
    hasTag: !!tag,
    hasAuthor: !!author,
    hasTranslator: !!translator,
    includeGenreCount: includeGenres.length,
    excludeGenreCount: effectiveExcludeGenres.length,
    includeWarningCount: includeWarnings.length,
    excludeWarningCount: effectiveExcludeWarnings.length,
    includeDeviantCount: includeDeviant.length,
    excludeDeviantCount: effectiveExcludeDeviant.length,
    langCount: langs.length,
    matureMode: mature || "default",
    cursorMode: cursor ? "cursor" : "offset",
    take,
    skip: cursor ? 0 : skip,
    hasViewer: !!viewer?.id,
    canViewMature,
    canViewDeviantLove,
  };

  // Cursor pagination (optional). Falls back to offset pagination (skip).
  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  } else {
    query.skip = skip;
  }

  const works = await profileHotspot("listPublishedWorks.findMany", probeMeta, () => prisma.work.findMany(query));
  const nextCursor = nextCursorFromRows(works as any, take);

  const workIds = (works as any[]).map((work: any) => work.id).filter(Boolean);
  const chapterLoveRows = workIds.length
    ? await profileHotspot("listPublishedWorks.chapterLoveSums", { workCount: workIds.length }, () =>
        prisma.chapter.groupBy({
          by: ["workId"],
          where: { workId: { in: workIds }, status: "PUBLISHED" },
          _sum: { likeCount: true },
        })
      )
    : [];
  const chapterLoveMap = new Map(chapterLoveRows.map((row: any) => [row.workId, Number(row._sum?.likeCount ?? 0)]));

  const worksEnriched = (works as any[]).map((work: any) => ({
    ...work,
    chapterLoveCount: chapterLoveMap.get(work.id) ?? 0,
  }));

  let worksWithViewer: any[] = worksEnriched as any;
  if (viewer?.id && works.length) {
    let interactions = options?.viewerWorkInteractions ?? null;

    if (!interactions && options?.includeViewerInteractions !== false) {
      interactions = await profileHotspot("listPublishedWorks.viewerInteractions", { workCount: works.length }, () =>
        getViewerWorkInteractions(
          viewer.id,
          worksEnriched.map((work: any) => work.id)
        )
      );
    }

    if (interactions) {
      worksWithViewer = applyViewerWorkInteractions(worksEnriched as any[], interactions);
    }
  }

  return {
    works: worksWithViewer,
    nextCursor,
    viewer: withViewerSummary(viewer, canViewMature, canViewDeviantLove),
  };
}

export async function listPublishedWorks(req: Request) {
  const { searchParams } = new URL(req.url);
  return listPublishedWorksFromSearchParams(searchParams);
}
