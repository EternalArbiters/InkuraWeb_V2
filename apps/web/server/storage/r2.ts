import "server-only";

import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export type R2Env = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string; // e.g. https://cdn.example.com or https://<bucket>.<account>.r2.dev
};

export function getR2Env(): R2Env {
  const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  return {
    endpoint: required("R2_ENDPOINT", endpoint),
    accessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID),
    secretAccessKey: required(
      "R2_SECRET_ACCESS_KEY",
      process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ),
    bucket: required("R2_BUCKET", bucket),
    publicBaseUrl: required("R2_PUBLIC_BASE_URL", publicBaseUrl).replace(/\/$/, ""),
  };
}

let _client: S3Client | null = null;

export function getR2Client() {
  if (_client) return _client;
  const env = getR2Env();
  _client = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
  });
  return _client;
}

export function safeFilename(name: string) {
  return String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export type UploadScope = "covers" | "pages" | "files";

export function makeObjectKey(params: {
  userId: string;
  workId?: string;
  chapterId?: string;
  scope: UploadScope;
  filename: string;
}) {
  const id = crypto.randomUUID();
  const safe = safeFilename(params.filename) || "upload";
  const baseParts = ["users", params.userId];
  if (params.workId) baseParts.push("works", params.workId);
  if (params.chapterId) baseParts.push("chapters", params.chapterId);
  baseParts.push(params.scope);
  return `${baseParts.join("/")}/${id}-${safe}`;
}

export function publicUrlForKey(key: string) {
  const { publicBaseUrl } = getR2Env();
  return `${publicBaseUrl}/${key}`;
}

export async function presignPutObject(params: {
  key: string;
  contentType?: string;
  cacheControl?: string;
  expiresInSec?: number;
}) {
  const env = getR2Env();
  const client = getR2Client();

  const cmd = new PutObjectCommand({
    Bucket: env.bucket,
    Key: params.key,
    ContentType: params.contentType || "application/octet-stream",
    CacheControl: params.cacheControl || "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: params.expiresInSec ?? 60 });
  return {
    uploadUrl,
    key: params.key,
    publicUrl: publicUrlForKey(params.key),
  };
}

export async function putBuffer(params: {
  key: string;
  buffer: Buffer;
  contentType?: string;
  cacheControl?: string;
}) {
  const env = getR2Env();
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType || "application/octet-stream",
      CacheControl: params.cacheControl || "public, max-age=31536000, immutable",
    })
  );
  return { key: params.key, publicUrl: publicUrlForKey(params.key) };
}

export async function deleteObject(key: string) {
  const env = getR2Env();
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }));
  return true;
}


export async function headObject(key: string): Promise<{ exists: boolean; contentLength?: number; contentType?: string }> {
  const env = getR2Env();
  const client = getR2Client();
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: env.bucket, Key: key }));
    return { exists: true, contentLength: res.ContentLength ?? undefined, contentType: res.ContentType ?? undefined };
  } catch (e: any) {
    const code = e?.$metadata?.httpStatusCode;
    const name = String(e?.name || "").toLowerCase();
    if (code === 404 || name === "nosuchkey" || name === "notfound") {
      return { exists: false };
    }
    throw e;
  }
}

export function tryExtractKeyFromUrl(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  const s = String(urlOrKey);

  // If it's already a key (no protocol), assume it.
  if (!/^https?:\/\//i.test(s)) {
    // strip leading slash if someone stored "/<key>"
    return s.replace(/^\//, "");
  }

  try {
    const u = new URL(s);
    // If publicBaseUrl matches, strip it.
    const base = getR2Env().publicBaseUrl;
    if (s.startsWith(base)) {
      return s.slice(base.length).replace(/^\//, "");
    }
    // Otherwise, best-effort: use pathname without leading "/".
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}
