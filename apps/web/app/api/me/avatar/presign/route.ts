import prisma from "@/server/db/prisma";
import { makeObjectKey, presignPutObject } from "@/server/storage/r2";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

function isAllowedImageType(ct: string) {
  const c = (ct || "").toLowerCase();
  return c === "image/webp" || c === "image/png" || c === "image/jpeg";
}

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user exists (and avoid presigning for deleted users)
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

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
    return json({ error: "Unsupported file type (use PNG/JPG/WebP)" }, { status: 400 });
  }

  // 2MB max (same as cover)
  const maxBytes = 2 * 1024 * 1024;
  if (size && size > maxBytes) {
    return json({ error: "File too large (max 2MB)" }, { status: 400 });
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

    return json({ ok: true, uploadUrl, key: uploadUrl.key, publicUrl: uploadUrl.publicUrl });
  } catch (e: any) {
    return json({ error: e?.message || "R2 is not configured" }, { status: 500 });
  }
});
