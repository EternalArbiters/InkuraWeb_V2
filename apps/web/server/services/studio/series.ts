import "server-only";

import type { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { ApiError } from "@/server/http";
import { slugify } from "@/lib/slugify";
import { requireCreatorSession } from "./session";

type DbClient = Prisma.TransactionClient | typeof prisma;

type StudioSeriesResponse = {
  status: number;
  body: Record<string, unknown>;
};

function cleanSeriesTitle(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseSeriesOrder(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.max(1, Math.floor(parsed));
}

function uniqueStringIds(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return Array.from(new Set(input.map((item) => String(item || "").trim()).filter(Boolean)));
}

async function cleanupEmptySeries(db: DbClient, seriesId: string | null | undefined) {
  if (!seriesId) return;
  const count = await db.work.count({ where: { seriesId } });
  if (count === 0) {
    await db.workSeries.delete({ where: { id: seriesId } }).catch(() => null);
  }
}

export async function resequenceSeries(db: DbClient, seriesId: string | null | undefined) {
  if (!seriesId) return;

  const works = await db.work.findMany({
    where: { seriesId },
    orderBy: [{ seriesOrder: "asc" }, { updatedAt: "asc" }, { createdAt: "asc" }, { title: "asc" }],
    select: { id: true, seriesOrder: true },
  });

  await Promise.all(
    works.map((work, index) => {
      const nextOrder = index + 1;
      if (work.seriesOrder === nextOrder) return null;
      await db.$executeRaw`UPDATE "Work" SET "seriesOrder" = ${nextOrder} WHERE "id" = ${work.id}`;
      return;
    })
  );
}

export async function ensureSeriesForUser(db: DbClient, userId: string, titleInput: unknown) {
  const title = cleanSeriesTitle(titleInput);
  if (!title) return null;

  const slug = slugify(title);
  const series = await db.workSeries.upsert({
    where: { ownerId_slug: { ownerId: userId, slug } },
    update: { title, slug },
    create: { ownerId: userId, title, slug },
    select: { id: true, title: true, slug: true },
  });

  return series;
}

export async function assignWorkToSeries(
  db: DbClient,
  {
    workId,
    userId,
    seriesTitle,
    seriesOrder,
  }: {
    workId: string;
    userId: string;
    seriesTitle?: unknown;
    seriesOrder?: unknown;
  }
) {
  const work = await db.work.findUnique({
    where: { id: workId },
    select: { id: true, authorId: true, seriesId: true },
  });
  if (!work) throw new ApiError(404, "Work not found");
  if (work.authorId !== userId) throw new ApiError(403, "Forbidden");

  const title = cleanSeriesTitle(seriesTitle);
  const requestedOrder = parseSeriesOrder(seriesOrder);

  if (!title) {
    const previousSeriesId = work.seriesId;
    await db.$executeRaw`UPDATE "Work" SET "seriesId" = NULL, "seriesOrder" = NULL WHERE "id" = ${workId}`;
    await resequenceSeries(db, previousSeriesId);
    await cleanupEmptySeries(db, previousSeriesId);
    return null;
  }

  const series = await ensureSeriesForUser(db, userId, title);
  if (!series) return null;

  const max = await db.work.aggregate({
    where: { seriesId: series.id, NOT: { id: workId } },
    _max: { seriesOrder: true },
  });
  const fallbackOrder = (max._max.seriesOrder ?? 0) + 1;
  const nextOrder = requestedOrder ?? fallbackOrder;

  const previousSeriesId = work.seriesId;
  await db.$executeRaw`UPDATE "Work" SET "seriesId" = ${series.id}, "seriesOrder" = ${nextOrder} WHERE "id" = ${workId}`;

  if (previousSeriesId && previousSeriesId !== series.id) {
    await resequenceSeries(db, previousSeriesId);
    await cleanupEmptySeries(db, previousSeriesId);
  }

  await resequenceSeries(db, series.id);
  return series;
}

async function assertSeriesOwner(userId: string, seriesId: string) {
  const series = await prisma.workSeries.findUnique({
    where: { id: seriesId },
    select: { id: true, ownerId: true, title: true, slug: true },
  });
  if (!series) throw new ApiError(404, "Series not found");
  if (series.ownerId !== userId) throw new ApiError(403, "Forbidden");
  return series;
}

async function assertWorkOwner(userId: string, workId: string) {
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, authorId: true, seriesId: true, seriesOrder: true },
  });
  if (!work) throw new ApiError(404, "Work not found");
  if (work.authorId !== userId) throw new ApiError(403, "Forbidden");
  return work;
}

