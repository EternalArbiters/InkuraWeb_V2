import "server-only";

import { AnalyticsEventType, AnalyticsTrafficSource, type Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { getAnalyticsChapterSnapshot, getAnalyticsWorkSnapshot } from "./snapshot";
import {
  detectDeviceType,
  ensureAnalyticsSession,
  getRequestCountryCode,
  getRequestIp,
  hashValue,
} from "./session";

function normalizeText(value: unknown, max = 240) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

function getTrafficSource(req?: Request | null): AnalyticsTrafficSource {
  const referrer = normalizeText(req?.headers.get("referer"), 500);
  if (!referrer) return AnalyticsTrafficSource.DIRECT;
  try {
    const ref = new URL(referrer);
    const host = ref.hostname.toLowerCase();
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return AnalyticsTrafficSource.SEARCH;
    if (/facebook\.|instagram\.|twitter\.|x\.com|tiktok\.|reddit\.|discord\./.test(host)) return AnalyticsTrafficSource.SOCIAL;
    if (req) {
      const reqHost = new URL(req.url).hostname.toLowerCase();
      if (host === reqHost) return AnalyticsTrafficSource.INTERNAL;
    }
    return AnalyticsTrafficSource.EXTERNAL;
  } catch {
    return AnalyticsTrafficSource.UNKNOWN;
  }
}

export type TrackAnalyticsEventInput = {
  req?: Request | null;
  eventType: AnalyticsEventType;
  userId?: string | null;
  sessionKey?: string | null;
  path?: string | null;
  routeName?: string | null;
  referrer?: string | null;
  workId?: string | null;
  chapterId?: string | null;
  ownerUserId?: string | null;
  workType?: "NOVEL" | "COMIC" | null;
  publishType?: "ORIGINAL" | "TRANSLATION" | "REUPLOAD" | null;
  comicType?: string | null;
  workOrigin?: string | null;
  translationLanguage?: string | null;
  isMature?: boolean | null;
  isDeviantLove?: boolean | null;
  genreId?: string | null;
  genreIds?: string[] | null;
  searchQuery?: string | null;
  searchType?: string | null;
  resultCount?: number | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function trackAnalyticsEvent(input: TrackAnalyticsEventInput) {
  const req = input.req;
  const userId = input.userId ?? null;

  let sessionId: string | null = null;
  let sessionKey: string | null = input.sessionKey ?? null;
  let ipHash: string | null = null;
  let userAgentHash: string | null = null;
  let countryCode: string | null = null;
  let deviceType = req ? detectDeviceType(req.headers.get("user-agent")) : detectDeviceType(null);

  if (req || sessionKey) {
    const ensured = await ensureAnalyticsSession({ req, userId, sessionKey });
    sessionId = ensured.sessionId;
    sessionKey = ensured.sessionKey;
    ipHash = ensured.ipHash;
    userAgentHash = ensured.userAgentHash;
    countryCode = ensured.countryCode;
    deviceType = ensured.deviceType;
  } else {
    ipHash = hashValue(getRequestIp(req));
    userAgentHash = hashValue(req?.headers.get("user-agent"));
    countryCode = getRequestCountryCode(req);
  }

  let workId = input.workId ?? null;
  let chapterId = input.chapterId ?? null;
  let ownerUserId = input.ownerUserId ?? null;
  let workType = input.workType ?? null;
  let publishType = input.publishType ?? null;
  let comicType = input.comicType ?? null;
  let workOrigin = input.workOrigin ?? null;
  let translationLanguage = input.translationLanguage ?? null;
  let isMature = typeof input.isMature === "boolean" ? input.isMature : null;
  let isDeviantLove = typeof input.isDeviantLove === "boolean" ? input.isDeviantLove : null;
  let genreIds = Array.isArray(input.genreIds) ? input.genreIds.filter(Boolean) : [];
  let genreId = input.genreId ?? genreIds[0] ?? null;

  if (chapterId && (!workId || !ownerUserId || !workType)) {
    const chapterSnapshot = await getAnalyticsChapterSnapshot(chapterId);
    if (chapterSnapshot) {
      workId = workId || chapterSnapshot.workId;
      ownerUserId = ownerUserId || chapterSnapshot.ownerUserId;
      workType = workType || chapterSnapshot.workType;
      publishType = publishType || chapterSnapshot.publishType;
      comicType = comicType || chapterSnapshot.comicType;
      workOrigin = workOrigin || chapterSnapshot.workOrigin;
      translationLanguage = translationLanguage || chapterSnapshot.translationLanguage;
      isMature = isMature ?? chapterSnapshot.isMature;
      isDeviantLove = isDeviantLove ?? chapterSnapshot.isDeviantLove;
      genreIds = genreIds.length ? genreIds : chapterSnapshot.genreIds;
      genreId = genreId || chapterSnapshot.primaryGenreId;
    }
  }

  if (workId && (!ownerUserId || !workType)) {
    const workSnapshot = await getAnalyticsWorkSnapshot(workId);
    if (workSnapshot) {
      ownerUserId = ownerUserId || workSnapshot.ownerUserId;
      workType = workType || workSnapshot.workType;
      publishType = publishType || workSnapshot.publishType;
      comicType = comicType || workSnapshot.comicType;
      workOrigin = workOrigin || workSnapshot.workOrigin;
      translationLanguage = translationLanguage || workSnapshot.translationLanguage;
      isMature = isMature ?? workSnapshot.isMature;
      isDeviantLove = isDeviantLove ?? workSnapshot.isDeviantLove;
      genreIds = genreIds.length ? genreIds : workSnapshot.genreIds;
      genreId = genreId || workSnapshot.primaryGenreId;
    }
  }

  const resolvedPath = input.path ?? (req ? new URL(req.url).pathname : null);

  await prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      userId,
      sessionId,
      sessionKey,
      isAuthenticated: !!userId,
      ipHash,
      userAgentHash,
      countryCode,
      deviceType,
      path: normalizeText(resolvedPath, 500),
      routeName: normalizeText(input.routeName, 160),
      referrer: normalizeText(input.referrer ?? req?.headers.get("referer"), 500),
      trafficSource: getTrafficSource(req),
      workId,
      chapterId,
      genreId,
      actorUserId: userId,
      ownerUserId,
      workType: workType as any,
      publishType: publishType as any,
      comicType: comicType as any,
      workOrigin: workOrigin as any,
      translationLanguage,
      isMature,
      isDeviantLove,
      searchQuery: normalizeText(input.searchQuery, 200),
      searchType: normalizeText(input.searchType, 80),
      resultCount: typeof input.resultCount === "number" && Number.isFinite(input.resultCount) ? Math.max(0, Math.floor(input.resultCount)) : null,
      metadata:
        input.metadata ??
        (genreIds.length
          ? ({ genreIds } as Prisma.InputJsonValue)
          : undefined),
    },
  });

  return { sessionKey };
}

export async function trackAnalyticsEventSafe(input: TrackAnalyticsEventInput) {
  try {
    return await trackAnalyticsEvent(input);
  } catch (error) {
    console.error("[analytics] track failed", error);
    return null;
  }
}

export async function trackAuthAnalyticsEvent(args: {
  eventType: AnalyticsEventType;
  userId?: string | null;
  path?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}) {
  return trackAnalyticsEventSafe({
    eventType: args.eventType,
    userId: args.userId ?? null,
    path: args.path ?? "/api/auth/[...nextauth]",
    routeName: "auth",
    metadata: args.metadata ?? null,
  });
}
