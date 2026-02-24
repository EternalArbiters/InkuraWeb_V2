import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { makeObjectKey, presignPutObject } from "@/server/storage/r2";

export const runtime = "nodejs";

function isAllowedImageType(ct: string) {
  const c = (ct || "").toLowerCase();
  return c === "image/webp" || c === "image/png" || c === "image/jpeg";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user exists (and avoid presigning for deleted users)
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const filename = String(body?.filename || "avatar").trim() || "avatar";
  const contentType = String(body?.contentType || body?.type || "").trim() || "application/octet-stream";
  const size = Number(body?.size ?? 0);

  if (!isAllowedImageType(contentType)) {
    return NextResponse.json({ error: "Unsupported file type (use PNG/JPG/WebP)" }, { status: 400 });
  }

  // 2MB max (same as cover)
  const maxBytes = 2 * 1024 * 1024;
  if (size && size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  const key = makeObjectKey({
    userId: session.user.id,
    scope: "files",
    filename: `avatar-${filename}`,
  });
  try {
    const uploadUrl = await presignPutObject({
      key,
      contentType,
    });

    return NextResponse.json({ ok: true, uploadUrl, key: uploadUrl.key, publicUrl: uploadUrl.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "R2 is not configured" }, { status: 500 });
  }
}
