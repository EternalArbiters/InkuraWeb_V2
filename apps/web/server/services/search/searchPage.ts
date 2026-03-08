import "server-only";

import {
  PUBLIC_CONTENT_REVALIDATE,
  publicSearchShellTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import {
  getBooleanFlagParam,
  getOptionalEnumParam,
  getOptionalIntParam,
  getOptionalStringParam,
} from "@/server/http/queryParams";
import {
  listActiveDeviantLoveTags,
  listActiveGenres,
  listActiveWarningTags,
} from "@/server/services/taxonomy/publicTaxonomy";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getViewerWithPrefs } from "@/server/services/works/viewer";
import { profileHotspot } from "@/server/observability/profiling";

const SEARCH_KIND_VALUES = ["all", "novel", "comic"] as const;
const SEARCH_SORT_VALUES = ["newest", "liked", "rated"] as const;
const SEARCH_MODE_VALUES = ["or", "and"] as const;
const SEARCH_MATURE_VALUES = ["hide", "include", "only"] as const;
const SEARCH_COMPLETION_VALUES = ["ONGOING", "COMPLETED", "HIATUS", "CANCELLED"] as const;
const SEARCH_ORIGIN_VALUES = ["ORIGINAL", "FANFIC", "ADAPTATION", "UNKNOWN"] as const;
const SEARCH_PUBLISH_TYPE_VALUES = ["ORIGINAL", "TRANSLATION", "REUPLOAD"] as const;
const SEARCH_COMIC_TYPE_VALUES = [
  "MANGA",
  "MANHWA",
  "MANHUA",
  "WEBTOON",
  "WESTERN",
  "OTHER",
  "UNKNOWN",
] as const;

type SearchPageParamValue = string | string[] | undefined;
export type SearchPageRawParams = Record<string, SearchPageParamValue>;

export type SearchPageParsedParams = {
  q: string;
  kind: (typeof SEARCH_KIND_VALUES)[number];
  sort: (typeof SEARCH_SORT_VALUES)[number];
  tag: string;
  genre: string;
  includeGenres: string[];
  excludeGenres: string[];
  includeMode: (typeof SEARCH_MODE_VALUES)[number];
  includeWarnings: string[];
  excludeWarnings: string[];
  warningMode: (typeof SEARCH_MODE_VALUES)[number];
  includeDeviant: string[];
  excludeDeviant: string[];
  deviantMode: (typeof SEARCH_MODE_VALUES)[number];
  langs: string[];
  completion: (typeof SEARCH_COMPLETION_VALUES)[number] | "";
  origin: (typeof SEARCH_ORIGIN_VALUES)[number] | "";
  publishType: (typeof SEARCH_PUBLISH_TYPE_VALUES)[number] | "";
  comicType: (typeof SEARCH_COMIC_TYPE_VALUES)[number] | "";
  author: string;
  translator: string;
  minCh: number;
  maxCh: number;
  mature: (typeof SEARCH_MATURE_VALUES)[number] | "";
  ignoreBlocked: boolean;
  ignoreLang: boolean;
};

