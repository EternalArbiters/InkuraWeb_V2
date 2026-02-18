import "server-only";

import crypto from "crypto";
import { makeObjectKey, putBuffer, deleteObject, tryExtractKeyFromUrl, publicUrlForKey, safeFilename } from "@/server/storage/r2";

function guessContentTypeFromName(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

export type SavedUpload = { url: string; key: string; filename: string };

/**
 * Generic upload (no processing). Good for comic pages and other raw assets.
 *
 * NOTE:
 * - In v13 we upload to Cloudflare R2.
 * - For best cost/perf, prefer the presign flow (/api/uploads/presign) from the client.
 */
export async function savePublicUpload(
  file: File,
  subdir: string,
  opts?: {
    userId?: string;
    workId?: string;
    chapterId?: string;
    scope?: "covers" | "pages" | "files";
  }
): Promise<SavedUpload> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const scope = opts?.scope || (subdir === "covers" ? "covers" : subdir === "pages" ? "pages" : "files");
  const userId = opts?.userId || "anonymous";
  const key = makeObjectKey({
    userId,
    workId: opts?.workId,
    chapterId: opts?.chapterId,
    scope,
    filename: file.name,
  });

  const contentType = file.type || guessContentTypeFromName(file.name);
  const saved = await putBuffer({ key, buffer, contentType });
  return { url: saved.publicUrl, key, filename: safeFilename(file.name) };
}

/**
 * Cover upload with best-effort processing:
 * - center-crop to 3:4
 * - resize to 900x1200
 * - convert to WEBP (quality 80)
 */
export async function saveCoverUpload(
  file: File,
  subdir = "covers",
  opts?: { userId?: string; workId?: string }
): Promise<SavedUpload> {
  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);

  // Best-effort image processing.
  let contentType = "image/webp";
  let outExt = "webp";
  try {
    const sharpMod: any = await import("sharp");
    const sharp = sharpMod.default || sharpMod;
    buffer = await sharp(buffer)
      .resize(900, 1200, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    // fallback: raw upload
    contentType = file.type || guessContentTypeFromName(file.name);
    const n = file.name.toLowerCase();
    if (n.endsWith(".png")) outExt = "png";
    else if (n.endsWith(".jpg") || n.endsWith(".jpeg")) outExt = "jpg";
    else if (n.endsWith(".webp")) outExt = "webp";
    else outExt = "bin";
  }

  const userId = opts?.userId || "anonymous";
  const safeName = safeFilename(file.name).replace(/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i, "");
  const id = crypto.randomUUID();
  const filename = `${id}-${safeName || "cover"}.${outExt}`;

  // For covers we keep a predictable key name under the covers scope.
  const key = opts?.workId
    ? `users/${userId}/works/${opts.workId}/covers/${filename}`
    : `users/${userId}/${subdir}/${filename}`;

  const saved = await putBuffer({ key, buffer, contentType });
  return { url: saved.publicUrl, key, filename };
}

export async function deletePublicUpload(urlOrKey: string) {
  try {
    const key = tryExtractKeyFromUrl(urlOrKey);
    if (!key) return false;
    await deleteObject(key);
    return true;
  } catch {
    return false;
  }
}

export { publicUrlForKey };
