import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

function normalizeFocus(raw: unknown): number | null | undefined {
  // undefined => ignore (invalid), null => reset, number => 0..100
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const v = Number(raw);
  if (!Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeZoom(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const v = Number(raw);
  if (!Number.isFinite(v)) return undefined;
  const clamped = Math.max(1, Math.min(2.5, v));
  return Number(clamped.toFixed(2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: me });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if ("avatarFocusX" in body) {
    const v = normalizeFocus(body.avatarFocusX);
    if (v !== undefined) data.avatarFocusX = v;
  }

  if ("avatarFocusY" in body) {
    const v = normalizeFocus(body.avatarFocusY);
    if (v !== undefined) data.avatarFocusY = v;
  }

  if ("avatarZoom" in body) {
    const v = normalizeZoom(body.avatarZoom);
    if (v !== undefined) data.avatarZoom = v;
  }

  if ("username" in body) {
    const next = normalizeUsername(body.username);
    if (!next) return NextResponse.json({ error: "Username is required" }, { status: 400 });
    if (!isValidUsername(next)) {
      return NextResponse.json(
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
    if (clash) return NextResponse.json({ error: "Username already in use" }, { status: 409 });

    data.username = next;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: true, unchanged: true });
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
    return NextResponse.json({ ok: true, profile: updated });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("P2002") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Username already in use" }, { status: 409 });
    }
    console.error("[api/me/profile] PATCH error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
