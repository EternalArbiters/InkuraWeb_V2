import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { revalidateTag } from "next/cache";
import { apiRoute, json, asString, asOptionalBool, getClientMeta, readJsonObject, toJsonSafe, notFound, badRequest, conflict, internalError } from "@/server/http";
import { adminGuard, alphaCmp, bulkSortOrderUpdateSql, isUniqueViolation, normBy, normDir, parseSearchParams } from "./_shared";

type TaxonomyDelegate = {
  findMany(args?: any): Promise<any[]>;
  create(args: any): Promise<any>;
  findUnique(args: any): Promise<any | null>;
  update(args: any): Promise<any>;
};

export type TaxonomyConfig = {
  entity: string;
  tableQuoted: '"Genre"' | '"Tag"' | '"WarningTag"' | '"DeviantLoveTag"';
  nameMax: number;
  slugMax: number;
  listTake: number;
  model: TaxonomyDelegate;
  txModel: (tx: any) => TaxonomyDelegate;
};

export type TaxonomySortConfig = {
  countSelect: Record<string, boolean>;
  getScore: (count: Record<string, number>) => number;
};

export function createCollectionHandlers(cfg: TaxonomyConfig) {
  const GET = apiRoute(async (req: Request) => {
    await adminGuard();
    const { q, includeInactive } = parseSearchParams(req.url);
    const where: any = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }
        : {}),
    };
    const items = await cfg.model.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: cfg.listTake,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        isSystem: true,
        isLocked: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return json({ ok: true, items });
  });

  const POST = apiRoute(async (req: Request) => {
    const { adminId } = await adminGuard();
    const body = (await readJsonObject(req)) as any;
    const name = asString(body?.name).slice(0, cfg.nameMax);
    if (!name) return badRequest("Name is required");
    const slugRaw = asString(body?.slug).slice(0, cfg.slugMax);
    const slug = (slugRaw || slugify(name)).slice(0, cfg.slugMax);
    if (!slug) return badRequest("Slug is required");
    const isLocked = asOptionalBool(body?.isLocked) ?? false;
    const isActive = asOptionalBool(body?.isActive) ?? true;
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
    const { ip, userAgent } = getClientMeta(req);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const row = await cfg.txModel(tx).create({
          data: { name, slug, isSystem: false, isLocked, isActive, sortOrder },
        });
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "CREATE",
            entity: cfg.entity,
            entityId: row.id,
            beforeJson: Prisma.DbNull,
            afterJson: toJsonSafe(row) as any,
            ip,
            userAgent,
          },
        });
        return row;
      });
      revalidateTag("taxonomy");
      return json({ ok: true, item: created });
    } catch (e) {
      if (isUniqueViolation(e)) return conflict("Slug already exists");
      return internalError("Failed to create");
    }
  });

  return { GET, POST };
}

export function createItemHandlers(cfg: TaxonomyConfig) {
  const PATCH = apiRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { adminId } = await adminGuard();
    const { id } = await ctx.params;
    const body = (await readJsonObject(req)) as any;
    const { ip, userAgent } = getClientMeta(req);
    const name = asString(body?.name).slice(0, cfg.nameMax);
    const slugRaw = asString(body?.slug).slice(0, cfg.slugMax);
    const slug = slugRaw || undefined;
    const isActive = asOptionalBool(body?.isActive);
    const isLocked = asOptionalBool(body?.isLocked);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const m = cfg.txModel(tx);
        const before = await m.findUnique({ where: { id } });
        if (!before) throw new Error("NOT_FOUND");
        if (before.isLocked && isActive === false) throw new Error("LOCKED");

        const data: any = {};
        if (name) data.name = name;
        if (slug) data.slug = slugify(slug).slice(0, cfg.slugMax);
        if (typeof isActive === "boolean") data.isActive = isActive;
        if (typeof isLocked === "boolean") data.isLocked = isLocked;
        if (Object.keys(data).length === 0) return before;

        const after = await m.update({ where: { id }, data });
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: typeof isActive === "boolean" ? (isActive ? "REACTIVATE" : "DEACTIVATE") : "UPDATE",
            entity: cfg.entity,
            entityId: id,
            beforeJson: toJsonSafe(before) as any,
            afterJson: toJsonSafe(after) as any,
            ip,
            userAgent,
          },
        });
        return after;
      });
      revalidateTag("taxonomy");
      return json({ ok: true, item: updated });
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "NOT_FOUND") return notFound();
      if (msg === "LOCKED") return badRequest("Locked");
      if (isUniqueViolation(e)) return conflict("Slug already exists");
      return internalError("Failed to update");
    }
  });

  const DELETE = apiRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { adminId } = await adminGuard();
    const { id } = await ctx.params;
    const { ip, userAgent } = getClientMeta(req);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const m = cfg.txModel(tx);
        const before = await m.findUnique({ where: { id } });
        if (!before) throw new Error("NOT_FOUND");
        if (before.isLocked) throw new Error("LOCKED");
        const after = await m.update({ where: { id }, data: { isActive: false } });
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "DEACTIVATE",
            entity: cfg.entity,
            entityId: id,
            beforeJson: toJsonSafe(before) as any,
            afterJson: toJsonSafe(after) as any,
            ip,
            userAgent,
          },
        });
        return after;
      });
      revalidateTag("taxonomy");
      return json({ ok: true, item: updated });
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "NOT_FOUND") return notFound();
      if (msg === "LOCKED") return badRequest("Locked");
      return internalError("Failed to deactivate");
    }
  });

  return { PATCH, DELETE };
}

