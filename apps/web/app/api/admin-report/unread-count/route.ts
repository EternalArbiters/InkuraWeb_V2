import { NextResponse } from "next/server";
import prisma from "@/server/db/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { isAdminEmail } from "@/server/auth/adminEmail";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { me } = await requireUser();
    const isAdmin = me.role === "ADMIN" && isAdminEmail((me as any).email);

    const count = isAdmin
      ? await prisma.adminInboxReport.count({ where: { status: "OPEN", adminReadAt: null } })
      : await prisma.adminInboxReport.count({ where: { reporterId: me.id, status: "OPEN" } });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
