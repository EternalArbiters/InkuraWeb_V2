import { NextResponse } from "next/server";
import prisma from "@/server/db/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, slug: true, status: true },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ work });
}
