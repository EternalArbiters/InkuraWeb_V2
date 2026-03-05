import prisma from "@/server/db/prisma";
import { parseJsonStringArray, stringifyJsonStringArray } from "@/lib/prefs";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      adultConfirmed: true,
      deviantLoveConfirmed: true,
      preferredLanguagesJson: true,
      blockedGenres: { select: { id: true, name: true, slug: true } },
      blockedWarnings: { select: { id: true, name: true, slug: true } },
      blockedDeviantLove: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!user) return json({ error: "Not found" }, { status: 404 });

  return json({
    prefs: {
      adultConfirmed: user.adultConfirmed,
      deviantLoveConfirmed: user.deviantLoveConfirmed,
      preferredLanguages: parseJsonStringArray(user.preferredLanguagesJson),
      blockedGenreIds: user.blockedGenres.map((g) => g.id),
      blockedWarningIds: user.blockedWarnings.map((w) => w.id),
      blockedDeviantLoveIds: user.blockedDeviantLove.map((d) => d.id),
    },
  });
});

export const PATCH = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const adultConfirmed = typeof body.adultConfirmed === "boolean" ? body.adultConfirmed : undefined;
  const deviantLoveConfirmed = typeof body.deviantLoveConfirmed === "boolean" ? body.deviantLoveConfirmed : undefined;

  const preferredLanguages = Array.isArray(body.preferredLanguages) ? body.preferredLanguages.map(String) : undefined;
  const blockedGenreIds = Array.isArray(body.blockedGenreIds) ? body.blockedGenreIds.map(String) : undefined;
  const blockedWarningIds = Array.isArray(body.blockedWarningIds) ? body.blockedWarningIds.map(String) : undefined;
  const blockedDeviantLoveIds = Array.isArray(body.blockedDeviantLoveIds) ? body.blockedDeviantLoveIds.map(String) : undefined;

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adultConfirmed: true, deviantLoveConfirmed: true },
  });

  const data: any = {};

  const nextAdult = adultConfirmed !== undefined ? adultConfirmed : !!current?.adultConfirmed;
  let nextDeviant = deviantLoveConfirmed !== undefined ? deviantLoveConfirmed : !!current?.deviantLoveConfirmed;

  // If adult gate is OFF, deviant love must be OFF too.
  if (!nextAdult) nextDeviant = false;

  // Cannot enable deviant love without adult gate.
  if (nextDeviant && !nextAdult) {
    return json({ error: "Deviant Love requires 18+ confirmation" }, { status: 400 });
  }

  if (adultConfirmed !== undefined) data.adultConfirmed = nextAdult;
  // Update deviant flag if explicitly set OR if adult got turned off and we need to force lock.
  if (deviantLoveConfirmed !== undefined || (adultConfirmed === false && current?.deviantLoveConfirmed)) {
    data.deviantLoveConfirmed = nextDeviant;
  }

  if (preferredLanguages !== undefined) data.preferredLanguagesJson = stringifyJsonStringArray(preferredLanguages);
  if (blockedGenreIds !== undefined) data.blockedGenres = { set: blockedGenreIds.map((id: string) => ({ id })) };
  if (blockedWarningIds !== undefined) data.blockedWarnings = { set: blockedWarningIds.map((id: string) => ({ id })) };
  if (blockedDeviantLoveIds !== undefined) data.blockedDeviantLove = { set: blockedDeviantLoveIds.map((id: string) => ({ id })) };

  await prisma.user.update({ where: { id: session.user.id }, data });

  return json({ ok: true });
});
