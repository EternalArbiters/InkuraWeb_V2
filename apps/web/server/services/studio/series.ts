import "server-only";

import type { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { ApiError } from "@/server/http";
import { slugify } from "@/lib/slugify";
import { requireCreatorSession } from "./session";

const manageSeriesWorkSelect = {
  id: true,
  slug: true,
  title: true,
  coverImage: true,
  status: true,
  type: true,
  updatedAt: true,
  seriesOrder: true,
} as const;

function normalizeTitle(input: unknown) {
  return String(input || "").trim().replace(/\s+/g, " ");
}

function uniqueIds(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return Array.from(new Set(input.map((item) => String(item || "").trim()).filter(Boolean)));
}

type DbClient = Prisma.TransactionClient | typeof prisma;

async function ensureOwnedSeries(db: DbClient, seriesId: string, ownerId: string) {
  const series = await db.workSeries.findFirst({
    where: { id: seriesId, ownerId },
    select: { id: true, title: true, slug: true, ownerId: true },
  });
  if (!series) throw new ApiError(404, "Series not found");
  return series;
}

async function ensureOwnedWorks(db: DbClient, workIds: string[], ownerId: string) {
  const works = await db.work.findMany({
    where: { id: { in: workIds }, authorId: ownerId },
    select: { id: true, seriesId: true, title: true },
  });
  if (works.length !== workIds.length) {
    throw new ApiError(404, "One or more works were not found");
  }
  const order = new Map(works.map((work) => [work.id, work]));
  return workIds.map((id) => {
    const work = order.get(id);
    if (!work) throw new ApiError(404, "One or more works were not found");
    return work;
  });
}

async function normalizeSeriesOrdersTx(tx: DbClient, seriesId: string) {
  const works = await tx.work.findMany({
    where: { seriesId },
    orderBy: [{ seriesOrder: "asc" }, { updatedAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await Promise.all(
    works.map((work, index) =>
      tx.work.update({
        where: { id: work.id },
        data: { seriesOrder: index + 1 },
      }),
    ),
  );
}

async function getStudioSeriesPayload(ownerId: string) {
  const [series, ungroupedWorks] = await Promise.all([
    prisma.workSeries.findMany({
      where: { ownerId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        works: {
          where: { authorId: ownerId },
          orderBy: [{ seriesOrder: "asc" }, { updatedAt: "desc" }],
          select: manageSeriesWorkSelect,
        },
      },
    }),
    prisma.work.findMany({
      where: { authorId: ownerId, seriesId: null },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: manageSeriesWorkSelect,
    }),
  ]);

  const normalizedSeries = series.map((item) => ({
    ...item,
    works: item.works
      .slice()
      .sort((a, b) => {
        const ao = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      })
      .map((work, index) => ({
        ...work,
        seriesOrder: index + 1,
      })),
  }));

  return {
    series: normalizedSeries,
    ungroupedWorks,
  };
}

export async function listStudioSeries() {
  const { userId } = await requireCreatorSession();
  return getStudioSeriesPayload(userId);
}

export async function mutateStudioSeries(req: Request) {
  const { userId } = await requireCreatorSession();
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "").trim();

  if (!action) {
    return { status: 400, body: { error: "Action is required" } };
  }

  if (action === "createSeries") {
    const title = normalizeTitle(body?.title);
    if (!title) return { status: 400, body: { error: "Series title is required" } };

    const workIds = uniqueIds(body?.workIds);
    await prisma.$transaction(async (tx) => {
      const series = await tx.workSeries.upsert({
        where: { ownerId_slug: { ownerId: userId, slug: slugify(title) } },
        update: { title },
        create: { ownerId: userId, title, slug: slugify(title) },
        select: { id: true },
      });

      if (!workIds.length) return;

      const works = await ensureOwnedWorks(tx, workIds, userId);
      const previousSeriesIds = Array.from(new Set(works.map((work) => work.seriesId).filter((id): id is string => !!id && id !== series.id)));
      const maxSeriesOrder = await tx.work.aggregate({
        where: { seriesId: series.id },
        _max: { seriesOrder: true },
      });
      let nextOrder = (maxSeriesOrder._max.seriesOrder || 0) + 1;

      for (const workId of workIds) {
        await tx.work.update({
          where: { id: workId },
          data: {
            seriesId: series.id,
            seriesOrder: nextOrder++,
            prevArcUrl: null,
            nextArcUrl: null,
          },
        });
      }

      for (const previousSeriesId of previousSeriesIds) {
        await normalizeSeriesOrdersTx(tx, previousSeriesId);
      }
      await normalizeSeriesOrdersTx(tx, series.id);
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  if (action === "renameSeries") {
    const seriesId = String(body?.seriesId || "").trim();
    const title = normalizeTitle(body?.title);
    if (!seriesId) return { status: 400, body: { error: "Series id is required" } };
    if (!title) return { status: 400, body: { error: "Series title is required" } };

    const existing = await ensureOwnedSeries(prisma, seriesId, userId);
    const nextSlug = slugify(title);
    const collision = await prisma.workSeries.findUnique({
      where: { ownerId_slug: { ownerId: userId, slug: nextSlug } },
      select: { id: true },
    });
    if (collision && collision.id !== existing.id) {
      return { status: 409, body: { error: "Another series already uses this title" } };
    }

    await prisma.workSeries.update({
      where: { id: seriesId },
      data: { title, slug: nextSlug },
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  if (action === "reorderSeries") {
    const seriesId = String(body?.seriesId || "").trim();
    const workIds = uniqueIds(body?.workIds);
    if (!seriesId) return { status: 400, body: { error: "Series id is required" } };
    if (!workIds.length) return { status: 400, body: { error: "Work order is required" } };

    await prisma.$transaction(async (tx) => {
      await ensureOwnedSeries(tx, seriesId, userId);
      const currentWorks = await tx.work.findMany({
        where: { authorId: userId, seriesId },
        select: { id: true },
      });
      if (currentWorks.length !== workIds.length) {
        throw new ApiError(400, "The series order is incomplete");
      }
      const currentIds = new Set(currentWorks.map((work) => work.id));
      const payloadIds = new Set(workIds);
      if (currentIds.size !== payloadIds.size || workIds.some((id) => !currentIds.has(id))) {
        throw new ApiError(400, "The submitted works do not match this series");
      }

      await Promise.all(
        workIds.map((workId, index) =>
          tx.work.update({
            where: { id: workId },
            data: { seriesOrder: index + 1 },
          }),
        ),
      );
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  if (action === "attachWorks") {
    const seriesId = String(body?.seriesId || "").trim();
    const workIds = uniqueIds(body?.workIds);
    if (!seriesId) return { status: 400, body: { error: "Series id is required" } };
    if (!workIds.length) return { status: 400, body: { error: "Select at least one work" } };

    await prisma.$transaction(async (tx) => {
      const series = await ensureOwnedSeries(tx, seriesId, userId);
      const works = await ensureOwnedWorks(tx, workIds, userId);
      const previousSeriesIds = Array.from(new Set(works.map((work) => work.seriesId).filter((id): id is string => !!id && id !== series.id)));
      const maxSeriesOrder = await tx.work.aggregate({
        where: { seriesId },
        _max: { seriesOrder: true },
      });
      let nextOrder = (maxSeriesOrder._max.seriesOrder || 0) + 1;

      for (const workId of workIds) {
        await tx.work.update({
          where: { id: workId },
          data: {
            seriesId,
            seriesOrder: nextOrder++,
            prevArcUrl: null,
            nextArcUrl: null,
          },
        });
      }

      for (const previousSeriesId of previousSeriesIds) {
        await normalizeSeriesOrdersTx(tx, previousSeriesId);
      }
      await normalizeSeriesOrdersTx(tx, series.id);
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  if (action === "detachWork") {
    const seriesId = String(body?.seriesId || "").trim();
    const workId = String(body?.workId || "").trim();
    if (!seriesId) return { status: 400, body: { error: "Series id is required" } };
    if (!workId) return { status: 400, body: { error: "Work id is required" } };

    await prisma.$transaction(async (tx) => {
      await ensureOwnedSeries(tx, seriesId, userId);
      const work = await tx.work.findFirst({
        where: { id: workId, authorId: userId },
        select: { id: true, seriesId: true },
      });
      if (!work) throw new ApiError(404, "Work not found");
      if (work.seriesId !== seriesId) throw new ApiError(400, "That work does not belong to this series");

      await tx.work.update({
        where: { id: workId },
        data: {
          seriesId: null,
          seriesOrder: null,
        },
      });

      await normalizeSeriesOrdersTx(tx, seriesId);
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  if (action === "deleteSeries") {
    const seriesId = String(body?.seriesId || "").trim();
    if (!seriesId) return { status: 400, body: { error: "Series id is required" } };

    await prisma.$transaction(async (tx) => {
      await ensureOwnedSeries(tx, seriesId, userId);
      await tx.work.updateMany({
        where: { authorId: userId, seriesId },
        data: { seriesId: null, seriesOrder: null },
      });
      await tx.workSeries.delete({ where: { id: seriesId } });
    });

    return { status: 200, body: { ok: true, ...(await getStudioSeriesPayload(userId)) } };
  }

  return { status: 400, body: { error: "Unknown action" } };
}
