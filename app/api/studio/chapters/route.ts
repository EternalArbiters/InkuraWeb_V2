import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

function safeJsonArray(v: unknown): string[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

function safeBool(v: unknown) {
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fd = await req.formData();

    const workId = String(fd.get("workId") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const numberRaw = String(fd.get("number") || "").trim();
    const number = Math.max(1, parseInt(numberRaw || "1", 10) || 1);

    const status = safeStatus(fd.get("status"));
    const isMature = safeBool(fd.get("isMature"));
    const warningTagIds = safeJsonArray(fd.get("warningTagIds"));

    if (!workId) return NextResponse.json({ error: "workId is required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true, type: true, authorId: true },
    });

    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });
    if (work.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const content = String(fd.get("content") || "");
    const files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];

    if (work.type === "NOVEL" && !content.trim()) {
      return NextResponse.json({ error: "content is required for NOVEL" }, { status: 400 });
    }
    if (work.type === "COMIC" && files.length === 0) {
      return NextResponse.json({ error: "pages are required for COMIC" }, { status: 400 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        workId,
        title,
        number,
        status: status as any,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        ...(isMature ? { isMature: true } : {}),
        ...(warningTagIds.length
          ? { warningTags: { connect: warningTagIds.map((id) => ({ id })) } }
          : {}),
        ...(work.type === "NOVEL"
          ? {
              text: {
                create: { content },
              },
            }
          : {
              pages: {
                create: await Promise.all(
                  files.map(async (file, idx) => {
                    const saved = await savePublicUpload(file, "pages");
                    return { order: idx + 1, imageUrl: saved.url };
                  })
                ),
              },
            }),
      },
      select: { id: true, workId: true, number: true, title: true, status: true },
    });

    await recomputePublishedChapterCount(workId);

    return NextResponse.json({ ok: true, chapter }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
