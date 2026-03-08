import "client-only";

import { sendUploadMetric } from "@/lib/clientMetrics";

// Client-side helpers for Cloudflare R2 presigned uploads.

export type PresignResponse = {
  ok: true;
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

export async function presignUpload(params: {
  scope: "covers" | "pages" | "files";
  filename: string;
  contentType?: string;
  size?: number; // bytes (for server-side guardrails)
  workId?: string;
  chapterId?: string;
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
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to presign upload");
  return json as PresignResponse;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    // NOTE: Some S3-compatible signed URLs require Content-Type. R2 generally tolerates it, but we leave it to the presign step.
  });
  if (!res.ok) throw new Error("Upload failed");
}

export async function presignAndUpload(params: {
  scope: "covers" | "pages" | "files";
  file: File;
  workId?: string;
  chapterId?: string;
}) {
  const startedAt = Date.now();
  let presignMs = 0;
  let uploadMs = 0;

  try {
    const presignStartedAt = Date.now();
    const signed = await presignUpload({
      scope: params.scope,
      filename: params.file.name,
      contentType: params.file.type,
      size: params.file.size,
      workId: params.workId,
      chapterId: params.chapterId,
    });
    presignMs = Date.now() - presignStartedAt;

    const uploadStartedAt = Date.now();
    await uploadToPresignedUrl(signed.uploadUrl, params.file);
    uploadMs = Date.now() - uploadStartedAt;

    sendUploadMetric({
      scope: params.scope,
      beforeBytes: params.file.size,
      afterBytes: params.file.size,
      durationMs: Date.now() - startedAt,
      presignMs,
      uploadMs,
      contentType: params.file.type,
      compressionApplied: false,
      outcome: "success",
    });

    return { url: signed.publicUrl, key: signed.key };
  } catch (error) {
    sendUploadMetric({
      scope: params.scope,
      beforeBytes: params.file.size,
      afterBytes: params.file.size,
      durationMs: Date.now() - startedAt,
      presignMs,
      uploadMs,
      contentType: params.file.type,
      compressionApplied: false,
      outcome: "error",
      errorMessage: error instanceof Error ? error.message : String(error || "Upload failed"),
    });
    throw error;
  }
}
