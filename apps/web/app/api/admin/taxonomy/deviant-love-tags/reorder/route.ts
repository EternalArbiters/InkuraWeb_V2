import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { adminGuard, bulkSortOrderUpdateSql, getClientMeta, safeJson } from "../../_shared";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard instanceof NextResponse) return guard;
  const { adminId } = guard;

  const body = await safeJson(req);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)) : [];
  if (!ids.length) return NextResponse.json({ error: "ids is required" }, { status: 400 });
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) return NextResponse.json({ error: "ids must be unique" }, { status: 400 });
  const { ip, userAgent } = getClientMeta(req);

  try {
    const beforeRows = await prisma.deviantLoveTag.findMany({ where: { id: { in: ids } }, select: { id: true, sortOrder: true } });
    const beforeMap = Object.fromEntries(beforeRows.map((r) => [r.id, r.sortOrder]));
    const pairs = ids.map((id, idx) => ({ id, sortOrder: (idx + 1) * 10 }));
    const afterMap = Object.fromEntries(pairs.map((p) => [p.id, p.sortOrder]));

    await prisma.$transaction([
      prisma.$executeRaw(bulkSortOrderUpdateSql('"DeviantLoveTag"', pairs)),
      prisma.adminAuditLog.create({
        data: {
          adminId,
          action: "REORDER",
          entity: "DeviantLoveTag",
          entityId: "BATCH",
          beforeJson: beforeMap as any,
          afterJson: afterMap as any,
          ip,
          userAgent,
        },
      }),
    ]);

    const result = pairs;

    revalidateTag("taxonomy");
    return NextResponse.json({ ok: true, items: result });
  } catch (e: any) {
    console.error("[taxonomy][deviant-love-tags][reorder] failed", e);
    const msg = String(e?.message || "").trim();
    return NextResponse.json({ error: msg ? `Failed to reorder: ${msg}` : "Failed to reorder" }, { status: 500 });
  }
}
