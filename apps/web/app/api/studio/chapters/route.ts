import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

async function getCreator(sessionUserId: string) {
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });
}

function safeJsonArray(v: unknown): string[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

function safeBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "1" || s === "true" || s === "yes" || s === "on";
  }
  return false;
}

function safeStatus(v: unknown): "DRAFT" | "PUBLISHED" {
  const s = String(v || "").toUpperCase().trim();
  return s === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

async function recomputePublishedChapterCount(workId: string) {
  const count = await prisma.chapter.count({ where: { workId, status: "PUBLISHED" } as any });
  await prisma.work.update({ where: { id: workId }, data: { chapterCount: count } });
}

async function canEditWork(userId: string, role: string, workId: string) {
  if (role === "ADMIN") return true;
  const w = await prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } });
  if (!w) return false;
  return w.authorId === userId;
}

type PageMeta = { url: string; key?: string | null; order?: number | null };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getCreator(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ct = req.headers.get("content-type") || "";

    let workId = "";
    let title = "";
    let number = 1;
    let status: "DRAFT" | "PUBLISHED" = "DRAFT";
    let isMature = false;
    let warningTagIds: string[] = [];
    let content = "";

    let files: File[] = [];
    let pagesMeta: PageMeta[] = [];

    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      workId = String(body?.workId || "").trim();
      title = String(body?.title || "").trim();
      number = Math.max(1, parseInt(String(body?.number || "1"), 10) || 1);
      status = safeStatus(body?.status);
      isMature = safeBool(body?.isMature);
      warningTagIds = Array.isArray(body?.warningTagIds) ? body.warningTagIds.map(String) : [];
      content = String(body?.content || "");
      pagesMeta = Array.isArray(body?.pages)
        ? body.pages
            .map((p: any) => ({ url: String(p?.url || "").trim(), key: p?.key ? String(p.key) : null, order: p?.order ? Number(p.order) : null }))
            .filter((p: PageMeta) => !!p.url)
        : [];
    } else {
      const fd = await req.formData();
      workId = String(fd.get("workId") || "").trim();
      title = String(fd.get("title") || "").trim();
      const numberRaw = String(fd.get("number") || "").trim();
      number = Math.max(1, parseInt(numberRaw || "1", 10) || 1);
      status = safeStatus(fd.get("status"));
      isMature = safeBool(fd.get("isMature"));
      warningTagIds = safeJsonArray(fd.get("warningTagIds"));
      content = String(fd.get("content") || "");
      files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];

      // optional: commit pages meta (if client uploaded via presign)
      const pagesJson = String(fd.get("pages") || "").trim();
      if (pagesJson) {
        try {
          const parsed = JSON.parse(pagesJson);
          if (Array.isArray(parsed)) {
            pagesMeta = parsed
              .map((p: any) => ({ url: String(p?.url || "").trim(), key: p?.key ? String(p.key) : null, order: p?.order ? Number(p.order) : null }))
              .filter((p: PageMeta) => !!p.url);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!workId) return NextResponse.json({ error: "workId is required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const ok = await canEditWork(session.user.id, me.role, workId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, type: true } });
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    if (work.type === "NOVEL" && !content.trim()) {
      return NextResponse.json({ error: "content is required for NOVEL" }, { status: 400 });
    }

    // Create chapter first (so we have chapterId for R2 key prefixes)
    const chapter = await prisma.chapter.create({
      data: {
        workId,
        title,
        number,
        status: status as any,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        ...(isMature ? { isMature: true } : {}),
        ...(warningTagIds.length ? { warningTags: { connect: warningTagIds.map((id) => ({ id })) } } : {}),
        ...(work.type === "NOVEL"
          ? {
              text: { create: { content } },
            }
          : {}),
      },
      select: { id: true, workId: true, number: true, title: true, status: true },
    });

    if (work.type === "COMIC") {
      // If old flow still sends files in the same request, upload them to R2 now.
      if (files.length) {
        const created = await Promise.all(
          files.map(async (file, idx) => {
            const saved = await savePublicUpload(file, "pages", {
              userId: session.user.id,
              workId,
              chapterId: chapter.id,
              scope: "pages",
            });
            return prisma.comicPage.create({
              data: { chapterId: chapter.id, order: idx + 1, imageUrl: saved.url, imageKey: saved.key },
              select: { id: true },
            });
          })
        );
        void created;
      }

      // If presign flow sends URLs/keys, just commit.
      if (pagesMeta.length) {
        // sort by order if provided, else keep array order
        const sorted = [...pagesMeta].sort((a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0));
        await prisma.comicPage.createMany({
          data: sorted.map((p, idx) => ({
            chapterId: chapter.id,
            order: (p.order && p.order > 0 ? p.order : idx + 1) as number,
            imageUrl: p.url,
            imageKey: p.key || null,
          })),
        });
      }
    }

    await recomputePublishedChapterCount(workId);

    return NextResponse.json({ ok: true, chapter }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
