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
  workId?: string;
  chapterId?: string;
}): Promise<PresignResponse> {
  const res = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Presign failed");
  return data;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      // Cloudflare R2 accepts content-type; keep consistent with presign.
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }
}

export async function presignAndUpload(params: {
  scope: "covers" | "pages" | "files";
  file: File;
  workId?: string;
  chapterId?: string;
}) {
  const signed = await presignUpload({
    scope: params.scope,
    filename: params.file.name,
    contentType: params.file.type,
    workId: params.workId,
    chapterId: params.chapterId,
  });
  await uploadToPresignedUrl(signed.uploadUrl, params.file);
  return { url: signed.publicUrl, key: signed.key };
}
