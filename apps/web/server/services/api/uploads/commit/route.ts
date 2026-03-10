import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { logWarn } from "@/server/observability/logger";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { headObject, publicUrlForKey } from "@/server/storage/r2";
import { isAllowedUploadContentType, maxBytesForUploadScope, normalizeSha256, normalizeUploadScope } from "@/server/uploads/presignRules";
import { buildUploadGuardrailMeta, readUploadOptimizationMeta, validateUploadOptimizationMeta } from "@/server/uploads/imageValidation";

export const runtime = "nodejs";
type Scope = "comment_images" | "comment_gifs";

function keyMatches(scope: Scope, sha256: string, key: string) {
  const k = String(key || "").replace(/^\//, "");
  if (scope === "comment_gifs") return k === `media/comment/gif/${sha256}.gif`;
  return k.startsWith(`media/comment/image/${sha256}.`);
}

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "upload.commit", userId: session.user.id });
  if (limited) return limited;

  const body = await req.json().catch(() => ({} as any));
  const scope = normalizeUploadScope(body?.scope) as Scope;
  const sha256 = normalizeSha256(body?.sha256 ?? body?.hash);
  const key = String(body?.key || "").trim().replace(/^\//, "");
  const contentType = String(body?.contentType || "").trim();
  const sizeBytes = Number(body?.sizeBytes ?? body?.size ?? 0);
  const optimizationMeta = readUploadOptimizationMeta(body?.optimization ?? body?.uploadOptimization ?? body?.meta);

  if (scope !== "comment_images" && scope !== "comment_gifs") return json({ error: "Invalid scope" }, { status: 400 });
  if (!sha256) return json({ error: "sha256 is required" }, { status: 400 });
  if (!key) return json({ error: "key is required" }, { status: 400 });
  if (!keyMatches(scope, sha256, key)) return json({ error: "key does not match sha256" }, { status: 400 });
  if (contentType && !isAllowedUploadContentType(scope, contentType)) return json({ error: "Unsupported file type" }, { status: 400 });
  const maxBytes = maxBytesForUploadScope(scope);
  if (sizeBytes && sizeBytes > maxBytes) return json({ error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });

  let validation;
  try {
    validation = validateUploadOptimizationMeta({ scope, contentType, sizeBytes, meta: optimizationMeta });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid upload optimization metadata" }, { status: 400 });
  }
  if (validation.warnings.length) logWarn("upload.commit_guardrail_warning", { userId: session.user.id, sha256, key, ...buildUploadGuardrailMeta({ scope, contentType, sizeBytes, validation }) });

  const head = await headObject(key);
  if (!head.exists) return json({ error: "Object not found in storage" }, { status: 404 });
  if (sizeBytes && head.contentLength && head.contentLength !== sizeBytes) logWarn("upload.commit_size_mismatch", { userId: session.user.id, sha256, key, claimedSizeBytes: sizeBytes, storedSizeBytes: head.contentLength });
  if (contentType && head.contentType && head.contentType !== contentType) logWarn("upload.commit_content_type_mismatch", { userId: session.user.id, sha256, key, claimedContentType: contentType, storedContentType: head.contentType });

  const url = publicUrlForKey(key);
  const type = scope === "comment_gifs" ? "COMMENT_GIF" : "COMMENT_IMAGE";
  const media = await prisma.mediaObject.upsert({
    where: { sha256 },
    create: { sha256, type, contentType: contentType || head.contentType || (scope === "comment_gifs" ? "image/gif" : "application/octet-stream"), sizeBytes: sizeBytes || head.contentLength || 0, key, url },
    update: { type, contentType: contentType || head.contentType || undefined, sizeBytes: sizeBytes || head.contentLength || undefined, key, url },
    select: { id: true, sha256: true, type: true, contentType: true, sizeBytes: true, key: true, url: true },
  });
  return json({ ok: true, media });
});
