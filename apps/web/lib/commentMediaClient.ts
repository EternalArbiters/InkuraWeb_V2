import "client-only";

import { sendUploadMetric } from "@/lib/clientMetrics";
import { buildOptimizationMeta } from "@/lib/r2UploadClient";
import { prepareUploadFile, type PreparedUploadFile } from "@/lib/uploadOptimization";

// v16: client helpers for comment media (image/gif) with SHA-256 de-dup.

export type CommentMediaKind = "gif" | "image";

export type PresignCommentMediaResponse =
  | {
      ok: true;
      exists: true;
      sha256: string;
      key: string;
      publicUrl: string;
    }
  | {
      ok: true;
      exists: false;
      sha256: string;
      uploadUrl: string;
      key: string;
      publicUrl: string;
    };

export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export async function presignCommentMedia(params: {
  file: File;
  kind: CommentMediaKind;
  sha256?: string;
  optimizationMeta?: ReturnType<typeof buildOptimizationMeta>;
}): Promise<PresignCommentMediaResponse> {
  const sha256 = params.sha256 || (await sha256Hex(params.file));
  const scope = params.kind === "gif" ? "comment_gifs" : "comment_images";

  const res = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      filename: params.file.name,
      contentType: params.file.type,
      size: params.file.size,
      sha256,
      optimization: params.optimizationMeta,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to presign comment media");
  return json as PresignCommentMediaResponse;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob) {
  const headers = file.type ? { "Content-Type": file.type } : undefined;
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!res.ok) throw new Error("Upload failed");
}

export type CommitMediaResponse = {
  ok: true;
  media: {
    id: string;
    sha256: string;
    type: "COMMENT_IMAGE" | "COMMENT_GIF";
    contentType: string;
    sizeBytes: number;
    key: string;
    url: string;
  };
};

export async function commitCommentMedia(params: {
  kind: CommentMediaKind;
  sha256: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  optimizationMeta?: ReturnType<typeof buildOptimizationMeta>;
}): Promise<CommitMediaResponse> {
  const scope = params.kind === "gif" ? "comment_gifs" : "comment_images";
  const res = await fetch("/api/uploads/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      sha256: params.sha256,
      key: params.key,
      contentType: params.contentType,
      sizeBytes: params.sizeBytes,
      optimization: params.optimizationMeta,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to commit media");
  return json as CommitMediaResponse;
}

// One-call helper:
// - compute SHA-256
// - presign (dedupe-aware)
// - upload if needed
// - commit to DB (dedupe-safe)
export async function ensureCommentMedia(params: { file: File; kind: CommentMediaKind }) {
  const startedAt = Date.now();
  let uploadMs = 0;
  let prepared: PreparedUploadFile | null = null;
  const scope = params.kind === "gif" ? "comment_gifs" : "comment_images";

  try {
    prepared =
      params.kind === "gif"
        ? {
            originalFile: params.file,
            file: params.file,
            originalBytes: params.file.size,
            optimizedBytes: params.file.size,
            width: null,
            height: null,
            contentType: params.file.type || "image/gif",
            originalContentType: params.file.type || "image/gif",
            compressionApplied: false,
            reason: "scope-disabled",
          }
        : await prepareUploadFile({ scope: "comment_images", file: params.file });

    const uploadFile = prepared.file;
    const sha256 = await sha256Hex(uploadFile);
    const optimizationVersion = params.kind === "gif" ? undefined : "pr5-upload-guardrails-v1";
    const optimizationMeta = buildOptimizationMeta(prepared, optimizationVersion);
    const presigned = await presignCommentMedia({ file: uploadFile, kind: params.kind, sha256, optimizationMeta });

    if (!presigned.exists) {
      const uploadStartedAt = Date.now();
      await uploadToPresignedUrl(presigned.uploadUrl, uploadFile);
      uploadMs = Date.now() - uploadStartedAt;
    }

    const committed = await commitCommentMedia({
      kind: params.kind,
      sha256,
      key: presigned.key,
      contentType: uploadFile.type,
      sizeBytes: uploadFile.size,
      optimizationMeta,
    });

    sendUploadMetric({
      scope,
      beforeBytes: prepared.originalBytes,
      afterBytes: prepared.optimizedBytes,
      durationMs: Date.now() - startedAt,
      uploadMs,
      contentType: uploadFile.type,
      originalContentType: prepared.originalContentType,
      optimizedContentType: prepared.contentType,
      bytesSaved: Math.max(0, prepared.originalBytes - prepared.optimizedBytes),
      compressionRatio: prepared.originalBytes > 0 ? Number((prepared.optimizedBytes / prepared.originalBytes).toFixed(4)) : undefined,
      optimizationScope: scope,
      optimizationVersion: optimizationVersion || "pr2-client-image-opt-v1",
      optimizationReason: prepared.reason,
      width: prepared.width,
      height: prepared.height,
      fallbackUsed: !optimizationMeta,
      compressionApplied: prepared.compressionApplied,
      outcome: "success",
    });

    return committed.media;
  } catch (error) {
    sendUploadMetric({
      scope,
      beforeBytes: prepared?.originalBytes ?? params.file.size,
      afterBytes: prepared?.optimizedBytes ?? params.file.size,
      durationMs: Date.now() - startedAt,
      uploadMs,
      contentType: prepared?.contentType || params.file.type,
      originalContentType: prepared?.originalContentType || params.file.type,
      optimizedContentType: prepared?.contentType || params.file.type,
      bytesSaved: prepared ? Math.max(0, prepared.originalBytes - prepared.optimizedBytes) : 0,
      compressionRatio:
        prepared && prepared.originalBytes > 0 ? Number((prepared.optimizedBytes / prepared.originalBytes).toFixed(4)) : undefined,
      optimizationScope: scope,
      optimizationVersion: params.kind === "gif" ? undefined : "pr5-upload-guardrails-v1",
      optimizationReason: prepared?.reason,
      width: prepared?.width,
      height: prepared?.height,
      fallbackUsed: prepared ? !buildOptimizationMeta(prepared, params.kind === "gif" ? undefined : "pr5-upload-guardrails-v1") : true,
      compressionApplied: prepared?.compressionApplied ?? false,
      outcome: "error",
      errorMessage: error instanceof Error ? error.message : String(error || "Upload failed"),
    });
    throw error;
  }
}
