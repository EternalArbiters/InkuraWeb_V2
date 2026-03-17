import "client-only";

import { sendUploadMetric } from "@/lib/clientMetrics";
import type { PreparedUploadFile } from "@/lib/uploadOptimization";

export type UploadOptimizationMetaPayload = {
  optimizationVersion?: string;
  originalBytes?: number;
  optimizedBytes?: number;
  originalContentType?: string;
  optimizedContentType?: string;
  width?: number | null;
  height?: number | null;
  compressionApplied?: boolean;
  reason?: string;
};

// Client-side helpers for Cloudflare R2 presigned uploads.

export type PresignResponse = {
  ok: true;
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

export async function presignUpload(params: {
  scope: "covers" | "pages" | "files" | "admin_report_attachments";
  filename: string;
  contentType?: string;
  size?: number; // bytes (for server-side guardrails)
  workId?: string;
  chapterId?: string;
  optimizationMeta?: UploadOptimizationMetaPayload;
}): Promise<PresignResponse> {
  const res = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: params.scope,
      filename: params.filename,
      contentType: params.contentType,
      size: params.size,
      workId: params.workId,
      chapterId: params.chapterId,
      optimization: params.optimizationMeta,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error || "Failed to presign upload");
  return json as PresignResponse;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob) {
  const headers = file.type ? { "Content-Type": file.type } : undefined;
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
}

export function buildOptimizationMeta(prepared: PreparedUploadFile | undefined, optimizationVersion?: string): UploadOptimizationMetaPayload | undefined {
  if (!prepared) return undefined;
  if (
    prepared.reason === "browser-unsupported" ||
    prepared.reason === "optimization-failed" ||
    prepared.reason === "scope-disabled" ||
    prepared.reason === "not-image" ||
    prepared.width == null ||
    prepared.height == null
  ) {
    return undefined;
  }
  return {
    optimizationVersion,
    originalBytes: prepared.originalBytes,
    optimizedBytes: prepared.optimizedBytes,
    originalContentType: prepared.originalContentType,
    optimizedContentType: prepared.contentType,
    width: prepared.width,
    height: prepared.height,
    compressionApplied: prepared.compressionApplied,
    reason: prepared.reason,
  };
}

export async function presignAndUpload(params: {
  scope: "covers" | "pages" | "files" | "admin_report_attachments";
  file: File;
  preparedFile?: PreparedUploadFile;
  workId?: string;
  chapterId?: string;
  optimizationVersion?: string;
}) {
  const startedAt = Date.now();
  let presignMs = 0;
  let uploadMs = 0;

  const prepared = params.preparedFile;
  const uploadFile = prepared?.file ?? params.file;
  const originalBytes = prepared?.originalBytes ?? params.file.size;
  const optimizedBytes = prepared?.optimizedBytes ?? uploadFile.size;
  const originalContentType = prepared?.originalContentType ?? params.file.type;
  const optimizedContentType = prepared?.contentType ?? uploadFile.type;
  const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
  const compressionRatio = originalBytes > 0 ? Number((optimizedBytes / originalBytes).toFixed(4)) : undefined;
  const compressionApplied = prepared?.compressionApplied ?? false;
  const optimizationMeta = buildOptimizationMeta(prepared, params.optimizationVersion);

  try {
    const presignStartedAt = Date.now();
    const signed = await presignUpload({
      scope: params.scope,
      filename: uploadFile.name,
      contentType: uploadFile.type,
      size: uploadFile.size,
      workId: params.workId,
      chapterId: params.chapterId,
      optimizationMeta,
    });
    presignMs = Date.now() - presignStartedAt;

    const uploadStartedAt = Date.now();
    await uploadToPresignedUrl(signed.uploadUrl, uploadFile);
    uploadMs = Date.now() - uploadStartedAt;

    sendUploadMetric({
      scope: params.scope,
      beforeBytes: originalBytes,
      afterBytes: optimizedBytes,
      durationMs: Date.now() - startedAt,
      presignMs,
      uploadMs,
      contentType: optimizedContentType,
      originalContentType,
      optimizedContentType,
      bytesSaved,
      compressionRatio,
      optimizationScope: params.scope,
      optimizationVersion: params.optimizationVersion,
      optimizationReason: prepared?.reason,
      width: prepared?.width,
      height: prepared?.height,
      fallbackUsed: !optimizationMeta,
      compressionApplied,
      outcome: "success",
    });

    return { url: signed.publicUrl, key: signed.key };
  } catch (error) {
    sendUploadMetric({
      scope: params.scope,
      beforeBytes: originalBytes,
      afterBytes: optimizedBytes,
      durationMs: Date.now() - startedAt,
      presignMs,
      uploadMs,
      contentType: optimizedContentType,
      originalContentType,
      optimizedContentType,
      bytesSaved,
      compressionRatio,
      optimizationScope: params.scope,
      optimizationVersion: params.optimizationVersion,
      optimizationReason: prepared?.reason,
      width: prepared?.width,
      height: prepared?.height,
      fallbackUsed: !optimizationMeta,
      compressionApplied,
      outcome: "error",
      errorMessage: error instanceof Error ? error.message : String(error || "Upload failed"),
    });
    throw error;
  }
}
