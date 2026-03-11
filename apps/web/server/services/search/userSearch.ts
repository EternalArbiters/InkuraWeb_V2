import "server-only";

import prisma from "@/server/db/prisma";

const USER_SEARCH_SCOPE_VALUES = ["all", "authors", "translators"] as const;

export type UserSearchScope = (typeof USER_SEARCH_SCOPE_VALUES)[number];

export type UserSearchResult = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  avatarFocusX: number | null;
  avatarFocusY: number | null;
  avatarZoom: number | null;
  createdAt: Date;
  originalWorksCount: number;
  translationWorksCount: number;
  reuploadWorksCount: number;
};

function normalizeScope(value: string | null | undefined): UserSearchScope {
  const normalized = String(value || "").trim().toLowerCase();
  return USER_SEARCH_SCOPE_VALUES.includes(normalized as UserSearchScope)
    ? (normalized as UserSearchScope)
    : "all";
}

function toNeedle(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function relevanceForUser(user: { username: string; name: string | null }, q: string) {
  const needle = toNeedle(q);
  if (!needle) return 0;

  const username = toNeedle(user.username);
  const name = toNeedle(user.name);

  if (username === needle) return 100;
  if (name === needle) return 95;
  if (username.startsWith(needle)) return 80;
  if (name.startsWith(needle)) return 70;
  if (username.includes(needle)) return 60;
  if (name.includes(needle)) return 50;
  return 0;
}

export function parseUserSearchParams(input: { q?: string | string[]; scope?: string | string[] }) {
  const qRaw = Array.isArray(input.q) ? input.q[0] : input.q;
  const scopeRaw = Array.isArray(input.scope) ? input.scope[0] : input.scope;

  return {
    q: String(qRaw || "").trim(),
    scope: normalizeScope(scopeRaw),
  };
}

export async function searchUsers(input: {
  q?: string;
  scope?: UserSearchScope;
  take?: number;
}) {
  const q = String(input.q || "").trim();
  const scope = normalizeScope(input.scope);
  const take = Math.max(1, Math.min(48, Number(input.take || 24)));

  const andFilters: any[] = [{ username: { not: null } }];

  if (q) {
    andFilters.push({
      OR: [
        { username: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  const users = await prisma.user.findMany({
    where: { AND: andFilters },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: q ? Math.max(take * 2, 24) : take,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      avatarFocusX: true,
      avatarFocusY: true,
      avatarZoom: true,
      createdAt: true,
    },
  });

  const userIds = users.map((user) => user.id);

  const authoredTypeCounts = userIds.length
    ? await prisma.work.groupBy({
        by: ["authorId", "publishType"],
        where: {
          status: "PUBLISHED",
          authorId: { in: userIds },
        },
        _count: { _all: true },
      })
    : [];

  const typeCountMaps = {
    ORIGINAL: new Map<string, number>(),
    TRANSLATION: new Map<string, number>(),
    REUPLOAD: new Map<string, number>(),
  };

  for (const row of authoredTypeCounts) {
    const map = typeCountMaps[row.publishType as keyof typeof typeCountMaps];
    if (!map) continue;
    map.set(String(row.authorId), row._count._all);
  }

  const enriched: UserSearchResult[] = users
    .map((user) => ({
      id: user.id,
      username: String(user.username || ""),
      name: user.name,
      image: user.image,
      avatarFocusX: user.avatarFocusX,
      avatarFocusY: user.avatarFocusY,
      avatarZoom: user.avatarZoom,
      createdAt: user.createdAt,
      originalWorksCount: Number(typeCountMaps.ORIGINAL.get(user.id) || 0),
      translationWorksCount: Number(typeCountMaps.TRANSLATION.get(user.id) || 0),
      reuploadWorksCount: Number(typeCountMaps.REUPLOAD.get(user.id) || 0),
    }))
    .filter((user) => {
      if (scope === "authors") return user.originalWorksCount > 0;
      if (scope === "translators") return user.translationWorksCount > 0;
      return true;
    })
    .sort((a, b) => {
      const relevanceDiff = relevanceForUser(b, q) - relevanceForUser(a, q);
      if (relevanceDiff !== 0) return relevanceDiff;

      if (scope === "authors") {
        const authoredDiff = b.originalWorksCount - a.originalWorksCount;
        if (authoredDiff !== 0) return authoredDiff;
      }

      if (scope === "translators") {
        const translatedDiff = b.translationWorksCount - a.translationWorksCount;
        if (translatedDiff !== 0) return translatedDiff;
      }

      const combinedCountDiff =
        b.originalWorksCount + b.translationWorksCount + b.reuploadWorksCount -
        (a.originalWorksCount + a.translationWorksCount + a.reuploadWorksCount);
      if (combinedCountDiff !== 0) return combinedCountDiff;

      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, take);

  return {
    q,
    scope,
    users: enriched,
  };
}
