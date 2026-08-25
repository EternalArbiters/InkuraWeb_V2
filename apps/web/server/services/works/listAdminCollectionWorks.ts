import "server-only";

import prisma from "@/server/db/prisma";
import { workCardSelect } from "@/server/db/selectors";

// v30: works the admin has flagged into "Koleksi Admin" — visible to ADMIN and
// SPECIAL_USER regardless of publish status (see server/services/works/gating.ts).
export async function listAdminCollectionWorks(options?: { take?: number }) {
  const take = Math.max(1, Math.min(120, Number(options?.take ?? 20) || 20));

  return prisma.work.findMany({
    where: { isAdminCollection: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
    select: workCardSelect,
  });
}
