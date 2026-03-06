import "server-only";

import prisma from "@/server/db/prisma";
import { adminGuard, bulkSortOrderUpdateSql, getClientMeta, safeJson } from "../../_shared";
import { revalidateTag } from "next/cache";
import { json } from "@/server/http";


export const POST = async (req: Request) => {
  const guard = await adminGuard();
  const { adminId } = guard;

  const body = await safeJson(req);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)) : [];
  if (!ids.length) return json({ error: "ids is required" }, { status: 400 });
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) return json({ error: "ids must be unique" }, { status: 400 });
  const { ip, userAgent } = getClientMeta(req);

  try {
    const beforeRows = await prisma.tag.findMany({ where: { id: { in: ids } }, select: { id: true, sortOrder: true } });
    const beforeMap = Object.fromEntries(beforeRows.map((r) => [r.id, r.sortOrder]));
    const pairs = ids.map((id, idx) => ({ id, sortOrder: (idx + 1) * 10 }));
    const afterMap = Object.fromEntries(pairs.map((p) => [p.id, p.sortOrder]));

    await prisma.$transaction([
      prisma.$executeRaw(bulkSortOrderUpdateSql('"Tag"', pairs)),
      prisma.adminAuditLog.create({
        data: {
          adminId,
          action: "REORDER",
          entity: "Tag",
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
    return json({ ok: true, items: result });
  } catch (e: any) {
    console.error("[taxonomy][tags][reorder] failed", e);
    const msg = String(e?.message || "").trim();
    return json({ error: msg ? `Failed to reorder: ${msg}` : "Failed to reorder" }, { status: 500 });
  }
};