export function createSortHandler(cfg: TaxonomyConfig, sortCfg: TaxonomySortConfig) {
  return {
    POST: apiRoute(async (req: Request) => {
      const { adminId } = await adminGuard();
      const body = (await readJsonObject(req)) as any;
      const by = normBy(body?.by);
      const dir = normDir(body?.dir);
      const { ip, userAgent } = getClientMeta(req);

      try {
        const rows = await cfg.model.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
            sortOrder: true,
            _count: { select: sortCfg.countSelect },
          },
          take: 5000,
        });

        const beforeMap = Object.fromEntries(rows.map((r: any) => [r.id, r.sortOrder]));

        const cmp = (a: any, b: any) => {
          if (by === "count") {
            const d = sortCfg.getScore(a._count) - sortCfg.getScore(b._count);
            if (d !== 0) return dir === "asc" ? d : -d;
            return dir === "asc" ? alphaCmp(a.name, b.name) : -alphaCmp(a.name, b.name);
          }
          return dir === "asc" ? alphaCmp(a.name, b.name) : -alphaCmp(a.name, b.name);
        };

        const active = rows.filter((r: any) => r.isActive).sort(cmp);
        const inactive = rows.filter((r: any) => !r.isActive).sort(cmp);
        const ordered = [...active, ...inactive];
        const pairs = ordered.map((r: any, idx: number) => ({ id: r.id, sortOrder: (idx + 1) * 10 }));
        const afterMap = Object.fromEntries(pairs.map((p) => [p.id, p.sortOrder]));

        await prisma.$transaction([
          prisma.$executeRaw(bulkSortOrderUpdateSql(cfg.tableQuoted, pairs)),
          prisma.adminAuditLog.create({
            data: {
              adminId,
              action: `SORT_${by.toUpperCase()}_${dir.toUpperCase()}`,
              entity: cfg.entity,
              entityId: "BATCH",
              beforeJson: beforeMap as any,
              afterJson: afterMap as any,
              ip,
              userAgent,
            },
          }),
        ]);

        revalidateTag("taxonomy");
        return json({ ok: true, by, dir, count: ordered.length });
      } catch (e: any) {
        const msg = String(e?.message ?? "").trim();
        return internalError(msg ? `Failed to sort: ${msg}` : "Failed to sort");
      }
    }),
  };
}

export function createReorderHandler(cfg: TaxonomyConfig) {
  return {
    POST: apiRoute(async (req: Request) => {
      const { adminId } = await adminGuard();
      const body = (await readJsonObject(req)) as any;
      const ids: string[] = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)) : [];
      if (!ids.length) return badRequest("ids is required");
      const uniq = new Set(ids);
      if (uniq.size !== ids.length) return badRequest("ids must be unique");
      const { ip, userAgent } = getClientMeta(req);

      try {
        const beforeRows = await cfg.model.findMany({
          where: { id: { in: ids } },
          select: { id: true, sortOrder: true },
        });
        const beforeMap = Object.fromEntries(beforeRows.map((r: any) => [r.id, r.sortOrder]));
        const pairs = ids.map((id, idx) => ({ id, sortOrder: (idx + 1) * 10 }));
        const afterMap = Object.fromEntries(pairs.map((p) => [p.id, p.sortOrder]));

        await prisma.$transaction([
          prisma.$executeRaw(bulkSortOrderUpdateSql(cfg.tableQuoted, pairs)),
          prisma.adminAuditLog.create({
            data: {
              adminId,
              action: "REORDER",
              entity: cfg.entity,
              entityId: "BATCH",
              beforeJson: beforeMap as any,
              afterJson: afterMap as any,
              ip,
              userAgent,
            },
          }),
        ]);

        revalidateTag("taxonomy");
        return json({ ok: true, items: pairs });
      } catch (e: any) {
        const msg = String(e?.message ?? "").trim();
        return internalError(msg ? `Failed to reorder: ${msg}` : "Failed to reorder");
      }
    }),
  };
}