export async function listStudioSeries() {
  const { userId } = await requireCreatorSession();

  const [series, unassignedWorks] = await Promise.all([
    prisma.workSeries.findMany({
      where: { ownerId: userId },
      orderBy: [{ title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        works: {
          where: { authorId: userId },
          orderBy: [{ seriesOrder: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
            status: true,
            coverImage: true,
            updatedAt: true,
        lastChapterPublishedAt: true,
            seriesOrder: true,
          },
        },
      },
    }),
    prisma.work.findMany({
      where: { authorId: userId, seriesId: null },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        coverImage: true,
        updatedAt: true,
        lastChapterPublishedAt: true,
      },
    }),
  ]);

  return { series, unassignedWorks };
}

export async function createStudioSeries(req: Request): Promise<StudioSeriesResponse> {
  const { userId } = await requireCreatorSession();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const title = cleanSeriesTitle(body?.title);

  if (!title) {
    return { status: 400, body: { error: "Series title is required" } };
  }

  const series = await prisma.$transaction((tx) => ensureSeriesForUser(tx, userId, title));
  return { status: 201, body: { ok: true, series } };
}

export async function patchStudioSeries(req: Request): Promise<StudioSeriesResponse> {
  const { userId } = await requireCreatorSession();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String(body?.action || "").trim();

  if (!action) {
    return { status: 400, body: { error: "Action is required" } };
  }

  if (action === "renameSeries") {
    const seriesId = String(body?.seriesId || "").trim();
    const title = cleanSeriesTitle(body?.title);
    if (!seriesId || !title) {
      return { status: 400, body: { error: "Series id and title are required" } };
    }

    const series = await assertSeriesOwner(userId, seriesId);
    const nextSlug = slugify(title);
    const collision = await prisma.workSeries.findUnique({
      where: { ownerId_slug: { ownerId: userId, slug: nextSlug } },
      select: { id: true },
    });
    if (collision && collision.id !== series.id) {
      return { status: 409, body: { error: "Another series already uses this title" } };
    }

    await prisma.workSeries.update({
      where: { id: seriesId },
      data: { title, slug: nextSlug },
    });

    return { status: 200, body: { ok: true } };
  }

  if (action === "addWork") {
    const seriesId = String(body?.seriesId || "").trim();
    const workId = String(body?.workId || "").trim();
    if (!seriesId || !workId) {
      return { status: 400, body: { error: "Series id and work id are required" } };
    }

    const [series, work] = await Promise.all([assertSeriesOwner(userId, seriesId), assertWorkOwner(userId, workId)]);
    const max = await prisma.work.aggregate({ where: { seriesId }, _max: { seriesOrder: true } });
    const newOrder = (max._max.seriesOrder ?? 0) + 1;
    await prisma.$executeRaw`UPDATE "Work" SET "seriesId" = ${series.id}, "seriesOrder" = ${newOrder} WHERE "id" = ${work.id}`;

    if (work.seriesId && work.seriesId !== series.id) {
      await resequenceSeries(prisma, work.seriesId);
      await cleanupEmptySeries(prisma, work.seriesId);
    }
    await resequenceSeries(prisma, series.id);

    return { status: 200, body: { ok: true } };
  }

  if (action === "removeWork") {
    const workId = String(body?.workId || "").trim();
    if (!workId) {
      return { status: 400, body: { error: "Work id is required" } };
    }

    const work = await assertWorkOwner(userId, workId);
    const previousSeriesId = work.seriesId;
    await prisma.$executeRaw`UPDATE "Work" SET "seriesId" = NULL, "seriesOrder" = NULL WHERE "id" = ${work.id}`;
    await resequenceSeries(prisma, previousSeriesId);
    await cleanupEmptySeries(prisma, previousSeriesId);

    return { status: 200, body: { ok: true } };
  }

  if (action === "moveWork") {
    const seriesId = String(body?.seriesId || "").trim();
    const workId = String(body?.workId || "").trim();
    const direction = String(body?.direction || "").trim();
    if (!seriesId || !workId || !direction) {
      return { status: 400, body: { error: "Series id, work id, and direction are required" } };
    }

    await assertSeriesOwner(userId, seriesId);
    const works = await prisma.work.findMany({
      where: { seriesId, authorId: userId },
      orderBy: [{ seriesOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });

    const index = works.findIndex((work) => work.id === workId);
    if (index === -1) {
      return { status: 404, body: { error: "Work not found in series" } };
    }

    const targetIndex = direction === "up" ? index - 1 : direction === "down" ? index + 1 : -1;
    if (targetIndex < 0 || targetIndex >= works.length) {
      return { status: 200, body: { ok: true } };
    }

    const reordered = [...works];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    await Promise.all(
      reordered.map((work, idx) => prisma.$executeRaw`UPDATE "Work" SET "seriesOrder" = ${idx + 1} WHERE "id" = ${work.id}`)
    );

    return { status: 200, body: { ok: true } };
  }

  if (action === "reorderWorks") {
    const seriesId = String(body?.seriesId || "").trim();
    const orderedWorkIds: string[] = uniqueStringIds(body?.orderedWorkIds);
    if (!seriesId || !orderedWorkIds.length) {
      return { status: 400, body: { error: "Series id and ordered work ids are required" } };
    }

    await assertSeriesOwner(userId, seriesId);
    const works = await prisma.work.findMany({ where: { seriesId, authorId: userId }, select: { id: true } });
    const workIdSet = new Set(works.map((work) => work.id));

    if (works.length !== orderedWorkIds.length || orderedWorkIds.some((id: string) => !workIdSet.has(id))) {
      return { status: 400, body: { error: "Invalid work list" } };
    }

    await Promise.all(
      orderedWorkIds.map((workId, index) => prisma.$executeRaw`UPDATE "Work" SET "seriesOrder" = ${index + 1} WHERE "id" = ${workId}`)
    );

    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { error: "Unknown action" } };
}