function splitList(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function toUrlSearchParams(raw: SearchPageRawParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(raw || {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) searchParams.append(key, String(item));
      });
      continue;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function getCsvParam(searchParams: URLSearchParams, key: string) {
  return splitList(getOptionalStringParam(searchParams, key));
}

function getMultiCsvParam(searchParams: URLSearchParams, key: string) {
  return Array.from(
    new Set(
      searchParams
        .getAll(key)
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function parseSearchPageParams(raw: SearchPageRawParams): SearchPageParsedParams {
  const searchParams = toUrlSearchParams(raw);

  return {
    q: getOptionalStringParam(searchParams, "q") || "",
    kind: getOptionalEnumParam(searchParams, "kind", SEARCH_KIND_VALUES, {
      normalize: (value) => value.trim().toLowerCase(),
    }) || "all",
    sort: getOptionalEnumParam(searchParams, "sort", SEARCH_SORT_VALUES, {
      normalize: (value) => value.trim().toLowerCase(),
    }) || "newest",
    tag: getOptionalStringParam(searchParams, "tag") || "",
    genre: (getOptionalStringParam(searchParams, "genre") || "").toLowerCase(),
    includeGenres: getCsvParam(searchParams, "gi"),
    excludeGenres: getCsvParam(searchParams, "ge"),
    includeMode: getOptionalEnumParam(searchParams, "gmode", SEARCH_MODE_VALUES, {
      normalize: (value) => value.trim().toLowerCase(),
    }) || "or",
    includeWarnings: getCsvParam(searchParams, "wi"),
    excludeWarnings: getCsvParam(searchParams, "we"),
    warningMode: getOptionalEnumParam(searchParams, "wmode", SEARCH_MODE_VALUES, {
      normalize: (value) => value.trim().toLowerCase(),
    }) || "or",
    includeDeviant: getCsvParam(searchParams, "di"),
    excludeDeviant: getCsvParam(searchParams, "de"),
    deviantMode: getOptionalEnumParam(searchParams, "dmode", SEARCH_MODE_VALUES, {
      normalize: (value) => value.trim().toLowerCase(),
    }) || "or",
    langs: getMultiCsvParam(searchParams, "lang"),
    completion:
      getOptionalEnumParam(searchParams, "completion", SEARCH_COMPLETION_VALUES, {
        normalize: (value) => value.trim().toUpperCase(),
      }) || "",
    origin:
      getOptionalEnumParam(searchParams, "origin", SEARCH_ORIGIN_VALUES, {
        normalize: (value) => value.trim().toUpperCase(),
      }) || "",
    publishType:
      getOptionalEnumParam(searchParams, "publishType", SEARCH_PUBLISH_TYPE_VALUES, {
        normalize: (value) => value.trim().toUpperCase(),
      }) || "",
    comicType:
      getOptionalEnumParam(searchParams, "comicType", SEARCH_COMIC_TYPE_VALUES, {
        normalize: (value) => value.trim().toUpperCase(),
      }) || "",
    author: getOptionalStringParam(searchParams, "author") || "",
    translator: getOptionalStringParam(searchParams, "translator") || "",
    minCh: getOptionalIntParam(searchParams, "minCh", { min: 0 }) || 0,
    maxCh: getOptionalIntParam(searchParams, "maxCh", { min: 0 }) || 0,
    mature:
      getOptionalEnumParam(searchParams, "mature", SEARCH_MATURE_VALUES, {
        normalize: (value) => value.trim().toLowerCase(),
      }) || "",
    ignoreBlocked: getBooleanFlagParam(searchParams, "ignoreBlocked"),
    ignoreLang: getBooleanFlagParam(searchParams, "ignoreLang"),
  };
}

export async function getPublicSearchShellData() {
  return withCachedPublicData(
    ["public-search-shell:v1"],
    [publicSearchShellTag(), "taxonomy"],
    PUBLIC_CONTENT_REVALIDATE.searchShell,
    async () =>
      profileHotspot("search.publicShell", { taxonomyBuckets: 3 }, async () => {
        const [genres, warningTags, deviantLoveTags] = await Promise.all([
        listActiveGenres({ take: 200 }),
        listActiveWarningTags({ take: 100 }),
        listActiveDeviantLoveTags({ take: 200 }),
      ]);

        return {
          genres,
          warningTags,
          deviantLoveTags,
        };
      })
  );
}

export async function getViewerSearchPayload() {
  const viewer = await profileHotspot("search.viewerPayload", {}, () => getViewerWithPrefs());
  const canViewMatureByPrefs = !!viewer?.adultConfirmed;
  const canUseNsfwTags = !!viewer?.adultConfirmed;
  const canUseDeviantLoveTags = !!viewer?.adultConfirmed && !!viewer?.deviantLoveConfirmed;

  return {
    viewer,
    canViewMatureByPrefs,
    showMatureFilter: canViewMatureByPrefs,
    canUseNsfwTags,
    canUseDeviantLoveTags,
  };
}

function buildSearchQueryParams(
  params: SearchPageParsedParams,
  options: {
    langs: string[];
    canUseNsfwTags: boolean;
    canUseDeviantLoveTags: boolean;
    includeWarnings: string[];
    excludeWarnings: string[];
    includeDeviant: string[];
    excludeDeviant: string[];
  }
) {
  const query = new URLSearchParams();
  query.set("take", "60");

  if (params.q) query.set("q", params.q);
  if (params.kind === "novel") query.set("type", "NOVEL");
  if (params.kind === "comic") query.set("type", "COMIC");
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  if (params.tag) query.set("tag", params.tag);
  if (params.genre) query.set("genre", params.genre);
  if (params.publishType) query.set("publishType", params.publishType);
  if (params.author) query.set("author", params.author);
  if (params.translator) query.set("translator", params.translator);
  if (params.comicType) query.set("comicType", params.comicType);
  if (params.includeGenres.length) query.set("gi", params.includeGenres.join(","));
  if (params.excludeGenres.length) query.set("ge", params.excludeGenres.join(","));
  if (params.includeMode === "and") query.set("gmode", "and");

  if (options.canUseNsfwTags) {
    if (options.includeWarnings.length) query.set("wi", options.includeWarnings.join(","));
    if (options.excludeWarnings.length) query.set("we", options.excludeWarnings.join(","));
    if (params.warningMode === "and") query.set("wmode", "and");
  }

  if (options.canUseDeviantLoveTags) {
    if (options.includeDeviant.length) query.set("di", options.includeDeviant.join(","));
    if (options.excludeDeviant.length) query.set("de", options.excludeDeviant.join(","));
    if (params.deviantMode === "and") query.set("dmode", "and");
  }

  if (options.langs.length) query.set("lang", options.langs.join(","));
  if (params.completion) query.set("completion", params.completion);
  if (params.origin) query.set("origin", params.origin);
  if (params.minCh) query.set("minCh", String(params.minCh));
  if (params.maxCh) query.set("maxCh", String(params.maxCh));
  if (params.mature) query.set("mature", params.mature);
  if (params.ignoreBlocked) query.set("ignoreBlocked", "1");
  if (params.ignoreLang) query.set("ignoreLang", "1");

  return query;
}

export async function getSearchPageData(raw: SearchPageRawParams) {
  const parsed = parseSearchPageParams(raw);
  const [publicShell, viewerPayload] = await Promise.all([getPublicSearchShellData(), getViewerSearchPayload()]);

  const includeGenres = parsed.includeGenres;
  const excludeGenres = parsed.excludeGenres.filter((value) => !includeGenres.includes(value));

  const includeWarnings = viewerPayload.canUseNsfwTags ? parsed.includeWarnings : [];
  const excludeWarnings = viewerPayload.canUseNsfwTags
    ? parsed.excludeWarnings.filter((value) => !includeWarnings.includes(value))
    : [];

  const includeDeviant = viewerPayload.canUseDeviantLoveTags ? parsed.includeDeviant : [];
  const excludeDeviant = viewerPayload.canUseDeviantLoveTags
    ? parsed.excludeDeviant.filter((value) => !includeDeviant.includes(value))
    : [];

  let langs = parsed.langs;
  if (!parsed.ignoreLang && langs.length === 0 && viewerPayload.viewer?.preferredLanguages?.length) {
    langs = viewerPayload.viewer.preferredLanguages.map((value) => String(value).toLowerCase());
  }

  const query = buildSearchQueryParams(parsed, {
    langs,
    canUseNsfwTags: viewerPayload.canUseNsfwTags,
    canUseDeviantLoveTags: viewerPayload.canUseDeviantLoveTags,
    includeWarnings,
    excludeWarnings,
    includeDeviant,
    excludeDeviant,
  });

  const worksResult = await profileHotspot("search.pageData", {
    hasQuery: !!parsed.q,
    kind: parsed.kind,
    sort: parsed.sort,
    hasFilters: !!(parsed.genre || parsed.tag || parsed.includeGenres.length || parsed.excludeGenres.length || parsed.includeWarnings.length || parsed.excludeWarnings.length || parsed.includeDeviant.length || parsed.excludeDeviant.length || parsed.langs.length || parsed.completion || parsed.origin || parsed.minCh || parsed.maxCh || parsed.mature),
  }, () => listPublishedWorksFromSearchParams(query, { viewer: viewerPayload.viewer }));
  const canViewMature = !!worksResult.viewer?.canViewMature || viewerPayload.canViewMatureByPrefs;
  const defaultHideMature = !canViewMature;

  const hasActiveFilters = !!(
    parsed.genre ||
    parsed.tag ||
    includeGenres.length ||
    excludeGenres.length ||
    includeWarnings.length ||
    excludeWarnings.length ||
    includeDeviant.length ||
    excludeDeviant.length ||
    langs.length ||
    parsed.completion ||
    parsed.origin ||
    parsed.minCh ||
    parsed.maxCh ||
    parsed.mature
  );

  return {
    ...parsed,
    langs,
    genres: publicShell.genres,
    warningTags: publicShell.warningTags,
    deviantLoveTags: publicShell.deviantLoveTags,
    includeGenres,
    excludeGenres,
    includeWarnings,
    excludeWarnings,
    includeDeviant,
    excludeDeviant,
    showMatureFilter: viewerPayload.showMatureFilter,
    canUseNsfwTags: viewerPayload.canUseNsfwTags,
    canUseDeviantLoveTags: viewerPayload.canUseDeviantLoveTags,
    canViewMature,
    defaultHideMature,
    works: worksResult.works,
    hasActiveFilters,
  };
}
