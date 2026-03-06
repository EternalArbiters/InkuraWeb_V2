import "server-only";

import prisma from "@/server/db/prisma";
import { adminGuard, bulkSortOrderUpdateSql, getClientMeta, safeJson } from "../../_shared";
import { revalidateTag } from "next/cache";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

type SortBy = "alpha" | "count";
type SortDir = "asc" | "desc";

function normBy(v: any): SortBy {
  return v === "count" ? "count" : "alpha";
}

function normDir(v: any): SortDir {
  return v === "desc" ? "desc" : "asc";
}

function alphaCmp(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export const POST = apiRoute(async (req: Request) => {
  const guard = await adminGuard();
  const { adminId } = guard;

  const body = await safeJson(req);
  const by = normBy(body?.by);
  const dir = normDir(body?.dir);
  const { ip, userAgent } = getClientMeta(req);

  try {
    // NOTE: Avoid interactive transactions here; they can time out on serverless.
    const rows = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        sortOrder: true,
        _count: { select: { works: true } },
      },
      take: 5000,
    });

    const beforeMap = Object.fromEntries(rows.map((r) => [r.id, r.sortOrder]));
    const score = (r: (typeof rows)[number]) => (by === "count" ? r._count.works : 0);

    const cmp = (a: (typeof rows)[number], b: (typeof rows)[number]) => {
      if (by === "count") {
        const d = score(a) - score(b);
        if (d !== 0) return dir === "asc" ? d : -d;
        const n = alphaCmp(a.name, b.name);
        return dir === "asc" ? n : -n;
      }
      const n = alphaCmp(a.name, b.name);
      return dir === "asc" ? n : -n;
    };

    const active = rows.filter((r) => r.isActive).sort(cmp);
    const inactive = rows.filter((r) => !r.isActive).sort(cmp);
    const ordered = [...active, ...inactive];

    const pairs = ordered.map((r, idx) => ({ id: r.id, sortOrder: (idx + 1) * 10 }));
    const afterMap = Object.fromEntries(pairs.map((p) => [p.id, p.sortOrder]));

    await prisma.$transaction([
      prisma.$executeRaw(bulkSortOrderUpdateSql('"Tag"', pairs)),
      prisma.adminAuditLog.create({
        data: {
          adminId,
          action: `SORT_${by.toUpperCase()}_${dir.toUpperCase()}`,
          entity: "Tag",
          entityId: "BATCH",
          beforeJson: beforeMap as any,
          afterJson: afterMap as any,
          ip,
          userAgent,
        },
      }),
    ]);

    const result = { by, dir, count: ordered.length };

    revalidateTag("taxonomy");
    return json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[taxonomy][tags][sort] failed", e);
    const msg = String(e?.message || "").trim();
    return json({ error: msg ? `Failed to sort: ${msg}` : "Failed to sort" }, { status: 500 });
  }
});
