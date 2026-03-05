import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";
import { headObject, publicUrlForKey } from "@/server/storage/r2";

export const runtime = "nodejs";

type Scope = "comment_images" | "comment_gifs";

function safeScope(v: unknown): Scope | null {
  const s = String(v || "").toLowerCase().replace(/\s+/g, "");
  if (s === "comment_images" || s === "commentimages" || s === "comment-image" || s === "comment-images") return "comment_images";
  if (s === "comment_gifs" || s === "commentgifs" || s === "comment-gif" || s === "comment-gifs") return "comment_gifs";
  return null;
}

function normalizeSha256(v: unknown): string | null {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-f0-9]{64}$/.test(s)) return null;
  return s;
}

function maxBytesForScope(scope: Scope) {
  if (scope === "comment_images") return 2 * 1024 * 1024;
  return 5 * 1024 * 1024; // gif max 5MB
}

function keyMatches(scope: Scope, sha256: string, key: string) {
  const k = String(key || "").replace(/^\//, "");
  if (scope === "comment_gifs") return k === `media/comment/gif/${sha256}.gif`;
  // image: allow common extensions
  return k.startsWith(`media/comment/image/${sha256}.`);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const scope = safeScope(body?.scope);
  const sha256 = normalizeSha256(body?.sha256 ?? body?.hash);
  const key = String(body?.key || "").trim().replace(/^\//, "");
  const contentType = String(body?.contentType || "").trim();
  const sizeBytes = Number(body?.sizeBytes ?? body?.size ?? 0);

  if (!scope) return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  if (!sha256) return NextResponse.json({ error: "sha256 is required" }, { status: 400 });
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  if (!keyMatches(scope, sha256, key)) return NextResponse.json({ error: "key does not match sha256" }, { status: 400 });

  const maxBytes = maxBytesForScope(scope);
  if (sizeBytes && sizeBytes > maxBytes) {
    return NextResponse.json({ error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });
  }

  // Verify object exists in R2
  const head = await headObject(key);
  if (!head.exists) return NextResponse.json({ error: "Object not found in storage" }, { status: 404 });
  if (sizeBytes && head.contentLength && head.contentLength !== sizeBytes) {
    // Not fatal, but helps catch mismatch.
    // If you want strict, change to 400.
  }

  const url = publicUrlForKey(key);
  const type = scope === "comment_gifs" ? "COMMENT_GIF" : "COMMENT_IMAGE";

  const media = await prisma.mediaObject.upsert({
    where: { sha256 },
    create: {
      sha256,
      type,
      contentType: contentType || head.contentType || (scope === "comment_gifs" ? "image/gif" : "application/octet-stream"),
      sizeBytes: sizeBytes || head.contentLength || 0,
      key,
      url,
    },
    update: {
      // keep newest info (in case first insert happened without size/type)
      type,
      contentType: contentType || head.contentType || undefined,
      sizeBytes: sizeBytes || head.contentLength || undefined,
      key,
      url,
    },
    select: { id: true, sha256: true, type: true, contentType: true, sizeBytes: true, key: true, url: true },
  });

  return NextResponse.json({ ok: true, media });
}
