import "server-only";

import { legacyDeviantGenreSlugSet } from "./legacyDeviant";
import type { ViewerBasic } from "./viewer";

export type GateReason = "MATURE" | "DEVIANT_LOVE" | "BOTH";

export type WorkGateResult = {
  isOwner: boolean;
  canViewMature: boolean;
  canViewDeviantLove: boolean;
  requiresMatureGate: boolean;
  requiresDeviantGate: boolean;
  gateReason: GateReason | null;
};

export function computeViewerAccess(viewer: ViewerBasic | null, authorId: string | null | undefined): {
  isOwner: boolean;
  canViewMature: boolean;
  canViewDeviantLove: boolean;
} {
  const isOwner = !!viewer?.id && !!authorId && viewer.id === authorId;
  // v14: adultConfirmed alone unlocks mature content.
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove =
    isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  return { isOwner, canViewMature, canViewDeviantLove };
}

export function workHasLegacyDeviantGenre(genres: Array<{ slug: string | null }> | null | undefined): boolean {
  const legacy = legacyDeviantGenreSlugSet();
  return Array.isArray(genres) && genres.some((g) => legacy.has(String(g?.slug || "")));
}

export function workHasDeviantLoveTags(tags: Array<{ slug?: string | null; id?: string | null }> | null | undefined): boolean {
  return Array.isArray(tags) && tags.length > 0;
}

export function computeWorkGate(input: {
  viewer: ViewerBasic | null;
  work: {
    authorId: string;
    isMature: boolean;
    genres?: Array<{ slug: string | null }> | null;
    deviantLoveTags?: Array<{ slug?: string | null; id?: string | null }> | null;
  };
}): WorkGateResult {
  const { viewer, work } = input;
  const { isOwner, canViewMature, canViewDeviantLove } = computeViewerAccess(viewer, work.authorId);

  const hasLegacyDeviant = workHasLegacyDeviantGenre(work.genres);
  const hasDeviantTags = workHasDeviantLoveTags(work.deviantLoveTags);

  const requiresMatureGate = !!work.isMature && !canViewMature;
  const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviant) && !canViewDeviantLove;

  const gateReason: GateReason | null = requiresMatureGate || requiresDeviantGate
    ? (requiresMatureGate && requiresDeviantGate
        ? "BOTH"
        : requiresDeviantGate
          ? "DEVIANT_LOVE"
          : "MATURE")
    : null;

  return {
    isOwner,
    canViewMature,
    canViewDeviantLove,
    requiresMatureGate,
    requiresDeviantGate,
    gateReason,
  };
}

export function computeChapterGate(input: {
  viewer: ViewerBasic | null;
  work: {
    authorId: string;
    isMature: boolean;
    genres?: Array<{ slug: string | null }> | null;
    deviantLoveTags?: Array<{ slug?: string | null; id?: string | null }> | null;
  };
  chapter: {
    isMature: boolean;
  };
}): WorkGateResult {
  const { viewer, work, chapter } = input;
  const base = computeWorkGate({ viewer, work });

  const requiresMatureGate = !!(work.isMature || chapter.isMature) && !base.canViewMature;
  const hasLegacyDeviant = workHasLegacyDeviantGenre(work.genres);
  const hasDeviantTags = workHasDeviantLoveTags(work.deviantLoveTags);
  const requiresDeviantGate = (hasDeviantTags || hasLegacyDeviant) && !base.canViewDeviantLove;

  const gateReason: GateReason | null = requiresMatureGate || requiresDeviantGate
    ? (requiresMatureGate && requiresDeviantGate
        ? "BOTH"
        : requiresDeviantGate
          ? "DEVIANT_LOVE"
          : "MATURE")
    : null;

  return {
    ...base,
    requiresMatureGate,
    requiresDeviantGate,
    gateReason,
  };
}
