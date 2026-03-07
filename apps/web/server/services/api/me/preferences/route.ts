import "server-only";

import prisma from "@/server/db/prisma";
import { stringifyJsonStringArray } from "@/lib/prefs";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { requireViewerPreferences } from "@/server/services/preferences/viewerPreferences";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const prefs = await requireViewerPreferences();
  return json({ prefs });
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

  if (!nextAdult) nextDeviant = false;

  if (nextDeviant && !nextAdult) {
    return json({ error: "Deviant Love requires 18+ confirmation" }, { status: 400 });
  }

  if (adultConfirmed !== undefined) data.adultConfirmed = nextAdult;
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
