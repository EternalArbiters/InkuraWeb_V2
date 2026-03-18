import "server-only";

import { Prisma } from "@prisma/client";

import prisma from "@/server/db/prisma";
import {
  getCommunityLeaderboard,
  getLatestCommunityLeaderboardSnapshotAt,
  rebuildMainCommunityLeaderboards,
  type CommunityLeaderboardEntry,
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

export type AdminCommunityPageData = {
  donationEntries: AdminDonationEntryItem[];
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
  const [donationEntries, topDonors, specialWinners, latestMain, latestSpecial] = await Promise.all([
    listAdminDonationEntries(100),
    getCommunityLeaderboard("BEST_DONOR", 7),
    getCommunitySpecialBadgeWinners(),
    getLatestCommunityLeaderboardSnapshotAt(),
    getLatestCommunitySpecialBadgeSnapshotAt(),
  ]);

  return {
    donationEntries,
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
