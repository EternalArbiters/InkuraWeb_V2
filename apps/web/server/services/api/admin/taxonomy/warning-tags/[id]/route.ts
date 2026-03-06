import "server-only";

import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { adminGuard, asOptionalBool, asString, getClientMeta, isUniqueViolation, safeJson, toJsonSafe } from "../../_shared";
import { revalidateTag } from "next/cache";
import { json } from "@/server/http";


const NAME_MAX = 80;
const SLUG_MAX = 100;

export const PATCH = async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const guard = await adminGuard();
  const { adminId } = guard;
  const { id } = await ctx.params;
  const body = await safeJson(req);
  const { ip, userAgent } = getClientMeta(req);

  const name = asString(body?.name).slice(0, NAME_MAX);
  const slugRaw = asString(body?.slug).slice(0, SLUG_MAX);
  const slug = slugRaw ? slugRaw : undefined;
  const isActive = asOptionalBool(body?.isActive);
  const isLocked = asOptionalBool(body?.isLocked);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.warningTag.findUnique({ where: { id } });
      if (!before) throw new Error("NOT_FOUND");
      if ((before as any).isLocked && isActive === false) throw new Error("LOCKED");

      const data: any = {};
      if (name) data.name = name;
      if (slug) data.slug = slugify(slug).slice(0, SLUG_MAX);
      if (typeof isActive === "boolean") data.isActive = isActive;
      if (typeof isLocked === "boolean") data.isLocked = isLocked;

      if (Object.keys(data).length === 0) return before;

      const after = await tx.warningTag.update({ where: { id }, data });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: typeof isActive === "boolean" ? (isActive ? "REACTIVATE" : "DEACTIVATE") : "UPDATE",
          entity: "WarningTag",
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
    const msg = String(e?.message || "");
    if (msg === "NOT_FOUND") return json({ error: "Not found" }, { status: 404 });
    if (msg === "LOCKED") return json({ error: "Locked" }, { status: 400 });
    if (isUniqueViolation(e)) return json({ error: "Slug already exists" }, { status: 409 });
    return json({ error: "Failed to update" }, { status: 500 });
  }
};
export const DELETE = async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const guard = await adminGuard();
  const { adminId } = guard;
  const { id } = await ctx.params;
  const { ip, userAgent } = getClientMeta(req);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.warningTag.findUnique({ where: { id } });
      if (!before) throw new Error("NOT_FOUND");
      if ((before as any).isLocked) throw new Error("LOCKED");
      const after = await tx.warningTag.update({ where: { id }, data: { isActive: false } });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "DEACTIVATE",
          entity: "WarningTag",
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
    const msg = String(e?.message || "");
    if (msg === "NOT_FOUND") return json({ error: "Not found" }, { status: 404 });
    if (msg === "LOCKED") return json({ error: "Locked" }, { status: 400 });
    return json({ error: "Failed to deactivate" }, { status: 500 });
  }
};
