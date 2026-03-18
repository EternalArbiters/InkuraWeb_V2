import "server-only";

export const LEADERBOARD_TOP_SIZE = 7 as const;

export const LEADERBOARD_PERIOD_VALUES = ["ALL_TIME"] as const;
export type LeaderboardPeriodValue = (typeof LEADERBOARD_PERIOD_VALUES)[number];

export const LEADERBOARD_CATEGORY_VALUES = [
  "BEST_AUTHOR",
  "BEST_TRANSLATOR",
  "BEST_READER",
  "BEST_USER",
  "BEST_DONOR",
] as const;
export type LeaderboardCategoryValue = (typeof LEADERBOARD_CATEGORY_VALUES)[number];

export const SPECIAL_BADGE_KEY_VALUES = [
  "PRIDE",
  "ENVY",
  "WRATH",
  "SLOTH",
  "GREED",
  "GLUTTONY",
  "LUST",
] as const;
export type SpecialBadgeKeyValue = (typeof SPECIAL_BADGE_KEY_VALUES)[number];

export const USER_GENDER_VALUES = ["MALE", "FEMALE", "PREFER_NOT_TO_SAY"] as const;
export type UserGenderValue = (typeof USER_GENDER_VALUES)[number];

export type RankBadgeTone = "PURPLE" | "INDIGO" | "BLUE" | "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type StaticBadgeTone = "PLATINUM" | "GOLD" | "GRAY";
export type CommunityTitleTrack = "CREATOR" | "NOBLE" | "DONOR";

const CREATOR_RANK_TITLES = ["Diamond", "Ruby", "Sapphire", "Emerald", "Pearl", "Citrine", "Garnet"] as const;
const NOBLE_RANK_TITLES = {
  MALE: ["Emperor", "King", "Duke", "Marquis", "Count", "Viscount", "Baron"],
  FEMALE: ["Empress", "Queen", "Duchess", "Marchioness", "Countess", "Viscountess", "Baroness"],
  PREFER_NOT_TO_SAY: ["Emperor", "King", "Duke", "Marquis", "Count", "Viscount", "Baron"],
} as const satisfies Record<UserGenderValue, readonly string[]>;

export const RANK_BADGE_TONES = {
  1: "PURPLE",
  2: "INDIGO",
  3: "BLUE",
  4: "GREEN",
  5: "YELLOW",
  6: "ORANGE",
  7: "RED",
} as const satisfies Record<number, RankBadgeTone>;

export const STATIC_BADGE_TONES = {
  ADMIN: "PLATINUM",
  SPECIAL: "GOLD",
  DONOR: "GOLD",
  ROLE: "GRAY",
} as const satisfies Record<string, StaticBadgeTone>;

export const LEADERBOARD_SOURCE_LABELS: Record<LeaderboardCategoryValue, string> = {
  BEST_AUTHOR: "Best Author",
  BEST_TRANSLATOR: "Best Translator",
  BEST_READER: "Best Reader",
  BEST_USER: "Best User",
  BEST_DONOR: "Best Donor",
};

export const LEADERBOARD_TITLE_TRACKS: Record<LeaderboardCategoryValue, CommunityTitleTrack> = {
  BEST_AUTHOR: "CREATOR",
  BEST_TRANSLATOR: "CREATOR",
  BEST_READER: "NOBLE",
  BEST_USER: "NOBLE",
  BEST_DONOR: "DONOR",
};

export const SPECIAL_BADGE_SOURCE_LABELS: Record<SpecialBadgeKeyValue, string> = {
  PRIDE: "Pride",
  ENVY: "Envy",
  WRATH: "Wrath",
  SLOTH: "Sloth",
  GREED: "Greed",
  GLUTTONY: "Gluttony",
  LUST: "Lust",
};

function normalizeRank(rank: number | null | undefined) {
  if (!Number.isInteger(rank)) return null;
  if (!rank || rank < 1 || rank > LEADERBOARD_TOP_SIZE) return null;
  return rank as keyof typeof RANK_BADGE_TONES;
}

export function isAdminExcludedFromCommunityRanking(user: { role?: string | null } | null | undefined) {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

export function isCommunityRankingEligibleUser(user: { role?: string | null } | null | undefined) {
  if (!user) return false;
  return !isAdminExcludedFromCommunityRanking(user);
}

export function isAmountBasedLeaderboardCategory(category: LeaderboardCategoryValue) {
  return category === "BEST_DONOR";
}

export function resolveRankBadgeTone(rank: number | null | undefined): RankBadgeTone | null {
  const normalized = normalizeRank(rank);
  return normalized ? RANK_BADGE_TONES[normalized] : null;
}

export function resolveCreatorTitle(rank: number | null | undefined): string | null {
  const normalized = normalizeRank(rank);
  if (!normalized) return null;
  return CREATOR_RANK_TITLES[normalized - 1] ?? null;
}

export function resolveNobleTitle(rank: number | null | undefined, gender?: UserGenderValue | null): string | null {
  const normalized = normalizeRank(rank);
  if (!normalized) return null;
  const key = gender === "FEMALE" ? "FEMALE" : gender === "MALE" ? "MALE" : "PREFER_NOT_TO_SAY";
  return NOBLE_RANK_TITLES[key][normalized - 1] ?? null;
}

export function pickBestLeaderboardRank(...ranks: Array<number | null | undefined>) {
  const eligible = ranks
    .map((rank) => normalizeRank(rank))
    .filter((rank): rank is keyof typeof RANK_BADGE_TONES => rank !== null)
    .sort((a, b) => a - b);
  return eligible[0] ?? null;
}

export function resolveCommunityMainTitle(input: {
  authorRank?: number | null;
  translatorRank?: number | null;
  readerRank?: number | null;
  userRank?: number | null;
  gender?: UserGenderValue | null;
}) {
  const creatorRank = pickBestLeaderboardRank(input.authorRank, input.translatorRank);
  const nobleRank = pickBestLeaderboardRank(input.readerRank, input.userRank);
  const creatorTitle = resolveCreatorTitle(creatorRank);
  const nobleTitle = resolveNobleTitle(nobleRank, input.gender);
  const mainTitle = [creatorTitle, nobleTitle].filter(Boolean).join(" ") || null;
  const primaryRank = pickBestLeaderboardRank(creatorRank, nobleRank);

  return {
    creatorRank,
    nobleRank,
    primaryRank,
    creatorTitle,
    nobleTitle,
    mainTitle,
    badgeTone: resolveRankBadgeTone(primaryRank),
  };
}
