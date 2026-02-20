import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { work: { select: { type: true, authorId: true } } },
    });

    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (chapter.work.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (chapter.work.type !== "COMIC") return NextResponse.json({ error: "Only COMIC chapters have pages" }, { status: 400 });

    const fd = await req.formData();
    const files = fd.getAll("pages").filter((x) => typeof x !== "string") as File[];
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

    const last = await prisma.comicPage.findFirst({
      where: { chapterId: chapter.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const baseOrder = last?.order ?? 0;

    // NOTE: PrismaPromise is thenable. If you `await Promise.all([...prisma.create()])`,
    // you get the *resolved results* (objects) and lose the PrismaPromise[] type that
    // `$transaction([...])` expects. So we do uploads first, then pass PrismaPromise[]
    // directly to `$transaction`.
    const uploads = await Promise.all(files.map((file) => savePublicUpload(file, "pages")));
    const created = await prisma.$transaction(
      uploads.map((saved, idx) =>
        prisma.comicPage.create({
          data: { chapterId: chapter.id, order: baseOrder + idx + 1, imageUrl: saved.url },
          select: { id: true, order: true, imageUrl: true },
        })
      )
    );

    return NextResponse.json({ ok: true, pages: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
