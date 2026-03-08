import "server-only";

// NOTE:
// `server-only` is a Next.js marker module that helps prevent accidental client imports.
// If you run ad-hoc Node scripts that import this module, make sure dependencies are installed.

import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function r2EndpointFromAccountId(accountId: string) {
  // Cloudflare R2 S3-compatible API endpoint
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export type R2Env = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string; // e.g. https://cdn.example.com
};

export function getR2Env(): R2Env {
  // Support BOTH naming styles:
  // - v15 docs / check-env: R2_ACCOUNT_ID + R2_BUCKET_NAME
  // - runtime helpers:      R2_ENDPOINT + R2_BUCKET

  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;

  const endpoint =
    process.env.R2_ENDPOINT ||
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    (accountId ? r2EndpointFromAccountId(accountId) : undefined);

  const bucket =
    process.env.R2_BUCKET ||
    process.env.CLOUDFLARE_R2_BUCKET ||
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME;

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  return {
    endpoint: required("R2_ENDPOINT (or R2_ACCOUNT_ID)", endpoint),
    accessKeyId: required(
      "R2_ACCESS_KEY_ID",
      process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    ),
    secretAccessKey: required(
      "R2_SECRET_ACCESS_KEY",
      process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ),
    bucket: required("R2_BUCKET (or R2_BUCKET_NAME)", bucket),
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

export async function deleteObjects(keys: string[]) {
  const env = getR2Env();
  const client = getR2Client();
  const uniqueKeys = [...new Set(keys.map((key) => String(key || "").trim()).filter(Boolean))];
  if (!uniqueKeys.length) return { deleted: [] as string[] };

  const chunkSize = 1000;
  const deleted: string[] = [];
  for (let index = 0; index < uniqueKeys.length; index += chunkSize) {
    const chunk = uniqueKeys.slice(index, index + chunkSize);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: env.bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    deleted.push(...chunk);
  }

  return { deleted };
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

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }
  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === "function") {
    const text = await (body as { transformToString: () => Promise<string> }).transformToString();
    return Buffer.from(text);
  }
  if (typeof (body as NodeJS.ReadableStream)?.on === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Unsupported R2 body type");
}

export async function getObjectBuffer(
  key: string
): Promise<{ exists: boolean; buffer?: Buffer; contentLength?: number; contentType?: string; lastModified?: Date; eTag?: string }> {
  const env = getR2Env();
  const client = getR2Client();
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: env.bucket, Key: key }));
    return {
      exists: true,
      buffer: await bodyToBuffer(res.Body),
      contentLength: res.ContentLength ?? undefined,
      contentType: res.ContentType ?? undefined,
      lastModified: res.LastModified ?? undefined,
      eTag: res.ETag ?? undefined,
    };
  } catch (e: any) {
    const code = e?.$metadata?.httpStatusCode;
    const name = String(e?.name || "").toLowerCase();
    if (code === 404 || name === "nosuchkey" || name === "notfound") {
      return { exists: false };
    }
    throw e;
  }
}

export type ListedObject = {
  key: string;
  size: number;
  lastModified?: Date;
  eTag?: string;
};

export async function listObjectsPage(params?: { prefix?: string; continuationToken?: string; maxKeys?: number }) {
  const env = getR2Env();
  const client = getR2Client();
  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: env.bucket,
      Prefix: params?.prefix || undefined,
      ContinuationToken: params?.continuationToken || undefined,
      MaxKeys: params?.maxKeys ?? 1000,
    })
  );

  return {
    objects: (res.Contents || [])
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.Key))
      .map((item) => ({
        key: String(item.Key),
        size: Number(item.Size || 0),
        lastModified: item.LastModified ?? undefined,
        eTag: item.ETag ?? undefined,
      } satisfies ListedObject)),
    nextContinuationToken: res.NextContinuationToken || undefined,
    isTruncated: Boolean(res.IsTruncated),
  };
}

export async function listAllObjects(params?: { prefix?: string; maxKeysPerPage?: number; hardLimit?: number }) {
  const objects: ListedObject[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await listObjectsPage({
      prefix: params?.prefix,
      continuationToken,
      maxKeys: params?.maxKeysPerPage ?? 1000,
    });
    objects.push(...page.objects);
    continuationToken = page.nextContinuationToken;
    if (params?.hardLimit && objects.length >= params.hardLimit) {
      return objects.slice(0, params.hardLimit);
    }
  } while (continuationToken);

  return objects;
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
