import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { adminGuard, getClientMeta, safeJson } from "../../_shared";
import { revalidateTag } from "next/cache";

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

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard instanceof NextResponse) return guard;
  const { adminId } = guard;

  const body = await safeJson(req);
  const by = normBy(body?.by);
  const dir = normDir(body?.dir);
  const { ip, userAgent } = getClientMeta(req);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.genre.findMany({
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

      await Promise.all(
        ordered.map((r, idx) => tx.genre.update({ where: { id: r.id }, data: { sortOrder: (idx + 1) * 10 } }))
      );

      const afterRows = await tx.genre.findMany({
        where: { id: { in: ordered.map((r) => r.id) } },
        select: { id: true, sortOrder: true },
      });
      const afterMap = Object.fromEntries(afterRows.map((r) => [r.id, r.sortOrder]));

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: `SORT_${by.toUpperCase()}_${dir.toUpperCase()}`,
          entity: "Genre",
          entityId: "BATCH",
          beforeJson: beforeMap as any,
          afterJson: afterMap as any,
          ip,
          userAgent,
        },
      });

      return { by, dir, count: ordered.length };
    });

    revalidateTag("taxonomy");
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Failed to sort" }, { status: 500 });
  }
}
