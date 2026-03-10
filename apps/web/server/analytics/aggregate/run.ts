import "server-only";

import {
  AnalyticsEventType,
  Prisma,
  type AnalyticsAgeBand,
  type UserGender,
} from "@prisma/client";
import prisma from "@/server/db/prisma";
import {
  addUtcDays,
  extractGenreIds,
  extractMetadataNumber,
  extractMetadataString,
  getAgeBand,
  getVisitorKey,
  listUtcDays,
  normalizeDateRange,
  normalizeGender,
  normalizeSearchQuery,
  startOfUtcDay,
  toIsoDate,
} from "./utils";

type AggregationRunArgs = {
  start?: Date | string | null;
  end?: Date | string | null;
  days?: number | null;
};

type DemographicKey = `${string}|${string}`;

type MetricBucket = {
  uniqueVisitors?: Set<string>;
  uniqueUsers?: Set<string>;
  uniqueViewers?: Set<string>;
  uniqueViewerUsers?: Set<string>;
  views?: number;
  workViews?: number;
  chapterViews?: number;
  bookmarkAdds?: number;
  likes?: number;
  comments?: number;
  ratingsCount?: number;
  ratingSum?: number;
  publishedWorks?: number;
  publishedChapters?: number;
  followersGained?: number;
  count?: number;
  zeroResultCount?: number;
  clickCount?: number;
};

function increment(bucket: MetricBucket, key: keyof MetricBucket, value = 1) {
  const current = typeof bucket[key] === "number" ? (bucket[key] as number) : 0;
  (bucket as any)[key] = current + value;
}

function ensureBucket<T extends MetricBucket>(map: Map<string, T>, key: string, factory?: () => T) {
  const existing = map.get(key);
  if (existing) return existing;
  const next = factory ? factory() : ({} as T);
  map.set(key, next);
  return next;
}

function demographicKey(gender: UserGender | null, ageBand: AnalyticsAgeBand) {
  return `${gender || "UNKNOWN"}|${ageBand}` as DemographicKey;
}

async function deleteDailyRows(date: Date) {
  await prisma.$transaction([
    prisma.analyticsDailyDemographic.deleteMany({ where: { date } }),
    prisma.analyticsDailySearch.deleteMany({ where: { date } }),
    prisma.analyticsDailyCreator.deleteMany({ where: { date } }),
    prisma.analyticsDailyChapter.deleteMany({ where: { date } }),
    prisma.analyticsDailyWork.deleteMany({ where: { date } }),
    prisma.analyticsDailyGenre.deleteMany({ where: { date } }),
    prisma.analyticsDailyOverview.deleteMany({ where: { date } }),
  ]);
}

