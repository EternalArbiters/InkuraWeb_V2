import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/requireUser";

export type AdminGuardOk = { adminId: string };

export async function adminGuard(): Promise<AdminGuardOk | NextResponse> {
  try {
    const { me } = await requireAdmin();
    return { adminId: me.id };
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export function getClientMeta(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ip, userAgent };
}

export async function safeJson(req: Request) {
  return (await req.json().catch(() => ({}))) as any;
}

export function asString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export function asOptionalBool(v: any): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "1" || t === "yes") return true;
    if (t === "false" || t === "0" || t === "no") return false;
  }
  return undefined;
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
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
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
