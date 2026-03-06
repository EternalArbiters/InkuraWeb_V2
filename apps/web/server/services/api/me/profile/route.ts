import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

function normalizeUsername(raw: unknown) {
  return String(raw ?? "").trim().toLowerCase();
}

function isValidUsername(v: string) {
  // 3-24 chars, must start with alnum, allow alnum, dash, underscore
  return /^[a-z0-9][a-z0-9-_]{2,23}$/.test(v);
}

function normalizeName(raw: unknown) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  return v.slice(0, 60);
}

function normalizeImage(raw: unknown) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const ok = /^https?:\/\//i.test(v) || v.startsWith("/");
  if (!ok) return null;
  return v.slice(0, 500);
}

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      avatarFocusX: true,
      avatarFocusY: true,
      avatarZoom: true,
      role: true,
      createdAt: true,
    },
  });

  if (!me) return json({ error: "Not found" }, { status: 404 });
  return json({ profile: me });
});

export const PATCH = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const data: any = {};

  if ("name" in body) {
    data.name = normalizeName(body.name);
  }

  if ("image" in body) {
    // Optional: allow updating avatar URL/path.
    // If invalid, ignore it instead of failing hard.
    const img = normalizeImage(body.image);
    if (img !== null) data.image = img;
  }

  // Avatar framing (optional)
  if ("avatarFocusX" in body) {
    const v = Number(body.avatarFocusX);
    if (Number.isFinite(v)) data.avatarFocusX = Math.max(0, Math.min(100, Math.round(v)));
  }
  if ("avatarFocusY" in body) {
    const v = Number(body.avatarFocusY);
    if (Number.isFinite(v)) data.avatarFocusY = Math.max(0, Math.min(100, Math.round(v)));
  }
  if ("avatarZoom" in body) {
    const v = Number(body.avatarZoom);
    if (Number.isFinite(v)) data.avatarZoom = Math.max(1, Math.min(6, v));
  }

  if ("username" in body) {
    const next = normalizeUsername(body.username);
    if (!next) return json({ error: "Username is required" }, { status: 400 });
    if (!isValidUsername(next)) {
      return json(
        {
          error:
            "Invalid username. Use 3–24 chars: letters/numbers, dash (-) or underscore (_). Must start with a letter/number.",
        },
        { status: 400 }
      );
    }

    const clash = await prisma.user.findFirst({
      where: { username: next, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (clash) return json({ error: "Username already in use" }, { status: 409 });

    data.username = next;
  }

  if (!Object.keys(data).length) {
    return json({ ok: true, unchanged: true });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
        avatarFocusX: true,
        avatarFocusY: true,
        avatarZoom: true,
        role: true,
      },
    });
    return json({ ok: true, profile: updated });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("P2002") || msg.toLowerCase().includes("unique")) {
      return json({ error: "Username already in use" }, { status: 409 });
    }
    console.error("[api/me/profile] PATCH error", e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
