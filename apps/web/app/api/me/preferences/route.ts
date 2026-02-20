import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { parseJsonStringArray, stringifyJsonStringArray } from "@/lib/prefs";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      adultConfirmed: true,
      preferredLanguagesJson: true,
      blockedGenres: { select: { id: true, name: true, slug: true } },
      blockedWarnings: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    prefs: {
      adultConfirmed: user.adultConfirmed,
      preferredLanguages: parseJsonStringArray(user.preferredLanguagesJson),
      blockedGenreIds: user.blockedGenres.map((g) => g.id),
      blockedWarningIds: user.blockedWarnings.map((w) => w.id),
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const adultConfirmed = typeof body.adultConfirmed === "boolean" ? body.adultConfirmed : undefined;

  const preferredLanguages = Array.isArray(body.preferredLanguages) ? body.preferredLanguages.map(String) : undefined;
  const blockedGenreIds = Array.isArray(body.blockedGenreIds) ? body.blockedGenreIds.map(String) : undefined;
  const blockedWarningIds = Array.isArray(body.blockedWarningIds) ? body.blockedWarningIds.map(String) : undefined;

  // v14: adultConfirmed can only be turned ON (not turned off) from UI flow.
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adultConfirmed: true },
  });

  const data: any = {};

  if (adultConfirmed !== undefined) {
    // Only allow setting to true; ignore attempts to set false.
    if (adultConfirmed === true && !current?.adultConfirmed) data.adultConfirmed = true;
  }

  if (preferredLanguages !== undefined) data.preferredLanguagesJson = stringifyJsonStringArray(preferredLanguages);
  if (blockedGenreIds !== undefined) data.blockedGenres = { set: blockedGenreIds.map((id: string) => ({ id })) };
  if (blockedWarningIds !== undefined) data.blockedWarnings = { set: blockedWarningIds.map((id: string) => ({ id })) };

  await prisma.user.update({ where: { id: session.user.id }, data });

  return NextResponse.json({ ok: true });
}
