import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { slugify } from "@/lib/slugify";
import { adminGuard, asOptionalBool, asString, getClientMeta, isUniqueViolation, parseSearchParams, safeJson, toJsonSafe } from "../_shared";
import { revalidateTag } from "next/cache";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

const NAME_MAX = 80;
const SLUG_MAX = 100;

export const GET = apiRoute(async (req: Request) => {
  const guard = await adminGuard();

  const { q, includeInactive } = parseSearchParams(req.url);
  const where: any = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const items = await prisma.deviantLoveTag.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 800,
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

export const POST = apiRoute(async (req: Request) => {
  const guard = await adminGuard();
  const { adminId } = guard;

  const body = await safeJson(req);
  const name = asString(body?.name).slice(0, NAME_MAX);
  if (!name) return json({ error: "Name is required" }, { status: 400 });

  const slugRaw = asString(body?.slug).slice(0, SLUG_MAX);
  const slug = (slugRaw || slugify(name)).slice(0, SLUG_MAX);
  if (!slug) return json({ error: "Slug is required" }, { status: 400 });

  const isLocked = asOptionalBool(body?.isLocked) ?? false;
  const isActive = asOptionalBool(body?.isActive) ?? true;
  const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;
  const { ip, userAgent } = getClientMeta(req);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.deviantLoveTag.create({
        data: {
          name,
          slug,
          isSystem: false,
          isLocked,
          isActive,
          sortOrder,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "CREATE",
          entity: "DeviantLoveTag",
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
    if (isUniqueViolation(e)) return json({ error: "Slug already exists" }, { status: 409 });
    return json({ error: "Failed to create" }, { status: 500 });
  }
});
