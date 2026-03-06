import "server-only";

import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/requireUser";
import { asOptionalBool as _asOptionalBool, asString as _asString, getClientMeta as _getClientMeta, readJsonObject, toJsonSafe as _toJsonSafe } from "@/server/http";

export type AdminGuardOk = { adminId: string };

export async function adminGuard(): Promise<AdminGuardOk> {
  const { me } = await requireAdmin();
  return { adminId: me.id };
}

export function getClientMeta(req: Request) {
  return _getClientMeta(req);
}

export async function safeJson(req: Request) {
  return (await readJsonObject(req)) as any;
}

export function asString(v: any) {
  return _asString(v);
}

export function asOptionalBool(v: any): boolean | undefined {
  return _asOptionalBool(v);
}

export function parseSearchParams(url: string) {
  const u = new URL(url);
  const q = (u.searchParams.get("q") || "").trim();
  const includeInactive = (u.searchParams.get("includeInactive") || "").trim();
  return { q, includeInactive: includeInactive === "1" || includeInactive.toLowerCase() === "true" };
}

export function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export function toJsonSafe(value: any) {
  return _toJsonSafe(value);
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
    // Return a harmless statement; caller should generally guard against empty pairs.
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
