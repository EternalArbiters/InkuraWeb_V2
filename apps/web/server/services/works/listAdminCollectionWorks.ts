import "server-only";

import prisma from "@/server/db/prisma";
import { workCardSelect } from "@/server/db/selectors";
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

// v30: works the admin has flagged into "Koleksi Admin" — visible to ADMIN and
// SPECIAL_USER regardless of publish status (see server/services/works/gating.ts).
// Cached (viewer-agnostic — the set of flagged works is the same for every viewer,
// callers already gate WHO gets to see the result) and busted immediately whenever
// the flag is toggled (server/services/admin/works.ts -> revalidateAdminCollection),
// so this stays fast without the toggle ever feeling delayed.
export async function listAdminCollectionWorks(options?: { take?: number }) {
  const take = Math.max(1, Math.min(120, Number(options?.take ?? 20) || 20));

  return withCachedPublicData(
    ["public-admin-collection:v1", String(take)],
    [publicAdminCollectionTag()],
    PUBLIC_CONTENT_REVALIDATE.adminCollection,
    () => loadAdminCollectionWorks(take)
  );
}
