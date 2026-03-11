import "server-only";

import { AnalyticsAgeBand, Prisma, type UserGender } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { requireAdminSession } from "@/server/http/auth";
import { normalizeDateRange, startOfUtcDay, toIsoDate } from "@/server/analytics/aggregate/utils";

type RangeArgs = {
  start?: string | Date | null;
  end?: string | Date | null;
  days?: number | null;
  limit?: number | null;
};

function analyticsRangeWindow(start: Date, end: Date) {
  return { occurredAt: { gte: start, lt: new Date(startOfUtcDay(end).getTime() + 86400000) } };
}

function includedAnalyticsEventWhere(start: Date, end: Date): Prisma.AnalyticsEventWhereInput {
  return {
    ...analyticsRangeWindow(start, end),
    OR: [
      { userId: null },
      { user: { is: { role: "USER" } } },
    ],
  };
}

function includedAuthenticatedAnalyticsEventWhere(start: Date, end: Date): Prisma.AnalyticsEventWhereInput {
  return {
    ...analyticsRangeWindow(start, end),
    userId: { not: null },
    user: { is: { role: "USER" } },
  };
}

function excludedAdminAnalyticsEventWhere(start: Date, end: Date): Prisma.AnalyticsEventWhereInput {
  return {
    ...analyticsRangeWindow(start, end),
    userId: { not: null },
    user: { is: { role: "ADMIN" } },
  };
}


function aggregateEventTypeRows(rows: Array<{ userId: string | null; eventType: string; _count: { _all: number } }>) {
  const map = new Map<string, Record<string, number>>();
  for (const row of rows) {
    if (!row.userId) continue;
    const bucket = map.get(row.userId) || {};
    bucket[row.eventType] = Number(row._count._all || 0);
    map.set(row.userId, bucket);
  }
  return map;
}

function sumRows<T extends Record<string, any>>(rows: T[], numericKeys: string[]) {
  return rows.reduce(
    (acc, row) => {
      for (const key of numericKeys) acc[key] = (acc[key] || 0) + Number(row[key] || 0);
      return acc;
    },
    {} as Record<string, number>
  );
}

async function getActiveUserWindowCount(days: number) {
  const endExclusive = new Date();
  const startInclusive = new Date();
  startInclusive.setUTCDate(startInclusive.getUTCDate() - (days - 1));
  startInclusive.setUTCHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      occurredAt: { gte: startInclusive, lt: endExclusive },
      userId: { not: null },
      user: { is: { role: "USER" } },
    },
    select: { userId: true },
  });
  return new Set(events.map((entry) => entry.userId).filter(Boolean)).size;
}

