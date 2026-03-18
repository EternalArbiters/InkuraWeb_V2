import "server-only";

import prisma from "@/server/db/prisma";
import type { CommunityIdentityBadge } from "@/lib/communityBadges";
import {
  LEADERBOARD_TOP_SIZE,
  SPECIAL_BADGE_KEY_VALUES,
  SPECIAL_BADGE_SOURCE_LABELS,
  STATIC_BADGE_TONES,
  USER_GENDER_VALUES,
  resolveCommunityMainTitle,
  type RankBadgeTone,
  type SpecialBadgeKeyValue,
  type StaticBadgeTone,
  type UserGenderValue,
} from "@/server/services/community/ranking";

type CommunityIdentityUserRow = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
};

export type CommunityRoleBadgeKey = "AUTHOR" | "TRANSLATOR" | "REUPLOADER";

export type CommunityRoleBadgeFlags = {
  isAuthor?: boolean;
  isTranslator?: boolean;
  isReuploader?: boolean;
};

export type CommunityUserIdentity = {
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
  gender: UserGenderValue | null;
  role: string;
  isAdmin: boolean;
  mainTitle: string | null;
  mainBadgeTone: RankBadgeTone | null;
  donorBadgeTone: StaticBadgeTone | null;
  badges: CommunityIdentityBadge[];
};

type IdentitySnapshotInput = {
  user: CommunityIdentityUserRow;
  ranks: Partial<Record<string, number>>;
  specialBadgeKeys: SpecialBadgeKeyValue[];
  roleBadgeFlags?: CommunityRoleBadgeFlags;
};

const BADGE_KIND_ORDER = {
  ADMIN: 0,
  MAIN: 1,
  DONOR: 2,
  SPECIAL: 3,
  ROLE: 4,
} as const satisfies Record<CommunityIdentityBadge["kind"], number>;

const ROLE_BADGE_LABELS: Record<CommunityRoleBadgeKey, string> = {
  AUTHOR: "Author",
  TRANSLATOR: "Translator",
  REUPLOADER: "Reuploader",
};

const ROLE_BADGE_ORDER: Record<CommunityRoleBadgeKey, number> = {
  AUTHOR: 0,
  TRANSLATOR: 1,
  REUPLOADER: 2,
};

function asGender(value: string | null | undefined): UserGenderValue | null {
  return USER_GENDER_VALUES.includes(String(value) as UserGenderValue)
    ? (String(value) as UserGenderValue)
    : null;
}

function isAdminRole(role: string | null | undefined) {
  return String(role || "").trim().toUpperCase() === "ADMIN";
}

function badgeIdentityKey(badge: CommunityIdentityBadge) {
  return `${badge.kind}:${badge.badgeKey || ""}:${badge.label}`;
}

