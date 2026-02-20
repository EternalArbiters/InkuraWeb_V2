import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

async function renumberChapterPages(chapterId: string) {
  const pages = await prisma.comicPage.findMany({
    where: { chapterId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const ids = pages.map((p) => p.id);
  if (!ids.length) return;

  await prisma.$transaction([
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: -(i + 1) } })),
    ...ids.map((id, i) => prisma.comicPage.update({ where: { id }, data: { order: i + 1 } })),
  ]);
}

async function getMe(sessionUserId: string) {
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

function isOwnerOrAdmin(role: string, userId: string, ownerId: string) {
  return role === "ADMIN" || userId === ownerId;
}

type PageMeta = { url: string; key?: string | null; order?: number | null };

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getMe(session.user.id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { work: { select: { id: true, authorId: true } } },
  });

  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwnerOrAdmin(me.role, session.user.id, chapter.work.authorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ct = req.headers.get("content-type") || "";

    let pagesMeta: PageMeta[] = [];
    let files: File[] = [];

    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      pagesMeta = Array.isArray(body?.pages)
        ? body.pages
            .map((p: any) => ({ url: String(p?.url || "").trim(), key: p?.key ? String(p.key) : null, order: p?.order ? Number(p.order) : null }))
            .filter((p: PageMeta) => !!p.url)
        : [];
    } else {
      const fd = await req.formData();
      files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];

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

    if (!files.length && !pagesMeta.length) {
      return NextResponse.json({ error: "No pages provided" }, { status: 400 });
    }

    // Upload files (fallback flow)
    if (files.length) {
      await Promise.all(
        files.map(async (file, idx) => {
          const saved = await savePublicUpload(file, "pages", {
            userId: session.user.id,
            workId: chapter.work.id,
            chapterId,
            scope: "pages",
          });
          return prisma.comicPage.create({
            data: { chapterId, order: idx + 1, imageUrl: saved.url, imageKey: saved.key },
            select: { id: true },
          });
        })
      );
    }

    // Commit already-uploaded pages
    if (pagesMeta.length) {
      const sorted = [...pagesMeta].sort((a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0));
      await prisma.comicPage.createMany({
        data: sorted.map((p, idx) => ({
          chapterId,
          order: (p.order && p.order > 0 ? p.order : idx + 1) as number,
          imageUrl: p.url,
          imageKey: p.key || null,
        })),
      });
    }

    await renumberChapterPages(chapterId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
