import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { parseJsonStringArray } from "@/lib/prefs";

export type ViewerBasic = {
  id: string;
  role: string;
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
};

export type ViewerWithPrefs = ViewerBasic & {
  preferredLanguages: string[];
  blockedGenreIds: string[];
  blockedWarningIds: string[];
  blockedDeviantLoveIds: string[];
};

export async function getViewerBasic(): Promise<ViewerBasic | null> {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      adultConfirmed: true,
      deviantLoveConfirmed: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    adultConfirmed: !!user.adultConfirmed,
    deviantLoveConfirmed: !!user.deviantLoveConfirmed,
  };
}

export async function getViewerWithPrefs(): Promise<ViewerWithPrefs | null> {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      adultConfirmed: true,
      deviantLoveConfirmed: true,
      preferredLanguagesJson: true,
      blockedGenres: { select: { id: true } },
      blockedWarnings: { select: { id: true } },
      blockedDeviantLove: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    adultConfirmed: !!user.adultConfirmed,
    deviantLoveConfirmed: !!user.deviantLoveConfirmed,
    preferredLanguages: parseJsonStringArray(user.preferredLanguagesJson).map((s) => String(s).toLowerCase()),
    blockedGenreIds: user.blockedGenres.map((g) => g.id),
    blockedWarningIds: user.blockedWarnings.map((w) => w.id),
    blockedDeviantLoveIds: user.blockedDeviantLove.map((d) => d.id),
  };
}