export async function getAdminAnalyticsData(args: RangeArgs = {}) {
  await requireAdminSession();

  const { start, end } = normalizeDateRange(args);
  const limit = Math.max(1, Math.min(50, Number(args.limit || 10)));
  const excludedAdminWhere = excludedAdminAnalyticsEventWhere(start, end);

  const [overviewRows, workRows, genreRows, creatorRows, searchRows, demographicRows, dau, wau, mau, includedAccounts, excludedAdminAccounts] = await Promise.all([
    prisma.analyticsDailyOverview.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.analyticsDailyWork.groupBy({
      by: ["workId"],
      where: { date: { gte: start, lte: end } },
      _sum: {
        uniqueViewers: true,
        views: true,
        chapterViews: true,
        bookmarkAdds: true,
        likes: true,
        comments: true,
        ratingsCount: true,
        ratingSum: true,
      },
      orderBy: { _sum: { views: "desc" } },
      take: limit,
    }),
    prisma.analyticsDailyGenre.groupBy({
      by: ["genreId"],
      where: { date: { gte: start, lte: end } },
      _sum: {
        uniqueViewers: true,
        workViews: true,
        chapterViews: true,
        bookmarkAdds: true,
        likes: true,
        comments: true,
        ratingsCount: true,
        ratingSum: true,
      },
      orderBy: { _sum: { workViews: "desc" } },
      take: limit,
    }),
    prisma.analyticsDailyCreator.groupBy({
      by: ["userId"],
      where: { date: { gte: start, lte: end } },
      _sum: {
        publishedWorks: true,
        publishedChapters: true,
        uniqueViewers: true,
        workViews: true,
        chapterViews: true,
        bookmarkAdds: true,
        likes: true,
        comments: true,
        followersGained: true,
      },
      orderBy: { _sum: { uniqueViewers: "desc" } },
      take: limit,
    }),
    prisma.analyticsDailySearch.groupBy({
      by: ["normalizedQuery", "searchType"],
      where: { date: { gte: start, lte: end } },
      _sum: { count: true, zeroResultCount: true, clickCount: true },
      orderBy: { _sum: { count: "desc" } },
      take: limit,
    }),
    prisma.analyticsDailyDemographic.groupBy({
      by: ["gender", "ageBand"],
      where: { date: { gte: start, lte: end } },
      _sum: {
        uniqueUsers: true,
        workViews: true,
        chapterViews: true,
        bookmarkAdds: true,
        likes: true,
        comments: true,
      },
    }),
    prisma.analyticsDailyOverview.findFirst({
      where: { date: startOfUtcDay(new Date()) },
      select: { activeUsers: true, uniqueVisitors: true },
    }),
    getActiveUserWindowCount(7),
    getActiveUserWindowCount(30),
    prisma.analyticsEvent.findMany({
      where: includedAuthenticatedAnalyticsEventWhere(start, end),
      select: { userId: true },
    }).then((rows) => new Set(rows.map((row) => row.userId).filter(Boolean)).size),
    prisma.analyticsEvent.findMany({
      where: excludedAdminWhere,
      select: { userId: true },
    }).then((rows) => new Set(rows.map((row) => row.userId).filter(Boolean)).size),
  ]);

  const totals = sumRows(overviewRows, [
    "uniqueVisitors",
    "activeUsers",
    "guestVisitors",
    "newUsers",
    "pageViews",
    "workViews",
    "chapterViews",
    "bookmarkAdds",
    "bookmarkRemoves",
    "workLikes",
    "chapterLikes",
    "commentsCreated",
    "ratingsSubmitted",
    "followsCreated",
    "searches",
    "reportsCreated",
  ]);

  const workIds = workRows.map((row) => row.workId);
  const genreIds = genreRows.map((row) => row.genreId);
  const creatorIds = creatorRows.map((row) => row.userId);

  const [works, genres, creators] = await Promise.all([
    workIds.length
      ? prisma.work.findMany({
          where: { id: { in: workIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            comicType: true,
            publishType: true,
            coverImage: true,
          },
        })
      : Promise.resolve([]),
    genreIds.length
      ? prisma.genre.findMany({ where: { id: { in: genreIds } }, select: { id: true, name: true, slug: true } })
      : Promise.resolve([]),
    creatorIds.length
      ? prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, username: true, name: true, image: true },
        })
      : Promise.resolve([]),
  ]);

  const workMap = new Map(works.map((item) => [item.id, item]));
  const genreMap = new Map(genres.map((item) => [item.id, item]));
  const creatorMap = new Map(creators.map((item) => [item.id, item]));

  return {
    range: {
      start: toIsoDate(start),
      end: toIsoDate(end),
      days: Math.max(1, Math.floor((startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) / 86400000) + 1),
    },
    headline: {
      dau: Number(dau?.activeUsers || 0),
      dailyVisitors: Number(dau?.uniqueVisitors || 0),
      wau,
      mau,
      totals,
    },
    overviewSeries: overviewRows.map((row) => ({
      date: toIsoDate(row.date),
      uniqueVisitors: row.uniqueVisitors,
      activeUsers: row.activeUsers,
      guestVisitors: row.guestVisitors,
      newUsers: row.newUsers,
      pageViews: row.pageViews,
      workViews: row.workViews,
      chapterViews: row.chapterViews,
      bookmarkAdds: row.bookmarkAdds,
      commentsCreated: row.commentsCreated,
      ratingsSubmitted: row.ratingsSubmitted,
      searches: row.searches,
      reportsCreated: row.reportsCreated,
    })),
    topWorks: workRows.map((row) => ({
      work: workMap.get(row.workId) || { id: row.workId, title: "Unknown work", slug: null, type: "NOVEL", comicType: "UNKNOWN", publishType: "ORIGINAL", coverImage: null },
      metrics: {
        uniqueViewers: Number(row._sum.uniqueViewers || 0),
        views: Number(row._sum.views || 0),
        chapterViews: Number(row._sum.chapterViews || 0),
        bookmarkAdds: Number(row._sum.bookmarkAdds || 0),
        likes: Number(row._sum.likes || 0),
        comments: Number(row._sum.comments || 0),
        ratingsCount: Number(row._sum.ratingsCount || 0),
        ratingAvg: row._sum.ratingsCount ? Number(row._sum.ratingSum || 0) / Number(row._sum.ratingsCount || 1) : 0,
      },
    })),
    topGenres: genreRows.map((row) => ({
      genre: genreMap.get(row.genreId) || { id: row.genreId, name: "Unknown genre", slug: null },
      metrics: {
        uniqueViewers: Number(row._sum.uniqueViewers || 0),
        workViews: Number(row._sum.workViews || 0),
        chapterViews: Number(row._sum.chapterViews || 0),
        bookmarkAdds: Number(row._sum.bookmarkAdds || 0),
        likes: Number(row._sum.likes || 0),
        comments: Number(row._sum.comments || 0),
        ratingsCount: Number(row._sum.ratingsCount || 0),
        ratingAvg: row._sum.ratingsCount ? Number(row._sum.ratingSum || 0) / Number(row._sum.ratingsCount || 1) : 0,
      },
    })),
    topCreators: creatorRows.map((row) => ({
      creator: creatorMap.get(row.userId) || { id: row.userId, username: null, name: "Unknown creator", image: null },
      metrics: {
        publishedWorks: Number(row._sum.publishedWorks || 0),
        publishedChapters: Number(row._sum.publishedChapters || 0),
        uniqueViewers: Number(row._sum.uniqueViewers || 0),
        workViews: Number(row._sum.workViews || 0),
        chapterViews: Number(row._sum.chapterViews || 0),
        bookmarkAdds: Number(row._sum.bookmarkAdds || 0),
        likes: Number(row._sum.likes || 0),
        comments: Number(row._sum.comments || 0),
        followersGained: Number(row._sum.followersGained || 0),
      },
    })),
    topSearches: searchRows.map((row) => ({
      query: row.normalizedQuery,
      searchType: row.searchType,
      count: Number(row._sum.count || 0),
      zeroResultCount: Number(row._sum.zeroResultCount || 0),
      clickCount: Number(row._sum.clickCount || 0),
    })),
    dataQuality: {
      includedAccounts,
      excludedAdminAccounts,
    },
    demographics: {
      byGender: ([null, "MALE", "FEMALE", "PREFER_NOT_TO_SAY"] as Array<UserGender | null>).map((gender) => {
        const rows = demographicRows.filter((row) => row.gender === gender);
        const metrics = sumRows(
          rows.map((row) => row._sum),
          ["uniqueUsers", "workViews", "chapterViews", "bookmarkAdds", "likes", "comments"]
        );
        return {
          gender,
          metrics,
        };
      }),
      byAgeBand: Object.values(AnalyticsAgeBand).map((ageBand) => {
        const rows = demographicRows.filter((row) => row.ageBand === ageBand);
        const metrics = sumRows(
          rows.map((row) => row._sum),
          ["uniqueUsers", "workViews", "chapterViews", "bookmarkAdds", "likes", "comments"]
        );
        return {
          ageBand,
          metrics,
        };
      }),
      byGenderAndAgeBand: demographicRows.map((row) => ({
        gender: row.gender,
        ageBand: row.ageBand,
        metrics: {
          uniqueUsers: Number(row._sum.uniqueUsers || 0),
          workViews: Number(row._sum.workViews || 0),
          chapterViews: Number(row._sum.chapterViews || 0),
          bookmarkAdds: Number(row._sum.bookmarkAdds || 0),
          likes: Number(row._sum.likes || 0),
          comments: Number(row._sum.comments || 0),
        },
      })),
    },
  };
}

