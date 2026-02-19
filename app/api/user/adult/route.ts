import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const db = prisma as any;

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const adultConfirmed = Boolean(body?.adultConfirmed);

  const user = await db.user.update({
    where: { id: userId },
    data: { adultConfirmed },
    select: { id: true, adultConfirmed: true },
  });

  return NextResponse.json({ ok: true, user });
}
