import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import {
  LEADERBOARD_CATEGORY_VALUES,
  LEADERBOARD_SOURCE_LABELS,
  LEADERBOARD_TOP_SIZE,
  STATIC_BADGE_TONES,
  USER_GENDER_VALUES,
  type LeaderboardCategoryValue,
  type RankBadgeTone,
  type StaticBadgeTone,
  type UserGenderValue,
  isAmountBasedLeaderboardCategory,
  isCommunityRankingEligibleUser,
  resolveCommunityMainTitle,
  resolveCreatorTitle,
  resolveNobleTitle,
  resolveRankBadgeTone,
} from "@/server/services/community/ranking";

const ALL_TIME_PERIOD = "ALL_TIME" as const;
const COMMUNITY_CATEGORY_ORDER = [...LEADERBOARD_CATEGORY_VALUES] as const;

export async function getLatestCommunityLeaderboardSnapshotAt() {
  const result = await prisma.leaderboardSnapshot.aggregate({ _max: { snapshotAt: true } });
  return result._max.snapshotAt ?? null;
}

type CommunityMetadataValue = string | number | boolean | string[];
export type CommunityMetadata = Record<string, CommunityMetadataValue>;

type CommunityEligibleUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
  createdAt: Date;
};

export type CommunityScoreRow = {
  userId: string;
  score: number;
  primaryMetric: number;
  breadthMetric: number;
  createdAt: Date;
  metadata: CommunityMetadata;
};

export type RankedCommunityScoreRow = CommunityScoreRow & {
  rank: number;
};

export type CommunityLeaderboardEntry = {
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  category: LeaderboardCategoryValue;
  label: string;
  rank: number;
  score: number;
  title: string | null;
  badgeTone: RankBadgeTone | StaticBadgeTone | null;
  isTopRanked: boolean;
  isAmountBased: boolean;
  metadata: CommunityMetadata | null;
  snapshotAt: Date;
};

export type CommunityStandingItem = {
  category: LeaderboardCategoryValue;
  label: string;
  rank: number | null;
  score: number;
  title: string | null;
  badgeTone: RankBadgeTone | StaticBadgeTone | null;
  isTopRanked: boolean;
  isAmountBased: boolean;
  metadata: CommunityMetadata | null;
};

export type CommunityStandingSummary = {
  user: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    gender: UserGenderValue | null;
    role: string;
  };
  isEligible: boolean;
  mainTitle: string | null;
  mainBadgeTone: RankBadgeTone | null;
  donorBadgeTone: StaticBadgeTone | null;
  standing: CommunityStandingItem[];
};

type CreatorTrackMode = "author" | "translator";

type CreatorAccumulator = {
  publishedWorks: number;
  publishedChapters: number;
  workLikesReceived: number;
  bookmarksReceived: number;
  reviewsReceived: number;
  commentsReceived: number;
  ratingValueReceived: number;
  engagedWorkIds: Set<string>;
};

type ReaderAccumulator = {
  uniqueWorksRead: number;
  bookmarksMade: number;
  workLikesMade: number;
  chapterLikesMade: number;
  commentsMade: number;
  reviewsMade: number;
  listsCreated: number;
  engagedWorkIds: Set<string>;
  activityTypes: Set<string>;
};

type DonorAccumulator = {
  donationTotal: number;
  donationCount: number;
  currencies: Set<string>;
};

type UserDisplayRow = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
};

function asGender(value: string | null | undefined): UserGenderValue | null {
  return USER_GENDER_VALUES.includes(String(value) as UserGenderValue)
    ? (String(value) as UserGenderValue)
    : null;
}

function asPlainMetadata(input: unknown): CommunityMetadata | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const entries = Object.entries(input as Record<string, unknown>).filter(([, value]) => {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) && value.every((item) => typeof item === "string"))
    );
  });
  return Object.fromEntries(entries) as CommunityMetadata;
}

function toScoreNumber(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
}

function toDecimal(value: number) {
  return new Prisma.Decimal(toScoreNumber(value).toFixed(2));
}

function ensureCreatorAccumulator(map: Map<string, CreatorAccumulator>, userId: string) {
  const existing = map.get(userId);
  if (existing) return existing;
  const created: CreatorAccumulator = {
    publishedWorks: 0,
    publishedChapters: 0,
    workLikesReceived: 0,
    bookmarksReceived: 0,
    reviewsReceived: 0,
    commentsReceived: 0,
    ratingValueReceived: 0,
    engagedWorkIds: new Set<string>(),
  };
  map.set(userId, created);
  return created;
}

