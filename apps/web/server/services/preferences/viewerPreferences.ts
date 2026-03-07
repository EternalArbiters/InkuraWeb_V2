import "server-only";

import { cache } from "react";
import { getViewerWithPrefs } from "@/server/services/works/viewer";
import { ApiError } from "@/server/http";

export type ViewerPreferences = {
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
  preferredLanguages: string[];
  blockedGenreIds: string[];
  blockedWarningIds: string[];
  blockedDeviantLoveIds: string[];
};

function mapViewerPreferences(viewer: Awaited<ReturnType<typeof getViewerWithPrefs>>): ViewerPreferences | null {
  if (!viewer) return null;

  return {
    adultConfirmed: viewer.adultConfirmed,
    deviantLoveConfirmed: viewer.deviantLoveConfirmed,
    preferredLanguages: viewer.preferredLanguages,
    blockedGenreIds: viewer.blockedGenreIds,
    blockedWarningIds: viewer.blockedWarningIds,
    blockedDeviantLoveIds: viewer.blockedDeviantLoveIds,
  };
}

export const getViewerPreferences = cache(async (): Promise<ViewerPreferences | null> => {
  const viewer = await getViewerWithPrefs();
  return mapViewerPreferences(viewer);
});

export async function requireViewerPreferences(): Promise<ViewerPreferences> {
  const prefs = await getViewerPreferences();
  if (!prefs) throw new ApiError(401, "Unauthorized");
  return prefs;
}
