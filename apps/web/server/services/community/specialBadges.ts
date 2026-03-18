import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import {
  STATIC_BADGE_TONES,
  SPECIAL_BADGE_KEY_VALUES,
  SPECIAL_BADGE_SOURCE_LABELS,
  USER_GENDER_VALUES,
  type SpecialBadgeKeyValue,
  type StaticBadgeTone,
  type UserGenderValue,
  isCommunityRankingEligibleUser,
} from "@/server/services/community/ranking";
import { rankCommunityScoreRows, type CommunityMetadata, type CommunityScoreRow, type RankedCommunityScoreRow } from "@/server/services/community/leaderboards";

export async function getLatestCommunitySpecialBadgeSnapshotAt() {
  const result = await prisma.specialBadgeSnapshot.aggregate({ _max: { snapshotAt: true } });
  return result._max.snapshotAt ?? null;
}

type CommunityEligibleUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
  createdAt: Date;
};

type UserDisplayRow = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
};

type SlothEligibilityCounts = {
  publishedWorks: number;
  comments: number;
  workLikes: number;
  chapterLikes: number;
  bookmarks: number;
  reviews: number;
};

export type CommunitySpecialBadgeEntry = {
  badgeKey: SpecialBadgeKeyValue;
  label: string;
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  score: number;
  metadata: CommunityMetadata | null;
  badgeTone: StaticBadgeTone;
  snapshotAt: Date;
};

export type CommunitySpecialBadgeSummary = {
  user: UserDisplayRow;
  isEligible: boolean;
  heldBadges: CommunitySpecialBadgeEntry[];
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

function monthKey(date: Date | string | null | undefined) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function listCommunityEligibleUsers() {
  const users = await prisma.user.findMany({
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

  return new Map(
    users
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        gender: asGender(user.gender),
        role: user.role,
        createdAt: user.createdAt,
      }))
      .filter((user) => isCommunityRankingEligibleUser(user))
      .map((user) => [user.id, user] as const)
  );
}

function selectWinner(rows: CommunityScoreRow[]) {
  return rankCommunityScoreRows(rows)[0] ?? null;
}

function resolveSnapshotTone() {
  return STATIC_BADGE_TONES.SPECIAL;
}

