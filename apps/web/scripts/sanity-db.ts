import { PrismaClient } from "@prisma/client";

/**
 * Sanity check for the connected database.
 *
 * What it does:
 * - Verifies Prisma can connect
 * - Verifies V15 taxonomy columns exist by selecting them
 * - Verifies AdminAuditLog table exists
 * - Prints basic counts to help debugging
 *
 * Usage:
 *   npm --workspace apps/web run sanity:db
 */

const prisma = new PrismaClient();

async function main() {
  // 1) basic connection
  await prisma.$connect();

  // 2) lightweight checks (will throw if columns/tables missing)
  const [
    genreCount,
    tagCount,
    warningCount,
    deviantCount,
    auditCount,
  ] = await Promise.all([
    prisma.genre.count(),
    prisma.tag.count(),
    prisma.warningTag.count(),
    prisma.deviantLoveTag.count(),
    prisma.adminAuditLog.count(),
  ]);

  // 3) select V15 fields (throws if columns do not exist)
  // Use take:1 so it works even with large tables.
  const checks = await Promise.all([
    prisma.genre.findMany({
      take: 1,
      select: {
        id: true,
        slug: true,
        isActive: true,
        isSystem: true,
        isLocked: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    prisma.tag.findMany({
      take: 1,
      select: {
        id: true,
        slug: true,
        isActive: true,
        isSystem: true,
        isLocked: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    prisma.warningTag.findMany({
      take: 1,
      select: {
        id: true,
        slug: true,
        isActive: true,
        isSystem: true,
        isLocked: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    prisma.deviantLoveTag.findMany({
      take: 1,
      select: {
        id: true,
        slug: true,
        isActive: true,
        isSystem: true,
        isLocked: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
  ]);

  console.log("[sanity:db] Connected and schema looks compatible.");
  console.log("[sanity:db] Counts:", {
    genres: genreCount,
    tags: tagCount,
    warningTags: warningCount,
    deviantLoveTags: deviantCount,
    adminAuditLogs: auditCount,
  });

  // Print 1 sample row per table if present (helps debugging seed/sortOrder)
  const [g, t, w, d] = checks;
  console.log("[sanity:db] Sample rows (if any):", {
    genre: g?.[0] ?? null,
    tag: t?.[0] ?? null,
    warningTag: w?.[0] ?? null,
    deviantLoveTag: d?.[0] ?? null,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("[sanity:db] FAILED:");
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