function ensureReaderAccumulator(map: Map<string, ReaderAccumulator>, userId: string) {
  const existing = map.get(userId);
  if (existing) return existing;
  const created: ReaderAccumulator = {
    uniqueWorksRead: 0,
    bookmarksMade: 0,
    workLikesMade: 0,
    chapterLikesMade: 0,
    commentsMade: 0,
    reviewsMade: 0,
    listsCreated: 0,
    engagedWorkIds: new Set<string>(),
    activityTypes: new Set<string>(),
  };
  map.set(userId, created);
  return created;
}

function ensureDonorAccumulator(map: Map<string, DonorAccumulator>, userId: string) {
  const existing = map.get(userId);
  if (existing) return existing;
  const created: DonorAccumulator = {
    donationTotal: 0,
    donationCount: 0,
    currencies: new Set<string>(),
  };
  map.set(userId, created);
  return created;
}

function isSelfOwnedWork(actorUserId: string, workOwner: { authorId: string; translatorId: string | null } | null | undefined) {
  if (!workOwner) return false;
  return actorUserId === workOwner.authorId || actorUserId === workOwner.translatorId;
}

function metadataNumber(metadata: CommunityMetadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function metadataString(metadata: CommunityMetadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

export function rankCommunityScoreRows(rows: CommunityScoreRow[]): RankedCommunityScoreRow[] {
  return rows
    .filter((row) => row && row.userId && toScoreNumber(row.score) > 0)
    .map((row) => ({
      ...row,
      score: toScoreNumber(row.score),
      primaryMetric: toScoreNumber(row.primaryMetric),
      breadthMetric: toScoreNumber(row.breadthMetric),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.primaryMetric !== a.primaryMetric) return b.primaryMetric - a.primaryMetric;
      if (b.breadthMetric !== a.breadthMetric) return b.breadthMetric - a.breadthMetric;
      if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt.getTime() - b.createdAt.getTime();
      return a.userId.localeCompare(b.userId);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function buildBestUserCommunityRows(args: {
  authorRows: CommunityScoreRow[];
  translatorRows: CommunityScoreRow[];
  readerRows: CommunityScoreRow[];
  usersById: Map<string, CommunityEligibleUser>;
}): CommunityScoreRow[] {
  const merged = new Map<
    string,
    {
      createdAt: Date;
      authorScore: number;
      translatorScore: number;
      readerScore: number;
      authorWorks: number;
      translatorWorks: number;
      uniqueWorksRead: number;
      activeTracks: number;
      breadthMetric: number;
    }
  >();

  const ingest = (track: "author" | "translator" | "reader", rows: CommunityScoreRow[]) => {
    for (const row of rows) {
      const user = args.usersById.get(row.userId);
      if (!user) continue;
      const current =
        merged.get(row.userId) ||
        {
          createdAt: user.createdAt,
          authorScore: 0,
          translatorScore: 0,
          readerScore: 0,
          authorWorks: 0,
          translatorWorks: 0,
          uniqueWorksRead: 0,
          activeTracks: 0,
          breadthMetric: 0,
        };
      if (track === "author") {
        current.authorScore = row.score;
        current.authorWorks = metadataNumber(row.metadata, "publishedWorks");
      } else if (track === "translator") {
        current.translatorScore = row.score;
        current.translatorWorks = metadataNumber(row.metadata, "publishedWorks");
      } else {
        current.readerScore = row.score;
        current.uniqueWorksRead = metadataNumber(row.metadata, "uniqueWorksRead");
      }
      current.activeTracks += row.score > 0 ? 1 : 0;
      current.breadthMetric += toScoreNumber(row.breadthMetric);
      merged.set(row.userId, current);
    }
  };

  ingest("author", args.authorRows);
  ingest("translator", args.translatorRows);
  ingest("reader", args.readerRows);

  return Array.from(merged.entries()).map(([userId, item]) => ({
    userId,
    score: item.authorScore + item.translatorScore + item.readerScore,
    primaryMetric: item.authorWorks + item.translatorWorks + item.uniqueWorksRead,
    breadthMetric: item.breadthMetric + item.activeTracks,
    createdAt: item.createdAt,
    metadata: {
      authorScore: toScoreNumber(item.authorScore),
      translatorScore: toScoreNumber(item.translatorScore),
      readerScore: toScoreNumber(item.readerScore),
      authorWorks: item.authorWorks,
      translatorWorks: item.translatorWorks,
      uniqueWorksRead: item.uniqueWorksRead,
      activeTracks: item.activeTracks,
    },
  }));
}

async function listCommunityEligibleUsers() {
  const rows = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      gender: true,
      role: true,
      createdAt: true,
    },
  });

  const users = rows
    .map((row) => ({
      ...row,
      gender: asGender(row.gender),
    }))
    .filter((row) => isCommunityRankingEligibleUser(row));

  return new Map(users.map((user) => [user.id, user]));
}

async function buildCreatorCategoryRows(mode: CreatorTrackMode, usersById: Map<string, CommunityEligibleUser>) {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [] as CommunityScoreRow[];

  const works = await prisma.work.findMany({
    where:
      mode === "author"
        ? {
            status: "PUBLISHED",
            authorId: { in: eligibleUserIds },
          }
        : {
            status: "PUBLISHED",
            publishType: "TRANSLATION",
            translatorId: { in: eligibleUserIds },
          },
    select: {
      id: true,
      authorId: true,
      translatorId: true,
    },
  });

  if (!works.length) return [] as CommunityScoreRow[];

  const ownerByWorkId = new Map<string, string>();
  const workIds = works.map((work) => {
    const ownerId = mode === "author" ? work.authorId : work.translatorId;
    if (ownerId) ownerByWorkId.set(work.id, ownerId);
    return work.id;
  });

  const chapterRows = await prisma.chapter.findMany({
    where: { workId: { in: workIds }, status: "PUBLISHED" },
    select: { id: true, workId: true },
  });

  const chapterIds = chapterRows.map((row) => row.id);
  const [chapterCounts, workLikes, bookmarks, reviews, ratings, comments] = await Promise.all([
    prisma.chapter.groupBy({
      by: ["workId"],
      where: { workId: { in: workIds }, status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.workLike.findMany({
      where: { workId: { in: workIds }, userId: { in: eligibleUserIds } },
      select: { userId: true, workId: true },
    }),
    prisma.bookmark.findMany({
      where: { workId: { in: workIds }, userId: { in: eligibleUserIds } },
      select: { userId: true, workId: true },
    }),
    prisma.review.findMany({
      where: { workId: { in: workIds }, userId: { in: eligibleUserIds } },
      select: { userId: true, workId: true },
    }),
    prisma.workRating.findMany({
      where: { workId: { in: workIds }, userId: { in: eligibleUserIds } },
      select: { userId: true, workId: true, value: true },
    }),
    prisma.comment.findMany({
      where: {
        userId: { in: eligibleUserIds },
        OR: [
          { targetType: "WORK", targetId: { in: workIds } },
          ...(chapterIds.length ? [{ targetType: "CHAPTER" as const, targetId: { in: chapterIds } }] : []),
        ],
      },
      select: { userId: true, targetType: true, targetId: true },
    }),
  ]);

  const chapterWorkMap = new Map(chapterRows.map((row) => [row.id, row.workId]));
  const accByUserId = new Map<string, CreatorAccumulator>();

  for (const work of works) {
    const ownerId = ownerByWorkId.get(work.id);
    if (!ownerId) continue;
    ensureCreatorAccumulator(accByUserId, ownerId).publishedWorks += 1;
  }

  for (const row of chapterCounts) {
    const ownerId = ownerByWorkId.get(row.workId);
    if (!ownerId) continue;
    ensureCreatorAccumulator(accByUserId, ownerId).publishedChapters += Number(row._count._all || 0);
  }

  for (const row of workLikes) {
    const ownerId = ownerByWorkId.get(row.workId);
    if (!ownerId || row.userId === ownerId) continue;
    const acc = ensureCreatorAccumulator(accByUserId, ownerId);
    acc.workLikesReceived += 1;
    acc.engagedWorkIds.add(row.workId);
  }

  for (const row of bookmarks) {
    const ownerId = ownerByWorkId.get(row.workId);
    if (!ownerId || row.userId === ownerId) continue;
    const acc = ensureCreatorAccumulator(accByUserId, ownerId);
    acc.bookmarksReceived += 1;
    acc.engagedWorkIds.add(row.workId);
  }

  for (const row of reviews) {
    const ownerId = ownerByWorkId.get(row.workId);
    if (!ownerId || row.userId === ownerId) continue;
    const acc = ensureCreatorAccumulator(accByUserId, ownerId);
    acc.reviewsReceived += 1;
    acc.engagedWorkIds.add(row.workId);
  }

  for (const row of ratings) {
    const ownerId = ownerByWorkId.get(row.workId);
    if (!ownerId || row.userId === ownerId) continue;
    const acc = ensureCreatorAccumulator(accByUserId, ownerId);
    acc.ratingValueReceived += Number(row.value || 0);
    acc.engagedWorkIds.add(row.workId);
  }

  for (const row of comments) {
    const workId = row.targetType === "WORK" ? row.targetId : chapterWorkMap.get(row.targetId);
    if (!workId) continue;
    const ownerId = ownerByWorkId.get(workId);
    if (!ownerId || row.userId === ownerId) continue;
    const acc = ensureCreatorAccumulator(accByUserId, ownerId);
    acc.commentsReceived += 1;
    acc.engagedWorkIds.add(workId);
  }

  return Array.from(accByUserId.entries()).map(([userId, acc]) => {
    const user = usersById.get(userId);
    return {
      userId,
      score:
        acc.publishedWorks * 300 +
        acc.publishedChapters * 60 +
        acc.workLikesReceived * 5 +
        acc.bookmarksReceived * 6 +
        acc.reviewsReceived * 10 +
        acc.commentsReceived * 3 +
        acc.ratingValueReceived * 4,
      primaryMetric: acc.publishedWorks,
      breadthMetric: acc.publishedChapters + acc.engagedWorkIds.size,
      createdAt: user?.createdAt || new Date(0),
      metadata: {
        track: mode,
        publishedWorks: acc.publishedWorks,
        publishedChapters: acc.publishedChapters,
        workLikesReceived: acc.workLikesReceived,
        bookmarksReceived: acc.bookmarksReceived,
        reviewsReceived: acc.reviewsReceived,
        commentsReceived: acc.commentsReceived,
        ratingValueReceived: acc.ratingValueReceived,
        engagedWorks: acc.engagedWorkIds.size,
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildReaderCategoryRows(usersById: Map<string, CommunityEligibleUser>) {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [] as CommunityScoreRow[];

  const [progressRows, bookmarkRows, workLikeRows, reviewRows, chapterLikeRows, listRows, commentRows] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        workId: true,
        work: { select: { authorId: true, translatorId: true } },
      },
    }),
    prisma.bookmark.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        workId: true,
        work: { select: { authorId: true, translatorId: true } },
      },
    }),
    prisma.workLike.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        workId: true,
        work: { select: { authorId: true, translatorId: true } },
      },
    }),
    prisma.review.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        workId: true,
        work: { select: { authorId: true, translatorId: true } },
      },
    }),
    prisma.chapterLike.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        chapter: { select: { workId: true, work: { select: { authorId: true, translatorId: true } } } },
      },
    }),
    prisma.readingList.findMany({
      where: { ownerId: { in: eligibleUserIds } },
      select: { ownerId: true },
    }),
    prisma.comment.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: { userId: true, targetType: true, targetId: true },
    }),
  ]);

  const workTargetIds = Array.from(
    new Set(commentRows.filter((row) => row.targetType === "WORK").map((row) => row.targetId))
  );
  const chapterTargetIds = Array.from(
    new Set(commentRows.filter((row) => row.targetType === "CHAPTER").map((row) => row.targetId))
  );

  const [commentWorkTargets, commentChapterTargets] = await Promise.all([
    workTargetIds.length
      ? prisma.work.findMany({
          where: { id: { in: workTargetIds } },
          select: { id: true, authorId: true, translatorId: true },
        })
      : Promise.resolve([]),
    chapterTargetIds.length
      ? prisma.chapter.findMany({
          where: { id: { in: chapterTargetIds } },
          select: { id: true, workId: true, work: { select: { authorId: true, translatorId: true } } },
        })
      : Promise.resolve([]),
  ]);

  const commentWorkMap = new Map(commentWorkTargets.map((row) => [row.id, row]));
  const commentChapterMap = new Map(commentChapterTargets.map((row) => [row.id, row]));
  const accByUserId = new Map<string, ReaderAccumulator>();

  for (const row of progressRows) {
    if (isSelfOwnedWork(row.userId, row.work)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.uniqueWorksRead += 1;
    acc.engagedWorkIds.add(row.workId);
    acc.activityTypes.add("read");
  }

  for (const row of bookmarkRows) {
    if (isSelfOwnedWork(row.userId, row.work)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.bookmarksMade += 1;
    acc.engagedWorkIds.add(row.workId);
    acc.activityTypes.add("bookmark");
  }

  for (const row of workLikeRows) {
    if (isSelfOwnedWork(row.userId, row.work)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.workLikesMade += 1;
    acc.engagedWorkIds.add(row.workId);
    acc.activityTypes.add("work_like");
  }

  for (const row of reviewRows) {
    if (isSelfOwnedWork(row.userId, row.work)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.reviewsMade += 1;
    acc.engagedWorkIds.add(row.workId);
    acc.activityTypes.add("review");
  }

  for (const row of chapterLikeRows) {
    if (isSelfOwnedWork(row.userId, row.chapter.work)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.chapterLikesMade += 1;
    acc.engagedWorkIds.add(row.chapter.workId);
    acc.activityTypes.add("chapter_like");
  }

  for (const row of listRows) {
    const acc = ensureReaderAccumulator(accByUserId, row.ownerId);
    acc.listsCreated += 1;
    acc.activityTypes.add("list");
  }

  for (const row of commentRows) {
    const target =
      row.targetType === "WORK"
        ? commentWorkMap.get(row.targetId)
        : commentChapterMap.get(row.targetId)?.work || null;
    const workId = row.targetType === "WORK" ? row.targetId : commentChapterMap.get(row.targetId)?.workId;
    if (!workId || isSelfOwnedWork(row.userId, target)) continue;
    const acc = ensureReaderAccumulator(accByUserId, row.userId);
    acc.commentsMade += 1;
    acc.engagedWorkIds.add(workId);
    acc.activityTypes.add("comment");
  }

  return Array.from(accByUserId.entries()).map(([userId, acc]) => {
    const user = usersById.get(userId);
    return {
      userId,
      score:
        acc.uniqueWorksRead * 20 +
        acc.bookmarksMade * 8 +
        acc.workLikesMade * 5 +
        acc.chapterLikesMade * 4 +
        acc.commentsMade * 6 +
        acc.reviewsMade * 12 +
        acc.listsCreated * 10,
      primaryMetric: acc.uniqueWorksRead,
      breadthMetric: acc.engagedWorkIds.size + acc.activityTypes.size,
      createdAt: user?.createdAt || new Date(0),
      metadata: {
        uniqueWorksRead: acc.uniqueWorksRead,
        bookmarksMade: acc.bookmarksMade,
        workLikesMade: acc.workLikesMade,
        chapterLikesMade: acc.chapterLikesMade,
        commentsMade: acc.commentsMade,
        reviewsMade: acc.reviewsMade,
        listsCreated: acc.listsCreated,
        engagedWorks: acc.engagedWorkIds.size,
        activityTypes: acc.activityTypes.size,
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildDonorCategoryRows(usersById: Map<string, CommunityEligibleUser>) {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [] as CommunityScoreRow[];

  const donationRows = await prisma.donationEntry.findMany({
    where: { userId: { in: eligibleUserIds } },
    select: { userId: true, amount: true, currency: true },
  });

  const accByUserId = new Map<string, DonorAccumulator>();
  for (const row of donationRows) {
    const acc = ensureDonorAccumulator(accByUserId, row.userId);
    acc.donationTotal += Number(row.amount || 0);
    acc.donationCount += 1;
    acc.currencies.add(String(row.currency || "IDR").toUpperCase());
  }

  return Array.from(accByUserId.entries()).map(([userId, acc]) => {
    const user = usersById.get(userId);
    const currencies = Array.from(acc.currencies.values()).sort();
    return {
      userId,
      score: acc.donationTotal,
      primaryMetric: acc.donationCount,
      breadthMetric: currencies.length,
      createdAt: user?.createdAt || new Date(0),
      metadata: {
        donationCount: acc.donationCount,
        currency: currencies[0] || "IDR",
        currencies,
      },
    } satisfies CommunityScoreRow;
  });
}

async function persistRankedCommunitySnapshot(category: LeaderboardCategoryValue, rows: RankedCommunityScoreRow[]) {
  const snapshotAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.leaderboardSnapshot.deleteMany({ where: { category, period: ALL_TIME_PERIOD } });
    if (!rows.length) return;
    const chunkSize = 500;
    for (let index = 0; index < rows.length; index += chunkSize) {
      const chunk = rows.slice(index, index + chunkSize);
      await tx.leaderboardSnapshot.createMany({
        data: chunk.map((row) => ({
          category,
          period: ALL_TIME_PERIOD,
          userId: row.userId,
          rank: row.rank,
          score: toDecimal(row.score),
          metadata: row.metadata as Prisma.InputJsonValue,
          snapshotAt,
        })),
      });
    }
  });
}

export async function rebuildMainCommunityLeaderboards() {
  const usersById = await listCommunityEligibleUsers();

  const [authorRows, translatorRows, readerRows, donorRows] = await Promise.all([
    buildCreatorCategoryRows("author", usersById),
    buildCreatorCategoryRows("translator", usersById),
    buildReaderCategoryRows(usersById),
    buildDonorCategoryRows(usersById),
  ]);

  const bestUserRows = buildBestUserCommunityRows({ authorRows, translatorRows, readerRows, usersById });

  const rankedByCategory: Record<LeaderboardCategoryValue, RankedCommunityScoreRow[]> = {
    BEST_AUTHOR: rankCommunityScoreRows(authorRows),
    BEST_TRANSLATOR: rankCommunityScoreRows(translatorRows),
    BEST_READER: rankCommunityScoreRows(readerRows),
    BEST_USER: rankCommunityScoreRows(bestUserRows),
    BEST_DONOR: rankCommunityScoreRows(donorRows),
  };

  for (const category of COMMUNITY_CATEGORY_ORDER) {
    await persistRankedCommunitySnapshot(category, rankedByCategory[category]);
  }

  return {
    snapshotAt: new Date().toISOString(),
    counts: Object.fromEntries(
      COMMUNITY_CATEGORY_ORDER.map((category) => [category, rankedByCategory[category].length])
    ) as Record<LeaderboardCategoryValue, number>,
  };
}

function resolveLeaderboardEntryTitle(category: LeaderboardCategoryValue, rank: number, gender?: UserGenderValue | null) {
  if (category === "BEST_AUTHOR" || category === "BEST_TRANSLATOR") return resolveCreatorTitle(rank);
  if (category === "BEST_READER" || category === "BEST_USER") return resolveNobleTitle(rank, gender);
  if (category === "BEST_DONOR") return rank <= LEADERBOARD_TOP_SIZE ? "Donatur" : null;
  return null;
}

function resolveLeaderboardEntryTone(category: LeaderboardCategoryValue, rank: number) {
  if (category === "BEST_DONOR") return rank <= LEADERBOARD_TOP_SIZE ? STATIC_BADGE_TONES.DONOR : null;
  return resolveRankBadgeTone(rank);
}

function mapSnapshotToEntry(
  category: LeaderboardCategoryValue,
  row: {
    userId: string;
    rank: number;
    score: Prisma.Decimal;
    metadata: unknown;
    snapshotAt: Date;
    user: UserDisplayRow;
  }
): CommunityLeaderboardEntry {
  return {
    userId: row.userId,
    username: row.user.username,
    name: row.user.name,
    image: row.user.image,
    gender: row.user.gender,
    category,
    label: LEADERBOARD_SOURCE_LABELS[category],
    rank: row.rank,
    score: Number(row.score || 0),
    title: resolveLeaderboardEntryTitle(category, row.rank, row.user.gender),
    badgeTone: resolveLeaderboardEntryTone(category, row.rank),
    isTopRanked: row.rank <= LEADERBOARD_TOP_SIZE,
    isAmountBased: isAmountBasedLeaderboardCategory(category),
    metadata: asPlainMetadata(row.metadata),
    snapshotAt: row.snapshotAt,
  };
}

export async function getCommunityLeaderboard(category: LeaderboardCategoryValue, limit = LEADERBOARD_TOP_SIZE) {
  const rows = await prisma.leaderboardSnapshot.findMany({
    where: {
      category,
      period: ALL_TIME_PERIOD,
      rank: { lte: Math.max(1, limit) },
    },
    orderBy: [{ rank: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          gender: true,
          role: true,
        },
      },
    },
  });

  return rows.map((row) =>
    mapSnapshotToEntry(category, {
      userId: row.userId,
      rank: row.rank,
      score: row.score,
      metadata: row.metadata,
      snapshotAt: row.snapshotAt,
      user: {
        id: row.user.id,
        username: row.user.username,
        name: row.user.name,
        image: row.user.image,
        gender: asGender(row.user.gender),
        role: row.user.role,
      },
    })
  );
}

export async function getCommunityStandingSummary(userId: string): Promise<CommunityStandingSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      gender: true,
      role: true,
    },
  });

  if (!user) return null;

  const normalizedUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
    gender: asGender(user.gender),
    role: user.role,
  };

  const eligible = isCommunityRankingEligibleUser(normalizedUser);
  const snapshots = eligible
    ? await prisma.leaderboardSnapshot.findMany({
        where: { userId, period: ALL_TIME_PERIOD },
        select: {
          category: true,
          rank: true,
          score: true,
          metadata: true,
        },
      })
    : [];

  const byCategory = new Map(snapshots.map((row) => [row.category as LeaderboardCategoryValue, row]));
  const standing = COMMUNITY_CATEGORY_ORDER.map((category) => {
    const row = byCategory.get(category);
    const rank = row?.rank ?? null;
    return {
      category,
      label: LEADERBOARD_SOURCE_LABELS[category],
      rank,
      score: row ? Number(row.score || 0) : 0,
      title: rank ? resolveLeaderboardEntryTitle(category, rank, normalizedUser.gender) : null,
      badgeTone: rank ? resolveLeaderboardEntryTone(category, rank) : null,
      isTopRanked: !!rank && rank <= LEADERBOARD_TOP_SIZE,
      isAmountBased: isAmountBasedLeaderboardCategory(category),
      metadata: asPlainMetadata(row?.metadata),
    } satisfies CommunityStandingItem;
  });

  const authorStanding = standing.find((item) => item.category === "BEST_AUTHOR") || null;
  const translatorStanding = standing.find((item) => item.category === "BEST_TRANSLATOR") || null;
  const readerStanding = standing.find((item) => item.category === "BEST_READER") || null;
  const userStanding = standing.find((item) => item.category === "BEST_USER") || null;
  const donorStanding = standing.find((item) => item.category === "BEST_DONOR") || null;

  const title = eligible
    ? resolveCommunityMainTitle({
        authorRank: authorStanding?.rank,
        translatorRank: translatorStanding?.rank,
        readerRank: readerStanding?.rank,
        userRank: userStanding?.rank,
        gender: normalizedUser.gender,
      })
    : {
        mainTitle: null,
        badgeTone: null,
      };

  return {
    user: normalizedUser,
    isEligible: eligible,
    mainTitle: title.mainTitle,
    mainBadgeTone: title.badgeTone,
    donorBadgeTone: donorStanding?.isTopRanked ? STATIC_BADGE_TONES.DONOR : null,
    standing,
  };
}

export async function getCommunityLeaderboardPageData(limit = LEADERBOARD_TOP_SIZE) {
  const sections = await Promise.all(
    COMMUNITY_CATEGORY_ORDER.map(async (category) => ({
      category,
      label: LEADERBOARD_SOURCE_LABELS[category],
      entries: await getCommunityLeaderboard(category, limit),
    }))
  );

  return { sections };
}

export function summarizeStandingMainMetrics(summary: CommunityStandingSummary) {
  const byCategory = new Map(summary.standing.map((item) => [item.category, item]));
  return {
    authorRank: byCategory.get("BEST_AUTHOR")?.rank ?? null,
    translatorRank: byCategory.get("BEST_TRANSLATOR")?.rank ?? null,
    readerRank: byCategory.get("BEST_READER")?.rank ?? null,
    userRank: byCategory.get("BEST_USER")?.rank ?? null,
    donorRank: byCategory.get("BEST_DONOR")?.rank ?? null,
    donorCurrency: metadataString(byCategory.get("BEST_DONOR")?.metadata, "currency") || "IDR",
  };
}