export async function aggregateAnalyticsDay(day: Date) {
  const date = startOfUtcDay(day);
  const nextDate = addUtcDays(date, 1);

  const events = await prisma.analyticsEvent.findMany({
    where: { occurredAt: { gte: date, lt: nextDate } },
    select: {
      id: true,
      eventType: true,
      userId: true,
      sessionKey: true,
      ipHash: true,
      workId: true,
      chapterId: true,
      genreId: true,
      ownerUserId: true,
      searchQuery: true,
      searchType: true,
      resultCount: true,
      metadata: true,
    },
  });

  const newUsers = await prisma.user.count({ where: { createdAt: { gte: date, lt: nextDate } } });
  const eventUserIds = Array.from(new Set(events.map((event) => event.userId).filter(Boolean))) as string[];
  const users = eventUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: eventUserIds } },
        select: { id: true, gender: true, birthYear: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const uniqueVisitors = new Set<string>();
  const activeUsers = new Set<string>();
  const guestVisitors = new Set<string>();

  const workBuckets = new Map<string, MetricBucket>();
  const chapterBuckets = new Map<string, MetricBucket>();
  const genreBuckets = new Map<string, MetricBucket>();
  const creatorBuckets = new Map<string, MetricBucket>();
  const searchBuckets = new Map<string, MetricBucket>();
  const demographicBuckets = new Map<DemographicKey, MetricBucket>();

  const overview = {
    pageViews: 0,
    workViews: 0,
    chapterViews: 0,
    bookmarkAdds: 0,
    bookmarkRemoves: 0,
    workLikes: 0,
    chapterLikes: 0,
    commentsCreated: 0,
    ratingsSubmitted: 0,
    followsCreated: 0,
    searches: 0,
    reportsCreated: 0,
  };

  for (const event of events) {
    const visitorKey = getVisitorKey(event);
    uniqueVisitors.add(visitorKey);
    if (event.userId) activeUsers.add(event.userId);
    else guestVisitors.add(visitorKey);

    const genreIds = extractGenreIds(event);
    const metadataRating = extractMetadataNumber(event.metadata, "value") || 0;
    const targetUserId = extractMetadataString(event.metadata, "targetUserId");

    if (event.workId) ensureBucket(workBuckets, event.workId, () => ({ uniqueViewers: new Set<string>() }));
    if (event.chapterId) ensureBucket(chapterBuckets, event.chapterId, () => ({ uniqueViewers: new Set<string>() }));
    if (event.ownerUserId) ensureBucket(creatorBuckets, event.ownerUserId, () => ({ uniqueViewers: new Set<string>() }));
    for (const genreId of genreIds) ensureBucket(genreBuckets, genreId, () => ({ uniqueViewers: new Set<string>() }));

    const user = event.userId ? userMap.get(event.userId) : null;
    const gender = normalizeGender(user?.gender ?? null);
    const ageBand = getAgeBand({ birthYear: user?.birthYear ?? null, referenceDate: date });
    const demoBucket = event.userId ? ensureBucket(demographicBuckets, demographicKey(gender, ageBand), () => ({ uniqueUsers: new Set<string>() })) : null;
    if (demoBucket && event.userId) demoBucket.uniqueUsers?.add(event.userId);

    switch (event.eventType) {
      case AnalyticsEventType.PAGE_VIEW:
        overview.pageViews += 1;
        break;

      case AnalyticsEventType.WORK_VIEW: {
        overview.workViews += 1;
        if (event.workId) {
          const bucket = ensureBucket(workBuckets, event.workId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "views");
        }
        if (event.ownerUserId) {
          const bucket = ensureBucket(creatorBuckets, event.ownerUserId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "workViews");
        }
        for (const genreId of genreIds) {
          const bucket = ensureBucket(genreBuckets, genreId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "workViews");
        }
        if (demoBucket) increment(demoBucket, "workViews");
        break;
      }

      case AnalyticsEventType.CHAPTER_VIEW: {
        overview.chapterViews += 1;
        if (event.workId) {
          const bucket = ensureBucket(workBuckets, event.workId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "chapterViews");
        }
        if (event.chapterId) {
          const bucket = ensureBucket(chapterBuckets, event.chapterId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "views");
        }
        if (event.ownerUserId) {
          const bucket = ensureBucket(creatorBuckets, event.ownerUserId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "chapterViews");
        }
        for (const genreId of genreIds) {
          const bucket = ensureBucket(genreBuckets, genreId, () => ({ uniqueViewers: new Set<string>() }));
          bucket.uniqueViewers?.add(visitorKey);
          increment(bucket, "chapterViews");
        }
        if (demoBucket) increment(demoBucket, "chapterViews");
        break;
      }

      case AnalyticsEventType.BOOKMARK_ADD:
        overview.bookmarkAdds += 1;
        if (event.workId) increment(ensureBucket(workBuckets, event.workId), "bookmarkAdds");
        if (event.ownerUserId) increment(ensureBucket(creatorBuckets, event.ownerUserId), "bookmarkAdds");
        for (const genreId of genreIds) increment(ensureBucket(genreBuckets, genreId), "bookmarkAdds");
        if (demoBucket) increment(demoBucket, "bookmarkAdds");
        break;

      case AnalyticsEventType.BOOKMARK_REMOVE:
        overview.bookmarkRemoves += 1;
        break;

      case AnalyticsEventType.WORK_LIKE:
        overview.workLikes += 1;
        if (event.workId) increment(ensureBucket(workBuckets, event.workId), "likes");
        if (event.ownerUserId) increment(ensureBucket(creatorBuckets, event.ownerUserId), "likes");
        for (const genreId of genreIds) increment(ensureBucket(genreBuckets, genreId), "likes");
        if (demoBucket) increment(demoBucket, "likes");
        break;

      case AnalyticsEventType.CHAPTER_LIKE:
        overview.chapterLikes += 1;
        if (event.chapterId) increment(ensureBucket(chapterBuckets, event.chapterId), "likes");
        if (event.workId) increment(ensureBucket(workBuckets, event.workId), "likes");
        if (event.ownerUserId) increment(ensureBucket(creatorBuckets, event.ownerUserId), "likes");
        for (const genreId of genreIds) increment(ensureBucket(genreBuckets, genreId), "likes");
        if (demoBucket) increment(demoBucket, "likes");
        break;

      case AnalyticsEventType.COMMENT_CREATE:
        overview.commentsCreated += 1;
        if (event.chapterId) increment(ensureBucket(chapterBuckets, event.chapterId), "comments");
        if (event.workId) increment(ensureBucket(workBuckets, event.workId), "comments");
        if (event.ownerUserId) increment(ensureBucket(creatorBuckets, event.ownerUserId), "comments");
        for (const genreId of genreIds) increment(ensureBucket(genreBuckets, genreId), "comments");
        if (demoBucket) increment(demoBucket, "comments");
        break;

      case AnalyticsEventType.RATING_SUBMIT:
        overview.ratingsSubmitted += 1;
        if (event.workId) {
          const bucket = ensureBucket(workBuckets, event.workId);
          increment(bucket, "ratingsCount");
          increment(bucket, "ratingSum", metadataRating);
        }
        for (const genreId of genreIds) {
          const bucket = ensureBucket(genreBuckets, genreId);
          increment(bucket, "ratingsCount");
          increment(bucket, "ratingSum", metadataRating);
        }
        break;

      case AnalyticsEventType.FOLLOW_USER:
        overview.followsCreated += 1;
        if (targetUserId) increment(ensureBucket(creatorBuckets, targetUserId), "followersGained");
        break;

      case AnalyticsEventType.SEARCH_SUBMIT: {
        overview.searches += 1;
        const normalizedQuery = normalizeSearchQuery(event.searchQuery);
        const searchType = String(event.searchType || "works").trim().toLowerCase() || "works";
        if (normalizedQuery) {
          const bucket = ensureBucket(searchBuckets, `${normalizedQuery}|${searchType}`);
          increment(bucket, "count");
          if (!event.resultCount) increment(bucket, "zeroResultCount");
        }
        break;
      }

      case AnalyticsEventType.SEARCH_RESULT_CLICK: {
        const normalizedQuery = normalizeSearchQuery(event.searchQuery);
        const searchType = String(event.searchType || "works").trim().toLowerCase() || "works";
        if (normalizedQuery) {
          const bucket = ensureBucket(searchBuckets, `${normalizedQuery}|${searchType}`);
          increment(bucket, "clickCount");
        }
        break;
      }

      case AnalyticsEventType.WORK_PUBLISH:
        if (event.ownerUserId || event.userId) increment(ensureBucket(creatorBuckets, event.ownerUserId || event.userId || ""), "publishedWorks");
        break;

      case AnalyticsEventType.CHAPTER_PUBLISH:
        if (event.ownerUserId || event.userId) increment(ensureBucket(creatorBuckets, event.ownerUserId || event.userId || ""), "publishedChapters");
        break;

      case AnalyticsEventType.REPORT_CREATE:
        overview.reportsCreated += 1;
        break;

      default:
        break;
    }
  }

  await deleteDailyRows(date);

  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.analyticsDailyOverview.create({
      data: {
        date,
        uniqueVisitors: uniqueVisitors.size,
        activeUsers: activeUsers.size,
        guestVisitors: guestVisitors.size,
        newUsers,
        pageViews: overview.pageViews,
        workViews: overview.workViews,
        chapterViews: overview.chapterViews,
        bookmarkAdds: overview.bookmarkAdds,
        bookmarkRemoves: overview.bookmarkRemoves,
        workLikes: overview.workLikes,
        chapterLikes: overview.chapterLikes,
        commentsCreated: overview.commentsCreated,
        ratingsSubmitted: overview.ratingsSubmitted,
        followsCreated: overview.followsCreated,
        searches: overview.searches,
        reportsCreated: overview.reportsCreated,
      },
    }),
  ];

  for (const [workId, bucket] of workBuckets) {
    writes.push(
      prisma.analyticsDailyWork.create({
        data: {
          date,
          workId,
          uniqueViewers: bucket.uniqueViewers?.size || 0,
          views: bucket.views || 0,
          chapterViews: bucket.chapterViews || 0,
          bookmarkAdds: bucket.bookmarkAdds || 0,
          likes: bucket.likes || 0,
          comments: bucket.comments || 0,
          ratingsCount: bucket.ratingsCount || 0,
          ratingSum: bucket.ratingSum || 0,
        },
      })
    );
  }

  for (const [chapterId, bucket] of chapterBuckets) {
    writes.push(
      prisma.analyticsDailyChapter.create({
        data: {
          date,
          chapterId,
          uniqueViewers: bucket.uniqueViewers?.size || 0,
          views: bucket.views || 0,
          likes: bucket.likes || 0,
          comments: bucket.comments || 0,
        },
      })
    );
  }

  for (const [genreId, bucket] of genreBuckets) {
    writes.push(
      prisma.analyticsDailyGenre.create({
        data: {
          date,
          genreId,
          uniqueViewers: bucket.uniqueViewers?.size || 0,
          workViews: bucket.workViews || 0,
          chapterViews: bucket.chapterViews || 0,
          bookmarkAdds: bucket.bookmarkAdds || 0,
          likes: bucket.likes || 0,
          comments: bucket.comments || 0,
          ratingsCount: bucket.ratingsCount || 0,
          ratingSum: bucket.ratingSum || 0,
        },
      })
    );
  }

  for (const [userId, bucket] of creatorBuckets) {
    if (!userId) continue;
    writes.push(
      prisma.analyticsDailyCreator.create({
        data: {
          date,
          userId,
          publishedWorks: bucket.publishedWorks || 0,
          publishedChapters: bucket.publishedChapters || 0,
          uniqueViewers: bucket.uniqueViewers?.size || 0,
          workViews: bucket.workViews || 0,
          chapterViews: bucket.chapterViews || 0,
          bookmarkAdds: bucket.bookmarkAdds || 0,
          likes: bucket.likes || 0,
          comments: bucket.comments || 0,
          followersGained: bucket.followersGained || 0,
        },
      })
    );
  }

  for (const [compoundKey, bucket] of searchBuckets) {
    const [normalizedQuery, searchType] = compoundKey.split("|");
    writes.push(
      prisma.analyticsDailySearch.create({
        data: {
          date,
          normalizedQuery,
          searchType,
          count: bucket.count || 0,
          zeroResultCount: bucket.zeroResultCount || 0,
          clickCount: bucket.clickCount || 0,
        },
      })
    );
  }

  for (const [compoundKey, bucket] of demographicBuckets) {
    const [genderKey, ageBand] = compoundKey.split("|");
    writes.push(
      prisma.analyticsDailyDemographic.create({
        data: {
          date,
          gender: genderKey === "UNKNOWN" ? null : (genderKey as UserGender),
          ageBand: ageBand as AnalyticsAgeBand,
          uniqueUsers: bucket.uniqueUsers?.size || 0,
          workViews: bucket.workViews || 0,
          chapterViews: bucket.chapterViews || 0,
          bookmarkAdds: bucket.bookmarkAdds || 0,
          likes: bucket.likes || 0,
          comments: bucket.comments || 0,
        },
      })
    );
  }

  await prisma.$transaction(writes);

  return {
    date: toIsoDate(date),
    eventsProcessed: events.length,
    uniqueVisitors: uniqueVisitors.size,
    activeUsers: activeUsers.size,
    workRows: workBuckets.size,
    chapterRows: chapterBuckets.size,
    genreRows: genreBuckets.size,
    creatorRows: creatorBuckets.size,
    searchRows: searchBuckets.size,
    demographicRows: demographicBuckets.size,
  };
}

export async function aggregateAnalyticsRange(args: AggregationRunArgs = {}) {
  const { start, end } = normalizeDateRange(args);
  const days = listUtcDays(start, end);
  const results = [] as Awaited<ReturnType<typeof aggregateAnalyticsDay>>[];
  for (const day of days) {
    results.push(await aggregateAnalyticsDay(day));
  }
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    daysProcessed: days.length,
    results,
  };
}
