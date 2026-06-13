import "server-only";

import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/requireUser";
import { getBooleanFlagParam, getOptionalStringParam } from "@/server/http/queryParams";

export type AdminGuardOk = { adminId: string };

export async function adminGuard(): Promise<AdminGuardOk> {
  const { me } = await requireAdmin();
  return { adminId: me.id };
}

export function parseSearchParams(url: string) {
  const u = new URL(url);
  const q = getOptionalStringParam(u.searchParams, "q") || "";
  return { q, includeInactive: getBooleanFlagParam(u.searchParams, "includeInactive") };
}

export function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export type SortBy = "alpha" | "count";
export type SortDir = "asc" | "desc";

export function normBy(v: any): SortBy {
  return v === "count" ? "count" : "alpha";
}

export function normDir(v: any): SortDir {
  return v === "desc" ? "desc" : "asc";
}

export function alphaCmp(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/**
 * Build a single Postgres UPDATE statement that assigns per-row sortOrder values.
 *
 * Why: interactive transactions can time out on serverless when doing many updates.
 * This packs all changes into 1 query.
 */
export function bulkSortOrderUpdateSql(
  tableQuoted: '"Genre"' | '"Tag"' | '"WarningTag"' | '"DeviantLoveTag"',
  pairs: Array<{ id: string; sortOrder: number }>,
) {
  const table = Prisma.raw(tableQuoted);
  if (!pairs.length) {
    return Prisma.sql`SELECT 1`;
  }
  const values = pairs.map((p) => Prisma.sql`(${p.id}, ${p.sortOrder})`);
  return Prisma.sql`
    UPDATE ${table} AS t
    SET "sortOrder" = v.sortOrder,
        "updatedAt" = NOW()
    FROM (VALUES ${Prisma.join(values)}) AS v(id, sortOrder)
    WHERE t.id = v.id
  `;
}
