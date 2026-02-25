import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { adminGuard, getClientMeta, safeJson } from "../../_shared";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard instanceof NextResponse) return guard;
  const { adminId } = guard;

  const body = await safeJson(req);
  const ids = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)) : [];
  if (!ids.length) return NextResponse.json({ error: "ids is required" }, { status: 400 });
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) return NextResponse.json({ error: "ids must be unique" }, { status: 400 });
  const { ip, userAgent } = getClientMeta(req);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const beforeRows = await tx.warningTag.findMany({ where: { id: { in: ids } }, select: { id: true, sortOrder: true } });
      const beforeMap = Object.fromEntries(beforeRows.map((r) => [r.id, r.sortOrder]));

      // IMPORTANT: Avoid massive parallel queries inside a transaction (can fail on serverless).
      for (let idx = 0; idx < ids.length; idx++) {
        const id = ids[idx];
        // eslint-disable-next-line no-await-in-loop
        await tx.warningTag.update({ where: { id }, data: { sortOrder: (idx + 1) * 10 } });
      }

      const afterRows = await tx.warningTag.findMany({ where: { id: { in: ids } }, select: { id: true, sortOrder: true } });
      const afterMap = Object.fromEntries(afterRows.map((r) => [r.id, r.sortOrder]));

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "REORDER",
          entity: "WarningTag",
          entityId: "BATCH",
          beforeJson: beforeMap as any,
          afterJson: afterMap as any,
          ip,
          userAgent,
        },
      });

      return afterRows;
    });

    revalidateTag("taxonomy");
    return NextResponse.json({ ok: true, items: result });
  } catch {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
