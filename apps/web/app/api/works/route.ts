import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { parseJsonStringArray } from "@/lib/prefs";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";

export const runtime = "nodejs";

function splitCsv(v: string | null): string[] {
  return (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function getAllCsv(searchParams: URLSearchParams, key: string): string[] {
  const vals = searchParams.getAll(key);
  const merged = vals.flatMap((x) => String(x).split(","));
  return merged.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function numParam(v: string | null, def: number, min: number, max: number) {
  const n = v ? parseInt(v, 10) : def;
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
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
  const base = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  return Array.from(base);
}

async function getViewerWithPrefs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      adultConfirmed: true,
      deviantLoveConfirmed: true,
      preferredLanguagesJson: true,
      blockedGenres: { select: { id: true } },
      blockedWarnings: { select: { id: true } },
      blockedDeviantLove: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    adultConfirmed: user.adultConfirmed,
    deviantLoveConfirmed: user.deviantLoveConfirmed,
    preferredLanguages: parseJsonStringArray(user.preferredLanguagesJson).map((s) => String(s).toLowerCase()),
    blockedGenreIds: user.blockedGenres.map((g) => g.id),
    blockedWarningIds: user.blockedWarnings.map((w) => w.id),
    blockedDeviantLoveIds: user.blockedDeviantLove.map((d) => d.id),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

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
  const take = numParam(searchParams.get("take"), 24, 1, 60);
  const skip = numParam(searchParams.get("skip"), 0, 0, 5000);

  // Sorting
  const sort = (searchParams.get("sort") || "newest").toLowerCase(); // newest|liked|rated

  const viewer = await getViewerWithPrefs();
  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = !!viewer && (viewer.role === "ADMIN" || viewer.adultConfirmed);

  const canViewDeviantLove = !!viewer && (viewer.role === "ADMIN" || (viewer.adultConfirmed && viewer.deviantLoveConfirmed));

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

  const where: any = { status: "PUBLISHED" };

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
          OR: [{ name: { contains: tag, mode: "insensitive" as const } }, ...(slug ? [{ slug }] : [])],
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
  if (publishType === "ORIGINAL" || publishType === "TRANSLATION" || publishType === "REUPLOAD") {
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
    if (viewer.blockedGenreIds.length) AND.push({ genres: { none: { id: { in: viewer.blockedGenreIds } } } });
    if (viewer.blockedWarningIds.length) AND.push({ warningTags: { none: { id: { in: viewer.blockedWarningIds } } } });
    if (viewer.blockedDeviantLoveIds.length) AND.push({ deviantLoveTags: { none: { id: { in: viewer.blockedDeviantLoveIds } } } });
  }

  if (AND.length) where.AND = AND;

  let orderBy: any = { updatedAt: "desc" };
  if (sort === "liked") orderBy = { likeCount: "desc" };
  if (sort === "rated") orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { updatedAt: "desc" }];

  const works = await prisma.work.findMany({
    where,
    orderBy,
    take,
    skip,
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      updatedAt: true,
      type: true,
      comicType: true,
      likeCount: true,
      ratingAvg: true,
      ratingCount: true,
      isMature: true,
      language: true,
      completion: true,
      chapterCount: true,
      publishType: true,
      warningTags: { select: { name: true, slug: true } },
      author: { select: { username: true, name: true } },
      translator: { select: { username: true, name: true } },
    },
  });

  // Add viewer interaction flags for list rows (bookmark/favorite)
  let worksWithViewer: any[] = works as any;
  if (viewer?.id && works.length) {
    const ids = works.map((w: any) => w.id);
    const [likes, bookmarks] = await Promise.all([
      prisma.workLike.findMany({ where: { userId: viewer.id, workId: { in: ids } }, select: { workId: true } }),
      prisma.bookmark.findMany({ where: { userId: viewer.id, workId: { in: ids } }, select: { workId: true } }),
    ]);

    const likedSet = new Set(likes.map((x) => x.workId));
    const bookmarkedSet = new Set(bookmarks.map((x) => x.workId));

    worksWithViewer = works.map((w: any) => ({
      ...w,
      viewerFavorited: likedSet.has(w.id),
      viewerBookmarked: bookmarkedSet.has(w.id),
    }));
  }


  return NextResponse.json({
    works: worksWithViewer,
    viewer: viewer
      ? {
          adultConfirmed: viewer.adultConfirmed,
          deviantLoveConfirmed: viewer.deviantLoveConfirmed,
          canViewMature,
          canViewDeviantLove,
          role: viewer.role,
        }
      : null,
  });
}
