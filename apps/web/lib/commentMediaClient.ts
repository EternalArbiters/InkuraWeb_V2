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

export async function presignCommentMedia(params: { file: File; kind: CommentMediaKind; sha256?: string }): Promise<PresignCommentMediaResponse> {
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
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to presign comment media");
  return json as PresignCommentMediaResponse;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob) {
  const res = await fetch(uploadUrl, { method: "PUT", body: file });
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
  const sha256 = await sha256Hex(params.file);
  const presigned = await presignCommentMedia({ file: params.file, kind: params.kind, sha256 });

  if (!presigned.exists) {
    await uploadToPresignedUrl(presigned.uploadUrl, params.file);
  }

  const committed = await commitCommentMedia({
    kind: params.kind,
    sha256,
    key: presigned.key,
    contentType: params.file.type,
    sizeBytes: params.file.size,
  });

  return committed.media;
}
