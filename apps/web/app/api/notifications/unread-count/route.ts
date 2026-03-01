import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ count: 0 });
  const count = await prisma.notification.count({ where: { userId: session.user.id, isRead: false } });
  return NextResponse.json({ count });
}
