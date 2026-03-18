import "server-only";

import { Prisma } from "@prisma/client";

import prisma from "@/server/db/prisma";
import {
  getCommunityLeaderboard,
  getLatestCommunityLeaderboardSnapshotAt,
  rankCommunityScoreRows,
  rebuildMainCommunityLeaderboards,
  type CommunityLeaderboardEntry,
  type CommunityScoreRow,
} from "@/server/services/community/leaderboards";
import {
  getCommunitySpecialBadgeWinners,
  getLatestCommunitySpecialBadgeSnapshotAt,
  rebuildCommunitySpecialBadges,
  type CommunitySpecialBadgeEntry,
} from "@/server/services/community/specialBadges";

export type AdminDonationEntryItem = {
  id: string;
  amount: number;
  currency: string;
  note: string | null;
  donatedAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    email: string | null;
  };
  createdByAdmin: {
    id: string;
    username: string | null;
    name: string | null;
  };
};

export type AdminDonorTotalItem = {
  rank: number;
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
  email: string | null;
  score: number;
  donationCount: number;
  currency: string;
  currencies: string[];
  latestDonatedAt: string | null;
};

export type AdminCommunityPageData = {
  donationEntries: AdminDonationEntryItem[];
  donorTotals: AdminDonorTotalItem[];
  topDonors: CommunityLeaderboardEntry[];
  specialWinners: CommunitySpecialBadgeEntry[];
  latestMainSnapshotAt: string | null;
  latestSpecialSnapshotAt: string | null;
};

export type DonationEntryPayload = {
  target: string;
  amount: number | string;
  currency?: string | null;
  note?: string | null;
  donatedAt?: string | Date | null;
};

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(2));
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function normalizeCommunityUserLookup(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("@") ? raw.slice(1).trim() : raw;
}

export function sanitizeDonationCurrency(value: unknown) {
  const cleaned = String(value || "IDR")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return (cleaned || "IDR").slice(0, 8);
}

export function sanitizeDonationNote(value: unknown) {
  const note = String(value || "").trim();
  if (!note) return null;
  return note.slice(0, 500);
}

export function parseDonationAmount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  return Number(parsed.toFixed(2));
}

export function parseDonationDate(value: unknown) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid donation date");
  }
  return date;
}

async function resolveDonationTargetUser(target: string) {
  const raw = String(target || "").trim();
  const normalized = normalizeCommunityUserLookup(raw);
  if (!normalized) throw new Error("Target user is required");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: raw },
        { username: { equals: normalized, mode: "insensitive" } },
        { email: { equals: raw, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      email: true,
      role: true,
    },
  });

  if (!user) throw new Error("User not found");
  if (String(user.role || "").toUpperCase() === "ADMIN") {
    throw new Error("Admin cannot be added to community donor rankings");
  }

  return user;
}

function mapDonationEntry(row: {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  note: string | null;
  donatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; username: string | null; name: string | null; image: string | null; email: string | null };
  createdByAdmin: { id: string; username: string | null; name: string | null };
}): AdminDonationEntryItem {
  return {
    id: row.id,
    amount: decimalToNumber(row.amount),
    currency: String(row.currency || "IDR").toUpperCase(),
    note: row.note,
    donatedAt: row.donatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user,
    createdByAdmin: row.createdByAdmin,
  };
}

function latestIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function listAdminDonorTotals(limit = 500) {
  const donationRows = await prisma.donationEntry.findMany({
    orderBy: [{ donatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      userId: true,
      amount: true,
      currency: true,
      donatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  const usersById = new Map<string, {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    email: string | null;
    createdAt: Date;
  }>();

  const accByUserId = new Map<string, {
    total: number;
    donationCount: number;
    currencies: Set<string>;
    latestDonatedAt: Date | null;
  }>();

  for (const row of donationRows) {
    const role = String(row.user.role || "").toUpperCase();
    if (role === "ADMIN") continue;

    usersById.set(row.userId, {
      id: row.user.id,
      username: row.user.username,
      name: row.user.name,
      image: row.user.image,
      email: row.user.email,
      createdAt: row.user.createdAt,
    });

    const existing = accByUserId.get(row.userId) || { total: 0, donationCount: 0, currencies: new Set<string>(), latestDonatedAt: null as Date | null };
    existing.total += Number(row.amount || 0);
    existing.donationCount += 1;
    existing.currencies.add(String(row.currency || "IDR").toUpperCase());
    if (!existing.latestDonatedAt || row.donatedAt > existing.latestDonatedAt) {
      existing.latestDonatedAt = row.donatedAt;
    }
    accByUserId.set(row.userId, existing);
  }

  const scoreRows: CommunityScoreRow[] = Array.from(accByUserId.entries()).map(([userId, acc]) => {
    const user = usersById.get(userId);
    const currencies = Array.from(acc.currencies.values()).sort();
    return {
      userId,
      score: acc.total,
      primaryMetric: acc.donationCount,
      breadthMetric: currencies.length,
      createdAt: user?.createdAt || new Date(0),
      metadata: {
        donationCount: acc.donationCount,
        currency: currencies[0] || "IDR",
        currencies,
        latestDonatedAt: latestIso(acc.latestDonatedAt) || "",
      },
    } satisfies CommunityScoreRow;
  });

  return rankCommunityScoreRows(scoreRows)
    .slice(0, Math.max(1, Math.min(limit, 1000)))
    .map((row) => {
      const user = usersById.get(row.userId);
      const currencies = Array.isArray(row.metadata?.currencies)
        ? row.metadata.currencies.filter((value): value is string => typeof value === "string")
        : [];
      return {
        rank: row.rank,
        userId: row.userId,
        username: user?.username || null,
        name: user?.name || null,
        image: user?.image || null,
        email: user?.email || null,
        score: decimalToNumber(row.score),
        donationCount: Number(row.metadata?.donationCount || 0),
        currency: String(row.metadata?.currency || "IDR").toUpperCase(),
        currencies,
        latestDonatedAt: typeof row.metadata?.latestDonatedAt === "string" ? row.metadata.latestDonatedAt : null,
      } satisfies AdminDonorTotalItem;
    });
}

export async function listAdminDonationEntries(limit = 100) {
  const rows = await prisma.donationEntry.findMany({
    orderBy: [{ donatedAt: "desc" }, { createdAt: "desc" }],
    take: Math.max(1, Math.min(limit, 200)),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          email: true,
        },
      },
      createdByAdmin: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return rows.map(mapDonationEntry);
}

export async function getAdminCommunityPageData(): Promise<AdminCommunityPageData> {
  const [donationEntries, donorTotals, topDonors, specialWinners, latestMain, latestSpecial] = await Promise.all([
    listAdminDonationEntries(100),
    listAdminDonorTotals(500),
    getCommunityLeaderboard("BEST_DONOR", 7),
    getCommunitySpecialBadgeWinners(),
    getLatestCommunityLeaderboardSnapshotAt(),
    getLatestCommunitySpecialBadgeSnapshotAt(),
  ]);

  return {
    donationEntries,
    donorTotals,
    topDonors,
    specialWinners,
    latestMainSnapshotAt: toIso(latestMain),
    latestSpecialSnapshotAt: toIso(latestSpecial),
  };
}

export async function createDonationEntry(adminUserId: string, payload: DonationEntryPayload) {
  const targetUser = await resolveDonationTargetUser(payload.target);
  const amount = parseDonationAmount(payload.amount);
  const currency = sanitizeDonationCurrency(payload.currency);
  const note = sanitizeDonationNote(payload.note);
  const donatedAt = parseDonationDate(payload.donatedAt);

  const row = await prisma.donationEntry.create({
    data: {
      userId: targetUser.id,
      createdByAdminId: adminUserId,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      currency,
      note,
      donatedAt,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          email: true,
        },
      },
      createdByAdmin: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return mapDonationEntry(row);
}

export async function updateDonationEntry(_adminUserId: string, entryId: string, payload: Omit<DonationEntryPayload, "target">) {
  const existing = await prisma.donationEntry.findUnique({
    where: { id: entryId },
    select: { id: true },
  });

  if (!existing) throw new Error("Donation entry not found");

  const amount = parseDonationAmount(payload.amount);
  const currency = sanitizeDonationCurrency(payload.currency);
  const note = sanitizeDonationNote(payload.note);
  const donatedAt = parseDonationDate(payload.donatedAt);

  const row = await prisma.donationEntry.update({
    where: { id: entryId },
    data: {
      amount: new Prisma.Decimal(amount.toFixed(2)),
      currency,
      note,
      donatedAt,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          email: true,
        },
      },
      createdByAdmin: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return mapDonationEntry(row);
}

export async function deleteDonationEntry(entryId: string) {
  const existing = await prisma.donationEntry.findUnique({
    where: { id: entryId },
    select: { id: true },
  });
  if (!existing) throw new Error("Donation entry not found");
  await prisma.donationEntry.delete({ where: { id: entryId } });
  return { ok: true, entryId };
}

export async function rebuildCommunitySnapshots() {
  const main = await rebuildMainCommunityLeaderboards();
  const special = await rebuildCommunitySpecialBadges();
  const [latestMainSnapshotAt, latestSpecialSnapshotAt] = await Promise.all([
    getLatestCommunityLeaderboardSnapshotAt(),
    getLatestCommunitySpecialBadgeSnapshotAt(),
  ]);

  return {
    ok: true,
    main,
    special,
    latestMainSnapshotAt: toIso(latestMainSnapshotAt),
    latestSpecialSnapshotAt: toIso(latestSpecialSnapshotAt),
  };
}