async function buildPrideCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const [progress, comments, workLikes, chapterLikes, bookmarks, reviews, works, donations] = await Promise.all([
    prisma.readingProgress.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, lastReadAt: true } }),
    prisma.comment.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, createdAt: true } }),
    prisma.workLike.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, createdAt: true } }),
    prisma.chapterLike.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, createdAt: true } }),
    prisma.bookmark.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, createdAt: true } }),
    prisma.review.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, createdAt: true } }),
    prisma.work.findMany({
      where: {
        OR: [{ authorId: { in: eligibleUserIds } }, { translatorId: { in: eligibleUserIds } }],
        status: "PUBLISHED",
      },
      select: { authorId: true, translatorId: true, createdAt: true },
    }),
    prisma.donationEntry.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, donatedAt: true } }),
  ]);

  const activeMonthsByUserId = new Map<string, Set<string>>();
  const pushMonth = (userId: string, date: Date | null | undefined) => {
    const key = monthKey(date);
    if (!key) return;
    const set = activeMonthsByUserId.get(userId) || new Set<string>();
    set.add(key);
    activeMonthsByUserId.set(userId, set);
  };

  for (const row of progress) pushMonth(row.userId, row.lastReadAt);
  for (const row of comments) pushMonth(row.userId, row.createdAt);
  for (const row of workLikes) pushMonth(row.userId, row.createdAt);
  for (const row of chapterLikes) pushMonth(row.userId, row.createdAt);
  for (const row of bookmarks) pushMonth(row.userId, row.createdAt);
  for (const row of reviews) pushMonth(row.userId, row.createdAt);
  for (const row of donations) pushMonth(row.userId, row.donatedAt);
  for (const row of works) {
    pushMonth(row.authorId, row.createdAt);
    if (row.translatorId) pushMonth(row.translatorId, row.createdAt);
  }

  const now = Date.now();
  return eligibleUserIds.map((userId) => {
    const user = usersById.get(userId)!;
    const accountAgeDays = Math.max(0, Math.floor((now - user.createdAt.getTime()) / 86400000));
    const distinctActiveMonths = activeMonthsByUserId.get(userId)?.size ?? 0;
    const score = accountAgeDays + distinctActiveMonths * 30;
    return {
      userId,
      score,
      primaryMetric: accountAgeDays,
      breadthMetric: distinctActiveMonths,
      createdAt: user.createdAt,
      metadata: {
        accountAgeDays,
        distinctActiveMonths,
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildEnvyCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const progressRows = await prisma.readingProgress.findMany({
    where: { userId: { in: eligibleUserIds } },
    select: {
      userId: true,
      workId: true,
      work: {
        select: {
          deviantLoveTags: { select: { id: true, slug: true } },
        },
      },
    },
  });

  const tagIdsByUserId = new Map<string, Set<string>>();
  const tagSlugsByUserId = new Map<string, Set<string>>();
  const workIdsByUserId = new Map<string, Set<string>>();

  for (const row of progressRows) {
    if (!row.work.deviantLoveTags.length) continue;
    const workIds = workIdsByUserId.get(row.userId) || new Set<string>();
    workIds.add(row.workId);
    workIdsByUserId.set(row.userId, workIds);

    const tagIds = tagIdsByUserId.get(row.userId) || new Set<string>();
    const tagSlugs = tagSlugsByUserId.get(row.userId) || new Set<string>();
    for (const tag of row.work.deviantLoveTags) {
      tagIds.add(tag.id);
      tagSlugs.add(tag.slug);
    }
    tagIdsByUserId.set(row.userId, tagIds);
    tagSlugsByUserId.set(row.userId, tagSlugs);
  }

  return Array.from(tagIdsByUserId.entries()).map(([userId, tagIds]) => {
    const user = usersById.get(userId)!;
    return {
      userId,
      score: tagIds.size,
      primaryMetric: tagIds.size,
      breadthMetric: workIdsByUserId.get(userId)?.size ?? 0,
      createdAt: user.createdAt,
      metadata: {
        distinctDeviantTags: tagIds.size,
        uniqueDeviantWorksRead: workIdsByUserId.get(userId)?.size ?? 0,
        tagSlugs: Array.from(tagSlugsByUserId.get(userId)?.values() || []).sort(),
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildWrathCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const commentRows = await prisma.comment.findMany({
    where: { userId: { in: eligibleUserIds } },
    select: { userId: true, targetType: true, targetId: true },
  });

  const counts = new Map<string, { total: number; targets: Set<string> }>();
  for (const row of commentRows) {
    const current = counts.get(row.userId) || { total: 0, targets: new Set<string>() };
    current.total += 1;
    current.targets.add(`${row.targetType}:${row.targetId}`);
    counts.set(row.userId, current);
  }

  return Array.from(counts.entries()).map(([userId, count]) => {
    const user = usersById.get(userId)!;
    return {
      userId,
      score: count.total,
      primaryMetric: count.total,
      breadthMetric: count.targets.size,
      createdAt: user.createdAt,
      metadata: {
        commentCount: count.total,
        distinctTargets: count.targets.size,
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildSlothCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const [publishedWorks, comments, workLikes, chapterLikes, bookmarks, reviews, readingProgress] = await Promise.all([
    prisma.work.groupBy({ by: ["authorId"], where: { authorId: { in: eligibleUserIds }, status: "PUBLISHED" }, _count: { _all: true } }),
    prisma.comment.groupBy({ by: ["userId"], where: { userId: { in: eligibleUserIds } }, _count: { _all: true } }),
    prisma.workLike.groupBy({ by: ["userId"], where: { userId: { in: eligibleUserIds } }, _count: { _all: true } }),
    prisma.chapterLike.groupBy({ by: ["userId"], where: { userId: { in: eligibleUserIds } }, _count: { _all: true } }),
    prisma.bookmark.groupBy({ by: ["userId"], where: { userId: { in: eligibleUserIds } }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["userId"], where: { userId: { in: eligibleUserIds } }, _count: { _all: true } }),
    prisma.readingProgress.findMany({ where: { userId: { in: eligibleUserIds } }, select: { userId: true, workId: true } }),
  ]);

  const countsByUserId = new Map<string, SlothEligibilityCounts>();
  const ensureCounts = (userId: string) => {
    const current = countsByUserId.get(userId) || {
      publishedWorks: 0,
      comments: 0,
      workLikes: 0,
      chapterLikes: 0,
      bookmarks: 0,
      reviews: 0,
    };
    countsByUserId.set(userId, current);
    return current;
  };

  for (const row of publishedWorks) ensureCounts(row.authorId).publishedWorks = row._count._all;
  for (const row of comments) ensureCounts(row.userId).comments = row._count._all;
  for (const row of workLikes) ensureCounts(row.userId).workLikes = row._count._all;
  for (const row of chapterLikes) ensureCounts(row.userId).chapterLikes = row._count._all;
  for (const row of bookmarks) ensureCounts(row.userId).bookmarks = row._count._all;
  for (const row of reviews) ensureCounts(row.userId).reviews = row._count._all;

  const uniqueReadWorksByUserId = new Map<string, Set<string>>();
  for (const row of readingProgress) {
    const set = uniqueReadWorksByUserId.get(row.userId) || new Set<string>();
    set.add(row.workId);
    uniqueReadWorksByUserId.set(row.userId, set);
  }

  return eligibleUserIds
    .filter((userId) => {
      const counts = ensureCounts(userId);
      return (
        counts.publishedWorks === 0 &&
        counts.comments === 0 &&
        counts.workLikes === 0 &&
        counts.chapterLikes === 0 &&
        counts.bookmarks === 0 &&
        counts.reviews === 0
      );
    })
    .map((userId) => {
      const user = usersById.get(userId)!;
      const counts = ensureCounts(userId);
      const uniqueWorksRead = uniqueReadWorksByUserId.get(userId)?.size ?? 0;
      return {
        userId,
        score: uniqueWorksRead,
        primaryMetric: uniqueWorksRead,
        breadthMetric: 0,
        createdAt: user.createdAt,
        metadata: {
          uniqueWorksRead,
          ...counts,
        },
      } satisfies CommunityScoreRow;
    })
    .filter((row) => row.score > 0);
}

async function buildGreedCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const donationRows = await prisma.donationEntry.findMany({
    where: { userId: { in: eligibleUserIds } },
    select: { userId: true, amount: true, currency: true },
  });

  const totals = new Map<string, { amount: number; donationCount: number; currencies: Set<string> }>();
  for (const row of donationRows) {
    const current = totals.get(row.userId) || { amount: 0, donationCount: 0, currencies: new Set<string>() };
    current.amount += Number(row.amount || 0);
    current.donationCount += 1;
    current.currencies.add(String(row.currency || "IDR").toUpperCase());
    totals.set(row.userId, current);
  }

  return Array.from(totals.entries()).map(([userId, total]) => {
    const user = usersById.get(userId)!;
    return {
      userId,
      score: total.amount,
      primaryMetric: total.amount,
      breadthMetric: total.donationCount,
      createdAt: user.createdAt,
      metadata: {
        donationCount: total.donationCount,
        currencies: Array.from(total.currencies.values()).sort(),
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildGluttonyCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const progressRows = await prisma.readingProgress.findMany({
    where: { userId: { in: eligibleUserIds } },
    select: {
      userId: true,
      workId: true,
      work: {
        select: {
          genres: { select: { id: true, slug: true } },
        },
      },
    },
  });

  const genreIdsByUserId = new Map<string, Set<string>>();
  const genreSlugsByUserId = new Map<string, Set<string>>();
  const workIdsByUserId = new Map<string, Set<string>>();
  for (const row of progressRows) {
    if (!row.work.genres.length) continue;
    const workIds = workIdsByUserId.get(row.userId) || new Set<string>();
    workIds.add(row.workId);
    workIdsByUserId.set(row.userId, workIds);

    const ids = genreIdsByUserId.get(row.userId) || new Set<string>();
    const slugs = genreSlugsByUserId.get(row.userId) || new Set<string>();
    for (const genre of row.work.genres) {
      ids.add(genre.id);
      slugs.add(genre.slug);
    }
    genreIdsByUserId.set(row.userId, ids);
    genreSlugsByUserId.set(row.userId, slugs);
  }

  return Array.from(genreIdsByUserId.entries()).map(([userId, genreIds]) => {
    const user = usersById.get(userId)!;
    return {
      userId,
      score: genreIds.size,
      primaryMetric: genreIds.size,
      breadthMetric: workIdsByUserId.get(userId)?.size ?? 0,
      createdAt: user.createdAt,
      metadata: {
        distinctGenres: genreIds.size,
        uniqueWorksRead: workIdsByUserId.get(userId)?.size ?? 0,
        genreSlugs: Array.from(genreSlugsByUserId.get(userId)?.values() || []).sort(),
      },
    } satisfies CommunityScoreRow;
  });
}

async function buildLustCandidateRows(usersById: Map<string, CommunityEligibleUser>): Promise<CommunityScoreRow[]> {
  const eligibleUserIds = Array.from(usersById.keys());
  if (!eligibleUserIds.length) return [];

  const [readRows, authoredWorks, translatedWorks] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: {
        userId: true,
        workId: true,
        work: {
          select: {
            isMature: true,
            deviantLoveTags: { select: { id: true, slug: true } },
          },
        },
      },
    }),
    prisma.work.findMany({
      where: { authorId: { in: eligibleUserIds }, status: "PUBLISHED" },
      select: { authorId: true, id: true, isMature: true, deviantLoveTags: { select: { id: true, slug: true } } },
    }),
    prisma.work.findMany({
      where: { translatorId: { in: eligibleUserIds }, status: "PUBLISHED" },
      select: { translatorId: true, id: true, isMature: true, deviantLoveTags: { select: { id: true, slug: true } } },
    }),
  ]);

  const adultReadWorkIdsByUserId = new Map<string, Set<string>>();
  const adultUploadedWorkIdsByUserId = new Map<string, Set<string>>();
  const adultTagIdsByUserId = new Map<string, Set<string>>();
  const adultTagSlugsByUserId = new Map<string, Set<string>>();

  const ingestTags = (userId: string, isMature: boolean, tags: Array<{ id: string; slug: string }>) => {
    const ids = adultTagIdsByUserId.get(userId) || new Set<string>();
    const slugs = adultTagSlugsByUserId.get(userId) || new Set<string>();
    if (isMature) {
      ids.add("__mature__");
      slugs.add("mature");
    }
    for (const tag of tags) {
      ids.add(tag.id);
      slugs.add(tag.slug);
    }
    adultTagIdsByUserId.set(userId, ids);
    adultTagSlugsByUserId.set(userId, slugs);
  };

  for (const row of readRows) {
    if (!row.work.isMature && !row.work.deviantLoveTags.length) continue;
    const works = adultReadWorkIdsByUserId.get(row.userId) || new Set<string>();
    works.add(row.workId);
    adultReadWorkIdsByUserId.set(row.userId, works);
    ingestTags(row.userId, row.work.isMature, row.work.deviantLoveTags);
  }

  for (const row of authoredWorks) {
    if (!row.isMature && !row.deviantLoveTags.length) continue;
    const works = adultUploadedWorkIdsByUserId.get(row.authorId) || new Set<string>();
    works.add(row.id);
    adultUploadedWorkIdsByUserId.set(row.authorId, works);
    ingestTags(row.authorId, row.isMature, row.deviantLoveTags);
  }

  for (const row of translatedWorks) {
    if (!row.translatorId) continue;
    if (!row.isMature && !row.deviantLoveTags.length) continue;
    const works = adultUploadedWorkIdsByUserId.get(row.translatorId) || new Set<string>();
    works.add(row.id);
    adultUploadedWorkIdsByUserId.set(row.translatorId, works);
    ingestTags(row.translatorId, row.isMature, row.deviantLoveTags);
  }

  const candidateUserIds = new Set<string>([
    ...adultReadWorkIdsByUserId.keys(),
    ...adultUploadedWorkIdsByUserId.keys(),
  ]);

  return Array.from(candidateUserIds.values()).map((userId) => {
    const user = usersById.get(userId)!;
    const readCount = adultReadWorkIdsByUserId.get(userId)?.size ?? 0;
    const uploadCount = adultUploadedWorkIdsByUserId.get(userId)?.size ?? 0;
    const distinctAdultTags = adultTagIdsByUserId.get(userId)?.size ?? 0;
    return {
      userId,
      score: readCount + uploadCount * 2,
      primaryMetric: readCount + uploadCount * 2,
      breadthMetric: distinctAdultTags,
      createdAt: user.createdAt,
      metadata: {
        uniqueAdultWorksRead: readCount,
        uniqueAdultWorksUploaded: uploadCount,
        distinctAdultTags,
        tagSlugs: Array.from(adultTagSlugsByUserId.get(userId)?.values() || []).sort(),
      },
    } satisfies CommunityScoreRow;
  });
}

async function persistSpecialBadgeSnapshots(winners: Array<{ badgeKey: SpecialBadgeKeyValue; row: CommunityScoreRow }>) {
  const snapshotAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.specialBadgeSnapshot.deleteMany({});
    if (!winners.length) return;
    await tx.specialBadgeSnapshot.createMany({
      data: winners.map(({ badgeKey, row }) => ({
        badgeKey,
        userId: row.userId,
        score: toDecimal(row.score),
        metadata: row.metadata as Prisma.InputJsonValue,
        snapshotAt,
      })),
    });
  });
}

export async function rebuildCommunitySpecialBadges() {
  const usersById = await listCommunityEligibleUsers();

  const [prideRows, envyRows, wrathRows, slothRows, greedRows, gluttonyRows, lustRows] = await Promise.all([
    buildPrideCandidateRows(usersById),
    buildEnvyCandidateRows(usersById),
    buildWrathCandidateRows(usersById),
    buildSlothCandidateRows(usersById),
    buildGreedCandidateRows(usersById),
    buildGluttonyCandidateRows(usersById),
    buildLustCandidateRows(usersById),
  ]);

  const candidates: Record<SpecialBadgeKeyValue, CommunityScoreRow[]> = {
    PRIDE: prideRows,
    ENVY: envyRows,
    WRATH: wrathRows,
    SLOTH: slothRows,
    GREED: greedRows,
    GLUTTONY: gluttonyRows,
    LUST: lustRows,
  };

  const winners = SPECIAL_BADGE_KEY_VALUES.map((badgeKey) => {
    const winner = selectWinner(candidates[badgeKey]);
    return winner ? { badgeKey, row: winner } : null;
  }).filter((value): value is { badgeKey: SpecialBadgeKeyValue; row: RankedCommunityScoreRow } => value !== null);

  await persistSpecialBadgeSnapshots(winners);

  return {
    snapshotAt: new Date().toISOString(),
    holders: Object.fromEntries(
      SPECIAL_BADGE_KEY_VALUES.map((badgeKey) => [badgeKey, winners.find((winner) => winner.badgeKey === badgeKey)?.row.userId || null])
    ) as Record<SpecialBadgeKeyValue, string | null>,
  };
}

function mapSnapshotToEntry(row: {
  badgeKey: SpecialBadgeKeyValue;
  score: Prisma.Decimal;
  metadata: unknown;
  snapshotAt: Date;
  user: UserDisplayRow;
}): CommunitySpecialBadgeEntry {
  return {
    badgeKey: row.badgeKey,
    label: SPECIAL_BADGE_SOURCE_LABELS[row.badgeKey],
    userId: row.user.id,
    username: row.user.username,
    name: row.user.name,
    image: row.user.image,
    gender: row.user.gender,
    score: Number(row.score || 0),
    metadata: asPlainMetadata(row.metadata),
    badgeTone: resolveSnapshotTone(),
    snapshotAt: row.snapshotAt,
  };
}

export async function getCommunitySpecialBadgeWinners() {
  const rows = await prisma.specialBadgeSnapshot.findMany({
    orderBy: [{ badgeKey: "asc" }],
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

  const byKey = new Map(rows.map((row) => [row.badgeKey as SpecialBadgeKeyValue, row]));
  return SPECIAL_BADGE_KEY_VALUES.map((badgeKey) => {
    const row = byKey.get(badgeKey);
    if (!row) return null;
    return mapSnapshotToEntry({
      badgeKey,
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
    });
  }).filter((row): row is CommunitySpecialBadgeEntry => row !== null);
}

export async function getCommunitySpecialBadgeSummary(userId: string): Promise<CommunitySpecialBadgeSummary | null> {
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

  const heldRows = isCommunityRankingEligibleUser(normalizedUser)
    ? await prisma.specialBadgeSnapshot.findMany({
        where: { userId },
        orderBy: [{ badgeKey: "asc" }],
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
      })
    : [];

  return {
    user: normalizedUser,
    isEligible: isCommunityRankingEligibleUser(normalizedUser),
    heldBadges: heldRows.map((row) =>
      mapSnapshotToEntry({
        badgeKey: row.badgeKey as SpecialBadgeKeyValue,
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
    ),
  };
}

export function summarizeHeldSpecialBadges(summary: CommunitySpecialBadgeSummary) {
  return {
    badgeKeys: summary.heldBadges.map((badge) => badge.badgeKey),
    labels: summary.heldBadges.map((badge) => badge.label),
    hasAny: summary.heldBadges.length > 0,
  };
}


export async function getCommunityUserSpecialBadgeSummary(userId: string) {
  const summary = await getCommunitySpecialBadgeSummary(userId);
  if (!summary) return null;
  return {
    ...summary,
    badges: summary.heldBadges,
  };
}
