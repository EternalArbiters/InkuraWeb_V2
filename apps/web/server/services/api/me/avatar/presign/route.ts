import "server-only";

import { isAllowedUploadContentTypeForScope, maxBytesForOptimizationScope } from "@/lib/uploadProfiles";
import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { logWarn } from "@/server/observability/logger";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { makeObjectKey, presignPutObject } from "@/server/storage/r2";
import { buildUploadGuardrailMeta, readUploadOptimizationMeta, validateUploadOptimizationMeta } from "@/server/uploads/imageValidation";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "upload.avatar.presign", userId: session.user.id });
  if (limited) return limited;

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as { filename?: unknown; contentType?: unknown; type?: unknown; size?: unknown; optimization?: unknown; uploadOptimization?: unknown; meta?: unknown; } | null;
  const filename = String(body?.filename || "avatar").trim() || "avatar";
  const contentType = String(body?.contentType || body?.type || "").trim() || "application/octet-stream";
  const size = Number(body?.size ?? 0);
  const optimizationMeta = readUploadOptimizationMeta(body?.optimization ?? body?.uploadOptimization ?? body?.meta);

  if (!isAllowedUploadContentTypeForScope("avatar", contentType)) return json({ error: "Unsupported file type (use PNG/JPG/WebP)" }, { status: 400 });
  const maxBytes = maxBytesForOptimizationScope("avatar");
  if (size && size > maxBytes) return json({ error: "File too large (max 2MB)" }, { status: 400 });

  let validation;
  try { validation = validateUploadOptimizationMeta({ scope: "avatar", contentType, sizeBytes: size, meta: optimizationMeta }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid avatar optimization metadata" }, { status: 400 }); }
  if (validation.warnings.length) logWarn("upload.avatar_presign_guardrail_warning", { userId: session.user.id, ...buildUploadGuardrailMeta({ scope: "avatar", contentType, sizeBytes: size, validation }) });

  const key = makeObjectKey({ userId: session.user.id, scope: "files", filename: `avatar-${filename}` });
  try {
    const signed = await presignPutObject({ key, contentType });
    return json({ ok: true, uploadUrl: signed.uploadUrl, key: signed.key, publicUrl: signed.publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error && error.message ? error.message : "R2 is not configured";
    return json({ error: message }, { status: 500 });
  }
});