function compareBadgeLabels(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function resolveCommunityRoleBadges(flags?: CommunityRoleBadgeFlags | null) {
  if (!flags) return [] as CommunityIdentityBadge[];

  const roleKeys: CommunityRoleBadgeKey[] = [];
  if (flags.isAuthor) roleKeys.push("AUTHOR");
  if (flags.isTranslator) roleKeys.push("TRANSLATOR");
  if (flags.isReuploader) roleKeys.push("REUPLOADER");

  return roleKeys.map((roleKey) => ({
    kind: "ROLE" as const,
    label: ROLE_BADGE_LABELS[roleKey],
    tone: STATIC_BADGE_TONES.ROLE,
    badgeKey: roleKey,
  }));
}

export function sortAndDeduplicateCommunityIdentityBadges(badges: CommunityIdentityBadge[]) {
  const unique = new Map<string, CommunityIdentityBadge>();
  for (const badge of badges || []) {
    const key = badgeIdentityKey(badge);
    if (!unique.has(key)) unique.set(key, badge);
  }

  return Array.from(unique.values()).sort((a, b) => {
    const kindOrder = BADGE_KIND_ORDER[a.kind] - BADGE_KIND_ORDER[b.kind];
    if (kindOrder !== 0) return kindOrder;

    if (a.kind === "SPECIAL" || b.kind === "SPECIAL") {
      const aIndex = SPECIAL_BADGE_KEY_VALUES.indexOf((a.badgeKey || "") as SpecialBadgeKeyValue);
      const bIndex = SPECIAL_BADGE_KEY_VALUES.indexOf((b.badgeKey || "") as SpecialBadgeKeyValue);
      if (aIndex !== bIndex) return aIndex - bIndex;
    }

    if (a.kind === "ROLE" || b.kind === "ROLE") {
      const aIndex = ROLE_BADGE_ORDER[(a.badgeKey || "") as CommunityRoleBadgeKey] ?? Number.MAX_SAFE_INTEGER;
      const bIndex = ROLE_BADGE_ORDER[(b.badgeKey || "") as CommunityRoleBadgeKey] ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
    }

    return compareBadgeLabels(a.label, b.label);
  });
}

function buildRoleBadgeFlagsByUserId(
  rows: Array<{ authorId: string; translatorId: string | null; publishType: string }>,
  uniqueUserIds: string[]
) {
  const userIdSet = new Set(uniqueUserIds);
  const flagsByUserId = new Map<string, CommunityRoleBadgeFlags>();

  const ensureFlags = (userId: string) => {
    const current = flagsByUserId.get(userId) || {};
    flagsByUserId.set(userId, current);
    return current;
  };

  for (const row of rows) {
    if (row.publishType === "ORIGINAL" && userIdSet.has(row.authorId)) {
      ensureFlags(row.authorId).isAuthor = true;
    }
    if (row.publishType === "REUPLOAD" && userIdSet.has(row.authorId)) {
      ensureFlags(row.authorId).isReuploader = true;
    }
    if (row.publishType === "TRANSLATION" && row.translatorId && userIdSet.has(row.translatorId)) {
      ensureFlags(row.translatorId).isTranslator = true;
    }
  }

  return flagsByUserId;
}

export function buildCommunityUserIdentityFromSnapshots(input: IdentitySnapshotInput): CommunityUserIdentity {
  const { user, ranks, specialBadgeKeys, roleBadgeFlags } = input;
  const normalizedUser: CommunityIdentityUserRow = {
    ...user,
    gender: asGender(user.gender),
  };

  if (isAdminRole(normalizedUser.role)) {
    return {
      userId: normalizedUser.id,
      username: normalizedUser.username,
      name: normalizedUser.name,
      image: normalizedUser.image,
      gender: normalizedUser.gender,
      role: normalizedUser.role,
      isAdmin: true,
      mainTitle: null,
      mainBadgeTone: null,
      donorBadgeTone: null,
      badges: [
        {
          kind: "ADMIN",
          label: "Admin",
          tone: STATIC_BADGE_TONES.ADMIN,
        },
      ],
    };
  }

  const mainTitle = resolveCommunityMainTitle({
    authorRank: ranks.BEST_AUTHOR ?? null,
    translatorRank: ranks.BEST_TRANSLATOR ?? null,
    readerRank: ranks.BEST_READER ?? null,
    userRank: ranks.BEST_USER ?? null,
    gender: normalizedUser.gender,
  });

  const donorRank = typeof ranks.BEST_DONOR === "number" ? ranks.BEST_DONOR : null;
  const donorBadgeTone = donorRank && donorRank <= LEADERBOARD_TOP_SIZE ? STATIC_BADGE_TONES.DONOR : null;

  const badges: CommunityIdentityBadge[] = [];
  if (mainTitle.mainTitle && mainTitle.badgeTone) {
    badges.push({
      kind: "MAIN",
      label: mainTitle.mainTitle,
      tone: mainTitle.badgeTone,
    });
  }

  if (donorBadgeTone) {
    badges.push({
      kind: "DONOR",
      label: "Donatur",
      tone: donorBadgeTone,
    });
  }

  for (const badgeKey of SPECIAL_BADGE_KEY_VALUES) {
    if (!specialBadgeKeys.includes(badgeKey)) continue;
    badges.push({
      kind: "SPECIAL",
      badgeKey,
      label: SPECIAL_BADGE_SOURCE_LABELS[badgeKey],
      tone: STATIC_BADGE_TONES.SPECIAL,
    });
  }

  badges.push(...resolveCommunityRoleBadges(roleBadgeFlags));

  return {
    userId: normalizedUser.id,
    username: normalizedUser.username,
    name: normalizedUser.name,
    image: normalizedUser.image,
    gender: normalizedUser.gender,
    role: normalizedUser.role,
    isAdmin: false,
    mainTitle: mainTitle.mainTitle,
    mainBadgeTone: mainTitle.badgeTone,
    donorBadgeTone,
    badges: sortAndDeduplicateCommunityIdentityBadges(badges),
  };
}

export async function getCommunityUserIdentityMap(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.map((value) => String(value || "").trim()).filter(Boolean)));
  if (!uniqueUserIds.length) return new Map<string, CommunityUserIdentity>();

  const [users, leaderboardSnapshots, specialBadgeSnapshots, publishedWorks] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        gender: true,
        role: true,
      },
    }),
    prisma.leaderboardSnapshot.findMany({
      where: { userId: { in: uniqueUserIds }, period: "ALL_TIME" },
      select: {
        userId: true,
        category: true,
        rank: true,
      },
    }),
    prisma.specialBadgeSnapshot.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: {
        userId: true,
        badgeKey: true,
      },
    }),
    prisma.work.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ authorId: { in: uniqueUserIds } }, { translatorId: { in: uniqueUserIds } }],
      },
      select: {
        authorId: true,
        translatorId: true,
        publishType: true,
      },
    }),
  ]);

  const ranksByUserId = new Map<string, Partial<Record<string, number>>>();
  for (const row of leaderboardSnapshots) {
    const current = ranksByUserId.get(row.userId) || {};
    current[row.category] = row.rank;
    ranksByUserId.set(row.userId, current);
  }

  const specialBadgeKeysByUserId = new Map<string, SpecialBadgeKeyValue[]>();
  for (const row of specialBadgeSnapshots) {
    const current = specialBadgeKeysByUserId.get(row.userId) || [];
    current.push(row.badgeKey as SpecialBadgeKeyValue);
    specialBadgeKeysByUserId.set(row.userId, current);
  }

  const roleBadgeFlagsByUserId = buildRoleBadgeFlagsByUserId(publishedWorks, uniqueUserIds);

  const identities: CommunityUserIdentity[] = users.map((user: any) =>
    buildCommunityUserIdentityFromSnapshots({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        gender: asGender(user.gender),
        role: user.role,
      },
      ranks: ranksByUserId.get(user.id) || {},
      specialBadgeKeys: specialBadgeKeysByUserId.get(user.id) || [],
      roleBadgeFlags: roleBadgeFlagsByUserId.get(user.id) || {},
    })
  );

  return new Map<string, CommunityUserIdentity>(identities.map((identity: CommunityUserIdentity) => [identity.userId, identity]));
}

export async function getCommunityUserIdentity(userId: string) {
  const map = await getCommunityUserIdentityMap([userId]);
  return map.get(userId) || null;
}
