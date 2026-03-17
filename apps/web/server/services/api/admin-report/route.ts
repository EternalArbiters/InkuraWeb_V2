import "server-only";

import prisma from "@/server/db/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { isAdminEmail } from "@/server/auth/adminEmail";
import { apiRoute, json } from "@/server/http";
import { headObject, publicUrlForKey } from "@/server/storage/r2";
import { isAllowedUploadContentType, maxBytesForUploadScope } from "@/server/uploads/presignRules";

export const runtime = "nodejs";

const MAX_ADMIN_REPORT_ATTACHMENTS = 4;
const ADMIN_REPORT_ATTACHMENT_SCOPE = "admin_report_attachments" as const;

type AdminReportAttachmentInput = {
  filename?: unknown;
  key?: unknown;
  contentType?: unknown;
  sizeBytes?: unknown;
  kind?: unknown;
};

function clamp(s: string, max: number) {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function normalizeAttachmentKind(value: unknown, contentType: string) {
  const v = String(value || "").trim().toUpperCase();
  if (v === "IMAGE" || contentType.startsWith("image/")) return "IMAGE" as const;
  return "FILE" as const;
}

async function normalizeAdminReportAttachments(rawAttachments: unknown, userId: string) {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) return [] as Array<{
    filename: string;
    key: string;
    url: string;
    contentType: string;
    sizeBytes: number;
    kind: "IMAGE" | "FILE";
  }>;

  const items = rawAttachments.slice(0, MAX_ADMIN_REPORT_ATTACHMENTS) as AdminReportAttachmentInput[];
  const normalized = [] as Array<{
    filename: string;
    key: string;
    url: string;
    contentType: string;
    sizeBytes: number;
    kind: "IMAGE" | "FILE";
  }>;

  for (const item of items) {
    const filename = clamp(String(item?.filename || "attachment"), 160);
    const key = String(item?.key || "").trim().replace(/^\//, "");
    const claimedContentType = String(item?.contentType || "").trim().toLowerCase();
    const claimedSizeBytes = Number(item?.sizeBytes ?? 0);

    if (!filename || !key) continue;
    if (!key.startsWith(`users/${userId}/admin_report_attachments/`)) {
      throw new Error("Invalid attachment key");
    }

    const head = await headObject(key);
    if (!head.exists) {
      throw new Error("Attachment not found in storage");
    }

    const contentType = String(head.contentType || claimedContentType || "application/octet-stream").trim().toLowerCase();
    const sizeBytes = Number(head.contentLength ?? claimedSizeBytes ?? 0);

    if (!isAllowedUploadContentType(ADMIN_REPORT_ATTACHMENT_SCOPE, contentType)) {
      throw new Error("Unsupported attachment file type");
    }

    const maxBytes = maxBytesForUploadScope(ADMIN_REPORT_ATTACHMENT_SCOPE);
    if (sizeBytes > maxBytes) {
      throw new Error(`Attachment too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)`);
    }

    normalized.push({
      filename,
      key,
      url: publicUrlForKey(key),
      contentType,
      sizeBytes,
      kind: normalizeAttachmentKind(item?.kind, contentType),
    });
  }

  return normalized;
}

export const GET = apiRoute(async () => {
  try {
    const { me } = await requireUser();
    const isAdmin = me.role === "ADMIN" && isAdminEmail((me as any).email);

    const rows = await prisma.adminInboxReport.findMany({
      where: isAdmin ? undefined : { reporterId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        message: true,
        pageUrl: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        adminNote: true,
        reporterReadAt: true,
        adminReadAt: true,
        reporter: { select: { id: true, name: true, username: true, email: true, image: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            filename: true,
            key: true,
            url: true,
            contentType: true,
            sizeBytes: true,
            kind: true,
            createdAt: true,
          },
        },
      },
    });

    const ids = rows.map((r) => r.id);
    const now = new Date();
    if (ids.length) {
      if (isAdmin) {
        await prisma.adminInboxReport.updateMany({
          where: { id: { in: ids }, adminReadAt: null },
          data: { adminReadAt: now },
        });
      } else {
        await prisma.adminInboxReport.updateMany({
          where: { id: { in: ids }, reporterId: me.id, reporterReadAt: null },
          data: { reporterReadAt: now },
        });
      }
    }

    const reports = rows.map((r: any) => {
      if (isAdmin && !r.adminReadAt) return { ...r, adminReadAt: now };
      if (!isAdmin && !r.reporterReadAt) return { ...r, reporterReadAt: now };
      return r;
    });

    return json({ reports, isAdmin });
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const POST = apiRoute(async (req: Request) => {
  try {
    const { me } = await requireUser();
    const body = await req.json().catch(() => ({} as any));

    const title = clamp(body?.title, 80);
    const message = clamp(body?.message, 2000);
    const pageUrl = clamp(body?.pageUrl, 400) || null;

    if (!title) return json({ error: "Title is required" }, { status: 400 });
    if (!message) return json({ error: "Message is required" }, { status: 400 });
    if (Array.isArray(body?.attachments) && body.attachments.length > MAX_ADMIN_REPORT_ATTACHMENTS) {
      return json({ error: `You can attach up to ${MAX_ADMIN_REPORT_ATTACHMENTS} files` }, { status: 400 });
    }

    let attachments;
    try {
      attachments = await normalizeAdminReportAttachments(body?.attachments, me.id);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid attachments" }, { status: 400 });
    }

    const created = await prisma.adminInboxReport.create({
      data: {
        title,
        message,
        pageUrl,
        reporterId: me.id,
        reporterReadAt: new Date(),
        attachments: attachments.length
          ? {
              create: attachments,
            }
          : undefined,
      },
      select: { id: true },
    });

    return json({ ok: true, id: created.id });
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
});
