import { PrismaClient } from "@prisma/client";

/**
 * Fix for the admin-studio bug where translatorId was set to the admin's ID
 * instead of the target user's ID when uploading on behalf of a user.
 *
 * Affected works have:
 *   - translatorId = adminId  (wrong — should be authorId)
 *   - authorId != adminId     (the real uploader is someone else)
 *   - uploadedByAdminId = null (pre-migration, column didn't exist yet)
 *
 * Fix:
 *   - translatorId = authorId  (translator should be the same as the creator/uploader)
 *   - uploadedByAdminId = adminId (properly mark it as admin-uploaded)
 *
 * Usage:
 *   npm --workspace apps/web run fix:admin-translator-bug
 */

const ADMIN_USERNAME_OR_NAME = "Noeleph Goddess";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log("Connected to database.");

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { name: ADMIN_USERNAME_OR_NAME },
        { username: ADMIN_USERNAME_OR_NAME },
      ],
    },
    select: { id: true, name: true, username: true },
  });

  if (!admin) {
    console.error(`Admin user "${ADMIN_USERNAME_OR_NAME}" not found.`);
    process.exit(1);
  }
  console.log(`Found admin: ${admin.name || admin.username} (id: ${admin.id})`);

  // Find affected works: translator is admin but author is someone else
  const affected = await prisma.work.findMany({
    where: {
      translatorId: admin.id,
      NOT: { authorId: admin.id },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      authorId: true,
      author: { select: { name: true, username: true } },
      uploadedByAdminId: true,
    },
  });

  if (affected.length === 0) {
    console.log("No affected works found. Nothing to fix.");
    return;
  }

  console.log(`\nFound ${affected.length} affected work(s):`);
  for (const w of affected) {
    const authorName = w.author?.name || w.author?.username || w.authorId;
    console.log(`  - "${w.title}" (slug: ${w.slug}, author: ${authorName}, uploadedByAdminId: ${w.uploadedByAdminId ?? "null"})`);
  }

  console.log("\nApplying fix...");

  let fixed = 0;
  for (const w of affected) {
    await prisma.work.update({
      where: { id: w.id },
      data: {
        translatorId: w.authorId,
        uploadedByAdminId: w.uploadedByAdminId ?? admin.id,
      },
    });
    const authorName = w.author?.name || w.author?.username || w.authorId;
    console.log(`  Fixed: "${w.title}" → translatorId = ${authorName}, uploadedByAdminId = ${admin.id}`);
    fixed++;
  }

  console.log(`\nDone. Fixed ${fixed} work(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());