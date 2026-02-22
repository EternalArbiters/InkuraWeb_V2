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
