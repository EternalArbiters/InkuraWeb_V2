import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyNewChapter } from "@/server/services/notifyNewChapter";
import { deletePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

async function getCreator(sessionUserId: string) {
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function safeJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

function safeStatus(v: unknown): "DRAFT" | "PUBLISHED" {
  const s = String(v || "").toUpperCase().trim();
  return s === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

async function recomputePublishedChapterCount(workId: string) {
  const count = await prisma.chapter.count({ where: { workId, status: "PUBLISHED" } as any });
  await prisma.work.update({ where: { id: workId }, data: { chapterCount: count } });
}

async function loadChapterForEdit(userId: string, role: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      work: { select: { id: true, title: true, type: true, authorId: true } },
      text: true,
      warningTags: true,
      pages: { orderBy: { order: "asc" } },
    },
  });

  if (!chapter) return { kind: "not_found" as const };
  if (role !== "ADMIN" && chapter.work.authorId !== userId) return { kind: "forbidden" as const };
  return { kind: "ok" as const, chapter };
}

export async function GET(_req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await loadChapterForEdit(session.user.id, me.role, chapterId);
  if (res.kind === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (res.kind === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ chapter: res.chapter });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await loadChapterForEdit(session.user.id, me.role, chapterId);
  if (owned.kind === "not_found") return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  if (owned.kind === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({} as any));

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const numberRaw = body.number;
    const number = typeof numberRaw === "number" && Number.isFinite(numberRaw) ? Math.max(1, Math.floor(numberRaw)) : undefined;
    const content = typeof body.content === "string" ? body.content : undefined;
    const authorNote = typeof body.authorNote === "string" ? body.authorNote : body.authorNote === null ? null : undefined;

    const isMature = typeof body.isMature === "boolean" ? body.isMature : undefined;
    const warningTagIds = safeJsonArray(body.warningTagIds);

    const status = typeof body.status === "string" ? safeStatus(body.status) : undefined;

    const thumbnailImage =
      typeof body.thumbnailImage === "string" ? body.thumbnailImage.trim() : body.thumbnailImage === null ? null : undefined;
    const thumbnailKey =
      typeof body.thumbnailKey === "string" ? body.thumbnailKey.trim() : body.thumbnailKey === null ? null : undefined;

    if (title !== undefined && title.length === 0) return badRequest("title cannot be empty");

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (number !== undefined) data.number = number;
    if (isMature !== undefined) data.isMature = isMature;
    if (warningTagIds) data.warningTags = { set: warningTagIds.map((id) => ({ id })) };
    if (authorNote !== undefined) data.authorNote = authorNote;

    if (thumbnailImage !== undefined) {
      data.thumbnailImage = thumbnailImage ? thumbnailImage : null;
      // If thumbnailImage cleared, also clear key.
      if (!thumbnailImage) data.thumbnailKey = null;
    }
    if (thumbnailKey !== undefined) {
      data.thumbnailKey = thumbnailKey ? thumbnailKey : null;
    }

    if (status !== undefined) {
      data.status = status;
      data.publishedAt = status === "PUBLISHED" ? owned.chapter.publishedAt || new Date() : null;
    }

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data,
      select: { id: true, title: true, number: true, status: true, workId: true },
    });

    // Best-effort delete old thumbnail if it was a dedicated upload (not a page image)
    if ((thumbnailImage !== undefined || thumbnailKey !== undefined) && (owned.chapter.thumbnailKey || owned.chapter.thumbnailImage)) {
      const oldKeyOrUrl = String(owned.chapter.thumbnailKey || owned.chapter.thumbnailImage);
      const nextKeyOrUrl = thumbnailKey ? String(thumbnailKey) : thumbnailImage ? String(thumbnailImage) : "";

      // Do not delete if unchanged
      const unchanged = !!nextKeyOrUrl && oldKeyOrUrl === nextKeyOrUrl;

      // Do not delete if the old key/url is one of the chapter pages (shared asset)
      const pageAssets = new Set(
        (owned.chapter.pages || []).map((p: any) => String(p.imageKey || p.imageUrl)).filter(Boolean)
      );

      if (!unchanged && oldKeyOrUrl && !pageAssets.has(oldKeyOrUrl)) {
        await deletePublicUpload(oldKeyOrUrl);
      }
    }

    if (owned.chapter.work.type === "NOVEL" && content !== undefined) {
      if (owned.chapter.text) {
        await prisma.chapterText.update({ where: { chapterId }, data: { content } });
      } else {
        await prisma.chapterText.create({ data: { chapterId, content } });
      }
    }

    await recomputePublishedChapterCount(updated.workId);

    // Notify favorite/bookmark readers if this PATCH just published the chapter
    const wasPublished = owned.chapter.status === "PUBLISHED";
    const nowPublished = updated.status === "PUBLISHED";
    if (!wasPublished && nowPublished) {
      await notifyNewChapter({ workId: updated.workId, chapterId: updated.id, actorId: session.user.id });
    }

    return NextResponse.json({ ok: true, chapter: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}