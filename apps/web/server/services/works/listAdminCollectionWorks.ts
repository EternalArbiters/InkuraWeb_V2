import "server-only";

import prisma from "@/server/db/prisma";
import { workCardSelect } from "@/server/db/selectors";
import { workHasDeviantLoveTags, workHasLegacyDeviantGenre } from "@/server/services/works/gating";
import {
  PUBLIC_CONTENT_REVALIDATE,
  publicAdminCollectionTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";

async function loadAdminCollectionWorks(take: number) {
  return prisma.work.findMany({
    where: { isAdminCollection: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
    select: workCardSelect,
  });
}

export type AdminCollectionViewer = {
  role: string;
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
} | null;

// v30: works the admin has flagged into "Koleksi Admin" — visible to ADMIN and
// SPECIAL_USER regardless of publish status (see server/services/works/gating.ts).
// The underlying query is cached (viewer-agnostic — the flagged set is the same for
// everyone), but the RETURNED list is still filtered per-viewer for mature/Deviant
// Love content here, same as every other discovery listing (listPublishedWorks.ts).
// SPECIAL_USER does NOT get an automatic mature/deviant bypass (only ADMIN does) —
// being in "Koleksi Admin" only unlocks DRAFT visibility, never age/consent gating.
export async function listAdminCollectionWorks(options?: { take?: number; viewer?: AdminCollectionViewer }) {
  const take = Math.max(1, Math.min(120, Number(options?.take ?? 20) || 20));
  const viewer = options?.viewer ?? null;

  const works = await withCachedPublicData(
    ["public-admin-collection:v1", String(take)],
    [publicAdminCollectionTag()],
    PUBLIC_CONTENT_REVALIDATE.adminCollection,
    () => loadAdminCollectionWorks(take)
  );

  const canViewMature = !!viewer && (viewer.role === "ADMIN" || viewer.adultConfirmed);
  const canViewDeviantLove = !!viewer && (viewer.role === "ADMIN" || (viewer.adultConfirmed && viewer.deviantLoveConfirmed));

  return (works as any[]).filter((work) => {
    if (work.isMature && !canViewMature) return false;
    const hasDeviant = workHasDeviantLoveTags(work.deviantLoveTags) || workHasLegacyDeviantGenre(work.genres);
    if (hasDeviant && !canViewDeviantLove) return false;
    return true;
  });
}
