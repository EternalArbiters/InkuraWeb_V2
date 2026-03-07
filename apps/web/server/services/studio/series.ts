import "server-only";

import prisma from "@/server/db/prisma";
import { ApiError } from "@/server/http";
import { requireCreatorSession } from "./session";

function cleanSeriesTitle(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizedSeriesTitle(value: unknown) {
  return cleanSeriesTitle(value).toLowerCase();
}

async function cleanupEmptySeries(db: any, seriesId: string | null | undefined) {
  if (!seriesId) return;
  const count = await db.work.count({ where: { seriesId } });
  if (count === 0) {
    await db.series.delete({ where: { id: seriesId } }).catch(() => null);
  }
}

export async function resequenceSeries(db: any, seriesId: string | null | undefined) {
  if (!seriesId) return;
  const works = await db.work.findMany({
    where: { seriesId },
    orderBy: [{ seriesOrder: "asc" }, { updatedAt: "asc" }, { createdAt: "asc" }, { title: "asc" }],
    select: { id: true, seriesOrder: true },
  });

  await Promise.all(
    works.map((work: any, index: number) => {
      const nextOrder = index + 1;
      if (work.seriesOrder === nextOrder) return null;
      return db.work.update({ where: { id: work.id }, data: { seriesOrder: nextOrder } });
    })
  );
}

export async function ensureSeriesForUser(db: any, userId: string, titleInput: unknown) {
  const title = cleanSeriesTitle(titleInput);
  if (!title) return null;

  const normalizedTitle = normalizedSeriesTitle(title);
  const existing = await db.series.findFirst({
    where: { authorId: userId, normalizedTitle },
    select: { id: true, title: true },
  });

  if (existing) {
    if (existing.title !== title) {
      await db.series.update({ where: { id: existing.id }, data: { title, normalizedTitle } });
    }
    return { id: existing.id, title };
  }

  return db.series.create({
    data: { authorId: userId, title, normalizedTitle },
    select: { id: true, title: true },
  });
}

export async function assignWorkToSeries(db: any, {
  workId,
  userId,
  seriesTitle,
  seriesOrder,
}: {
  workId: string;
  userId: string;
  seriesTitle?: unknown;
  seriesOrder?: unknown;
}) {
  const work = await db.work.findUnique({
    where: { id: workId },
    select: { id: true, authorId: true, seriesId: true, seriesOrder: true },
  });
  if (!work) throw new ApiError(404, "Work not found");
  if (work.authorId !== userId) throw new ApiError(403, "Forbidden");

  const title = cleanSeriesTitle(seriesTitle);
  const requestedOrderRaw = Number(seriesOrder);
  const requestedOrder = Number.isFinite(requestedOrderRaw) && requestedOrderRaw > 0 ? Math.floor(requestedOrderRaw) : null;

  if (!title) {
    const previousSeriesId = work.seriesId;
    await db.work.update({ where: { id: workId }, data: { seriesId: null, seriesOrder: null } });
    await resequenceSeries(db, previousSeriesId);
    await cleanupEmptySeries(db, previousSeriesId);
    return null;
  }

  const series = await ensureSeriesForUser(db, userId, title);
  const max = await db.work.aggregate({
    where: { seriesId: series.id, NOT: { id: workId } },
    _max: { seriesOrder: true },
  });
  const fallbackOrder = (max?._max?.seriesOrder ?? 0) + 1;
  const nextOrder = requestedOrder ?? fallbackOrder;

  const previousSeriesId = work.seriesId;
  await db.work.update({ where: { id: workId }, data: { seriesId: series.id, seriesOrder: nextOrder } });

  if (previousSeriesId && previousSeriesId !== series.id) {
    await resequenceSeries(db, previousSeriesId);
    await cleanupEmptySeries(db, previousSeriesId);
  }
  await resequenceSeries(db, series.id);
  return series;
}

async function assertSeriesOwner(userId: string, seriesId: string) {
  const series = await prisma.series.findUnique({ where: { id: seriesId }, select: { id: true, authorId: true } });
  if (!series) throw new ApiError(404, "Series not found");
  if (series.authorId !== userId) throw new ApiError(403, "Forbidden");
  return series;
}

async function assertWorkOwner(userId: string, workId: string) {
  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, authorId: true, seriesId: true, seriesOrder: true } });
  if (!work) throw new ApiError(404, "Work not found");
  if (work.authorId !== userId) throw new ApiError(403, "Forbidden");
  return work;
}

