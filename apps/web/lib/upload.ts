import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

function safeFilename(name: string) {
  return String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function writePublicFile(buffer: Buffer, subdir: string, filename: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  const url = `/uploads/${subdir}/${filename}`;
  return { url, filename };
}

/**
 * Generic upload (no processing). Good for comic pages and other raw assets.
 */
export async function savePublicUpload(file: File, subdir: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = safeFilename(file.name);
  const id = crypto.randomUUID();
  const filename = `${id}-${safeName || "upload"}`;

  return writePublicFile(buffer, subdir, filename);
}

/**
 * Cover upload with best-effort processing:
 * - center-crop to 3:4
 * - resize to 900x1200
 * - convert to WEBP (quality 80)
 *
 * If processing fails (e.g., sharp not available), it falls back to raw upload.
 */
export async function saveCoverUpload(file: File, subdir = "covers") {
  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);

  const safeName = safeFilename(file.name);
  const id = crypto.randomUUID();

  // Best-effort image processing
  try {
    // dynamic import keeps dev startup lighter
    const sharpMod: any = await import("sharp");
    const sharp = sharpMod.default || sharpMod;

    buffer = await sharp(buffer)
      .resize(900, 1200, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `${id}-${(safeName || "cover").replace(/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i, "")}.webp`;
    return writePublicFile(buffer, subdir, filename);
  } catch {
    const filename = `${id}-${safeName || "cover"}`;
    return writePublicFile(buffer, subdir, filename);
  }
}

export async function deletePublicUpload(url: string) {
  // Best-effort cleanup for local dev. In serverless environments this may no-op.
  try {
    if (!url || !url.startsWith("/uploads/")) return false;
    const rel = url.replace(/^\/uploads\//, "");
    const filepath = path.join(process.cwd(), "public", "uploads", rel);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}