export async function getAdminAnalyticsDetailData(args: RangeArgs = {}) {
  await requireAdminSession();

  const { start, end } = normalizeDateRange(args);
  const limit = Math.max(10, Math.min(200, Number(args.limit || 50)));
  const includedWhere = includedAnalyticsEventWhere(start, end);
  const includedAuthenticatedWhere = includedAuthenticatedAnalyticsEventWhere(start, end);
  const excludedAdminWhere = excludedAdminAnalyticsEventWhere(start, end);

  const [includedEventsTotal, excludedAdminEventsTotal, guestEventRows, includedUserSummaryRows, includedUserEventTypeRows, excludedAdminSummaryRows, excludedAdminEventTypeRows, recentIncludedEvents] = await Promise.all([
    prisma.analyticsEvent.count({ where: includedWhere }),
    prisma.analyticsEvent.count({ where: excludedAdminWhere }),
    prisma.analyticsEvent.findMany({
      where: { ...includedWhere, userId: null },
      select: { sessionKey: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: includedAuthenticatedWhere,
      _count: { _all: true },
      _min: { occurredAt: true },
      _max: { occurredAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["userId", "eventType"],
      where: includedAuthenticatedWhere,
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: excludedAdminWhere,
      _count: { _all: true },
      _min: { occurredAt: true },
      _max: { occurredAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["userId", "eventType"],
      where: excludedAdminWhere,
      _count: { _all: true },
    }),
    prisma.analyticsEvent.findMany({
      where: includedWhere,
      orderBy: { occurredAt: "desc" },
      take: limit,
      select: {
        id: true,
        occurredAt: true,
        eventType: true,
        path: true,
        userId: true,
        sessionKey: true,
      },
    }),
  ]);

  const includedEventTypeMap = aggregateEventTypeRows(includedUserEventTypeRows);
  const excludedAdminEventTypeMap = aggregateEventTypeRows(excludedAdminEventTypeRows);

  const identityIds = Array.from(
    new Set([
      ...includedUserSummaryRows.map((row) => row.userId).filter(Boolean),
      ...excludedAdminSummaryRows.map((row) => row.userId).filter(Boolean),
      ...recentIncludedEvents.map((row) => row.userId).filter(Boolean),
    ])
  ) as string[];

  const identities = identityIds.length
    ? await prisma.user.findMany({
        where: { id: { in: identityIds } },
        select: { id: true, username: true, name: true, email: true, image: true, role: true },
      })
    : [];
  const identityMap = new Map(identities.map((user) => [user.id, user]));

  const includedAccounts = includedUserSummaryRows
    .map((row) => ({
      user: identityMap.get(row.userId || "") || null,
      totalEvents: Number(row._count._all || 0),
      firstSeenAt: row._min.occurredAt?.toISOString?.() ?? null,
      lastSeenAt: row._max.occurredAt?.toISOString?.() ?? null,
      eventTypes: includedEventTypeMap.get(row.userId || "") || {},
    }))
    .sort((a, b) => b.totalEvents - a.totalEvents);

  const excludedAdminAccounts = excludedAdminSummaryRows
    .map((row) => ({
      user: identityMap.get(row.userId || "") || null,
      totalEvents: Number(row._count._all || 0),
      firstSeenAt: row._min.occurredAt?.toISOString?.() ?? null,
      lastSeenAt: row._max.occurredAt?.toISOString?.() ?? null,
      eventTypes: excludedAdminEventTypeMap.get(row.userId || "") || {},
    }))
    .sort((a, b) => b.totalEvents - a.totalEvents);

  const guestSessions = new Set(guestEventRows.map((row) => row.sessionKey).filter(Boolean)).size;

  return {
    range: {
      start: toIsoDate(start),
      end: toIsoDate(end),
      days: Math.max(1, Math.floor((startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) / 86400000) + 1),
    },
    summary: {
      includedEventsTotal,
      includedAccounts: includedAccounts.length,
      guestSessions,
      excludedAdminEventsTotal,
      excludedAdminAccounts: excludedAdminAccounts.length,
    },
    includedAccounts,
    excludedAdminAccounts,
    recentIncludedEvents: recentIncludedEvents.map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.eventType,
      path: event.path,
      sessionKey: event.sessionKey,
      user: event.userId ? identityMap.get(event.userId) || null : null,
    })),
  };
}