export async function listStudioSeries() {
  const { userId } = await requireCreatorSession();

  const [series, unassignedWorks] = await Promise.all([
    prisma.series.findMany({
      where: { authorId: userId },
      orderBy: [{ title: "asc" }],
      select: {
        id: true,
        title: true,
        works: {
          orderBy: [{ seriesOrder: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
            status: true,
            coverImage: true,
            updatedAt: true,
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
      },
    }),
  ]);

  return { series, unassignedWorks };
}

export async function createStudioSeries(req: Request) {
  const { userId } = await requireCreatorSession();
  const body = await req.json().catch(() => ({} as any));
  const title = cleanSeriesTitle(body?.title);
  if (!title) return { status: 400, body: { error: "Series title is required" } };

  const series = await prisma.$transaction((tx) => ensureSeriesForUser(tx, userId, title));
  return { status: 201, body: { ok: true, series } };
}

export async function patchStudioSeries(req: Request) {
  const { userId } = await requireCreatorSession();
  const body = await req.json().catch(() => ({} as any));
  const action = String(body?.action || "").trim();

  if (!action) return { status: 400, body: { error: "Action is required" } };

  if (action === "renameSeries") {
    const seriesId = String(body?.seriesId || "");
    const title = cleanSeriesTitle(body?.title);
    if (!seriesId || !title) return { status: 400, body: { error: "Series id and title are required" } };
    await assertSeriesOwner(userId, seriesId);
    await prisma.series.update({
      where: { id: seriesId },
      data: { title, normalizedTitle: normalizedSeriesTitle(title) },
    });
    return { status: 200, body: { ok: true } };
  }

  if (action === "addWork") {
    const seriesId = String(body?.seriesId || "");
    const workId = String(body?.workId || "");
    if (!seriesId || !workId) return { status: 400, body: { error: "Series id and work id are required" } };
    const [series, work] = await Promise.all([assertSeriesOwner(userId, seriesId), assertWorkOwner(userId, workId)]);
    const max = await prisma.work.aggregate({ where: { seriesId }, _max: { seriesOrder: true } });
    await prisma.work.update({
      where: { id: work.id },
      data: { seriesId: series.id, seriesOrder: (max._max.seriesOrder ?? 0) + 1 },
    });
    if (work.seriesId && work.seriesId !== series.id) {
      await resequenceSeries(prisma, work.seriesId);
      await cleanupEmptySeries(prisma, work.seriesId);
    }
    await resequenceSeries(prisma, series.id);
    return { status: 200, body: { ok: true } };
  }

  if (action === "removeWork") {
    const workId = String(body?.workId || "");
    if (!workId) return { status: 400, body: { error: "Work id is required" } };
    const work = await assertWorkOwner(userId, workId);
    const previousSeriesId = work.seriesId;
    await prisma.work.update({ where: { id: work.id }, data: { seriesId: null, seriesOrder: null } });
    await resequenceSeries(prisma, previousSeriesId);
    await cleanupEmptySeries(prisma, previousSeriesId);
    return { status: 200, body: { ok: true } };
  }

  if (action === "moveWork") {
    const seriesId = String(body?.seriesId || "");
    const workId = String(body?.workId || "");
    const direction = String(body?.direction || "");
    if (!seriesId || !workId || !direction) return { status: 400, body: { error: "Series id, work id, and direction are required" } };
    await assertSeriesOwner(userId, seriesId);
    const works = await prisma.work.findMany({
      where: { seriesId },
      orderBy: [{ seriesOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    const index = works.findIndex((work) => work.id === workId);
    if (index === -1) return { status: 404, body: { error: "Work not found in series" } };
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= works.length) return { status: 200, body: { ok: true } };
    const reordered = [...works];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    await Promise.all(
      reordered.map((work, idx) => prisma.work.update({ where: { id: work.id }, data: { seriesOrder: idx + 1 } }))
    );
    return { status: 200, body: { ok: true } };
  }

  if (action === "reorderWorks") {
    const seriesId = String(body?.seriesId || "");
    const orderedWorkIds = Array.isArray(body?.orderedWorkIds) ? body.orderedWorkIds.map(String) : [];
    if (!seriesId || !orderedWorkIds.length) return { status: 400, body: { error: "Series id and ordered work ids are required" } };
    await assertSeriesOwner(userId, seriesId);
    const works = await prisma.work.findMany({ where: { seriesId }, select: { id: true } });
    const workIdSet = new Set(works.map((work) => work.id));
    if (orderedWorkIds.some((id) => !workIdSet.has(id))) {
      return { status: 400, body: { error: "Invalid work list" } };
    }
    await Promise.all(
      orderedWorkIds.map((workId, index) => prisma.work.update({ where: { id: workId }, data: { seriesOrder: index + 1 } }))
    );
    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { error: "Unknown action" } };
}
