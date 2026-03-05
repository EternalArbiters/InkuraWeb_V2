import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

function clampText(s: unknown): string {
  return String(s ?? "").trim();
}

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const text = clampText(body?.body);
  if (!text) return json({ error: "Comment body is required" }, { status: 400 });
  if (text.length > 2000) return json({ error: "Comment too long" }, { status: 400 });

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true, isHidden: true } });
  if (!c) return json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;

  if (!isOwner && !isAdmin) return json({ error: "Forbidden" }, { status: 403 });
  if (c.isHidden && !isAdmin) return json({ error: "Comment is hidden" }, { status: 403 });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: text, editedAt: new Date() },
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
      attachments: { include: { media: { select: { id: true, type: true, url: true, contentType: true, sizeBytes: true } } } },
    },
  });

  return json({ ok: true, comment: updated });
});

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, userId: true } });
  if (!c) return json({ error: "Comment not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = c.userId === session.user.id;
  if (!isOwner && !isAdmin) return json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    // best effort: clear reports
    await tx.report.deleteMany({ where: { targetType: "COMMENT", targetId: commentId } });
    await tx.comment.delete({ where: { id: commentId } });
  });

  return json({ ok: true });
});
