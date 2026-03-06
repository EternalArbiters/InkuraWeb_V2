import "server-only";

export type UploadScope = "covers" | "pages" | "files" | "comment_images" | "comment_gifs";

function safeUploadFilename(name: string): string {
  return String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeUploadScope(v: unknown): UploadScope {
  const s = String(v || "files").toLowerCase().replace(/\s+/g, "");
  if (s === "covers" || s === "cover") return "covers";
  if (s === "pages" || s === "page") return "pages";
  if (s === "comment_images" || s === "commentimage" || s === "commentimages" || s === "comment-image" || s === "comment-images") {
    return "comment_images";
  }
  if (s === "comment_gifs" || s === "commentgif" || s === "commentgifs" || s === "comment-gif" || s === "comment-gifs") {
    return "comment_gifs";
  }
  return "files";
}

export function guessUploadContentType(filename: string): string {
  const n = filename.toLowerCase();
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export function normalizeUploadContentType(filename: string, ct: string): string {
  const v = (ct || '').trim();
  return v ? v : guessUploadContentType(filename);
}

export function isAllowedUploadContentType(scope: UploadScope, ct: string): boolean {
  const c = ct.toLowerCase();
  if (scope === 'covers' || scope === 'pages' || scope === 'comment_images') {
    return c === 'image/webp' || c === 'image/png' || c === 'image/jpeg';
  }
  if (scope === 'comment_gifs') {
    return c === 'image/gif';
  }
  return c === 'application/pdf' || c === 'application/octet-stream';
}

export function maxBytesForUploadScope(scope: UploadScope): number {
  if (scope === 'covers') return 2 * 1024 * 1024;
  if (scope === 'pages') return 5 * 1024 * 1024;
  if (scope === 'comment_images') return 2 * 1024 * 1024;
  if (scope === 'comment_gifs') return 5 * 1024 * 1024;
  return 20 * 1024 * 1024;
}

export function normalizeSha256(v: unknown): string | null {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-f0-9]{64}$/.test(s)) return null;
  return s;
}

export function extFromUploadContentType(ct: string, filename: string): string {
  const c = ct.toLowerCase();
  if (c === 'image/gif') return 'gif';
  if (c === 'image/png') return 'png';
  if (c === 'image/webp') return 'webp';
  if (c === 'image/jpeg') return 'jpg';
  const safe = safeUploadFilename(filename);
  const parts = safe.split('.');
  const last = parts.length > 1 ? parts[parts.length - 1] : 'bin';
  return last || 'bin';
}

export function makeCommentMediaObjectKey(params: {
  sha256: string;
  scope: 'comment_images' | 'comment_gifs';
  ext: string;
}): string {
  if (params.scope === 'comment_gifs') return `media/comment/gif/${params.sha256}.gif`;
  return `media/comment/image/${params.sha256}.${params.ext}`;
}
