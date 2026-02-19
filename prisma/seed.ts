import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "noelephgoddess.game@gmail.com" },
    update: {
      role: "ADMIN",
      name: "Eternal Arbiters",
      username: "noelephgoddess",
    },
    create: {
      name: "Eternal Arbiters",
      username: "noelephgoddess",
      email: "noelephgoddess.game@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
      image: "/images/default-avatar.png",
      adultConfirmed: true,
    },
  });

  // contoh karya (1 normal, 1 NSFW) untuk testing filter 18+
  await prisma.work.createMany({
    data: [
      {
        title: "Crimson Winter",
        description: "Contoh novel (aman) untuk testing.",
        type: "NOVEL",
        genres: "fantasy,romance",
        nsfw: false,
        postingRole: "AUTHOR",
        creatorId: admin.id,
        updatedAt: new Date(),
      },
      {
        title: "Midnight Bloom (18+)",
        description: "Contoh karya NSFW untuk testing filter 18+.",
        type: "COMIC",
        genres: "mature,drama",
        nsfw: true,
        postingRole: "AUTHOR",
        creatorId: admin.id,
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
