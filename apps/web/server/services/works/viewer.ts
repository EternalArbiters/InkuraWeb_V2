import "server-only";

import { cache } from "react";
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

const getSessionUserId = cache(async (): Promise<string | null> => {
  const session = await getSession();
  return ((session as any)?.user?.id as string | undefined) || null;
});

const getViewerUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
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
});

export const getViewerBasic = cache(async (): Promise<ViewerBasic | null> => {
  const user = await getViewerUser();
  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    adultConfirmed: !!user.adultConfirmed,
    deviantLoveConfirmed: !!user.deviantLoveConfirmed,
  };
});

export const getViewerWithPrefs = cache(async (): Promise<ViewerWithPrefs | null> => {
  const user = await getViewerUser();
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
});
