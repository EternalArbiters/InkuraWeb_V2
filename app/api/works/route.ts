import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const db = prisma as any;

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const type = url.searchParams.get("type"); // NOVEL|COMIC|FILM

  const adult = Boolean((session as any)?.user?.adultConfirmed);

  const works = await db.work.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(adult ? {} : { nsfw: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      creator: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ works, adultConfirmed: adult });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const type = String(form.get("type") || "NOVEL").toUpperCase();
  const genres = String(form.get("genres") || "").trim();
  const nsfw = String(form.get("nsfw") || "false") === "true";
  const postingRole = String(form.get("postingRole") || "AUTHOR").toUpperCase();

  if (!title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Deskripsi wajib diisi" }, { status: 400 });

  const cover = form.get("cover");
  let coverDataUrl: string | null = null;
  let coverMime: string | null = null;

  if (cover && typeof cover !== "string") {
    const file = cover as File;
    const MAX = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX) {
      return NextResponse.json({ error: "Cover maksimal 2MB" }, { status: 400 });
    }

    if (file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      coverMime = file.type || "image/jpeg";
      coverDataUrl = `data:${coverMime};base64,${buf.toString("base64")}`;
    }
  }

  const work = await db.work.create({
    data: {
      title,
      description,
      type: type as any,
      genres,
      nsfw,
      postingRole: postingRole as any,
      coverDataUrl,
      coverMime,
      creatorId: userId,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, work });
}
