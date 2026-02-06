import {
  PrismaClient,
  WorkStatus,
  WorkType,
  WorkOrigin,
  WorkCompletion,
  ChapterStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { uniqueGenreCatalog } from "../lib/genreCatalog";
import { uniqueWarningCatalog } from "../lib/warningCatalog";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "noelephgoddess.game@gmail.com" },
    update: {
      matureOptIn: true,
      preferredLanguagesJson: JSON.stringify(["id", "en"]),
    },
    create: {
      name: "Eternal Arbiters",
      username: "noelephgoddess",
      email: "noelephgoddess.game@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
      image: "/images/default-avatar.png",
      matureOptIn: true,
      preferredLanguagesJson: JSON.stringify(["id", "en"]),
    },
  });

  // --- Taxonomy seed ---
  const genreNames = uniqueGenreCatalog();
  const genres = await Promise.all(
    genreNames.map((name) =>
      prisma.genre.upsert({
        where: { slug: slugify(name) },
        update: { name },
        create: { name, slug: slugify(name) },
      })
    )
  );

  const warningNames = uniqueWarningCatalog();
  const warnings = await Promise.all(
    warningNames.map((name) =>
      prisma.warningTag.upsert({
        where: { slug: slugify(name) },
        update: { name },
        create: { name, slug: slugify(name) },
      })
    )
  );

  const pickGenre = (name: string) => genres.find((g) => g.slug === slugify(name))!;
  const pickWarning = (name: string) => warnings.find((w) => w.slug === slugify(name))!;

  // Sample NOVEL work
  const novelTitle = "Benara: Dosa Besar InSys Lab";
  const novelSlug = `${slugify(novelTitle)}-${admin.id.slice(-6)}`;

  const novel = await prisma.work.upsert({
    where: { slug: novelSlug },
    update: {},
    create: {
      slug: novelSlug,
      title: novelTitle,
      description: "Contoh karya NOVEL untuk demo reader + studio (v8 taxonomy + warning).",
      type: WorkType.NOVEL,
      status: WorkStatus.PUBLISHED,
      coverImage: "/images/novel1.png",
      authorId: admin.id,

      language: "id",
      origin: WorkOrigin.ORIGINAL,
      completion: WorkCompletion.ONGOING,
      isMature: false,

      genres: {
        connect: [{ id: pickGenre("Fantasy").id }, { id: pickGenre("Mystery").id }, { id: pickGenre("Thriller").id }],
      },
      tags: {
        connectOrCreate: [
          { where: { slug: "dark-academia" }, create: { name: "Dark Academia", slug: "dark-academia" } },
          { where: { slug: "thriller" }, create: { name: "Thriller", slug: "thriller" } },
        ],
      },
      warningTags: {
        connect: [{ id: pickWarning("Violence").id }],
      },

      chapterCount: 1,
      chapters: {
        create: [
          {
            number: 1,
            title: "Prolog",
            status: ChapterStatus.PUBLISHED,
            publishedAt: new Date(),
            text: {
              create: {
                content:
                  "Selamat datang di Inkura.\n\nIni contoh konten NOVEL.\n\nCoba buka Studio → Work → New Chapter / Edit Chapter.",
              },
            },
          },
        ],
      },
    },
  });

  // Sample COMIC work
  const comicTitle = "Galaxy Rift (Demo Comic)";
  const comicSlug = `${slugify(comicTitle)}-${admin.id.slice(-6)}`;

  await prisma.work.upsert({
    where: { slug: comicSlug },
    update: {},
    create: {
      slug: comicSlug,
      title: comicTitle,
      description: "Contoh karya COMIC untuk demo upload pages + reader.",
      type: WorkType.COMIC,
      status: WorkStatus.PUBLISHED,
      coverImage: "/images/comic1.png",
      authorId: admin.id,

      language: "en",
      origin: WorkOrigin.ADAPTATION,
      completion: WorkCompletion.ONGOING,
      isMature: false,

      genres: {
        connect: [{ id: pickGenre("Action").id }, { id: pickGenre("Sci-Fi").id }, { id: pickGenre("Space").id }].filter(Boolean as any),
      },
      tags: {
        connectOrCreate: [
          { where: { slug: "space" }, create: { name: "Space", slug: "space" } },
          { where: { slug: "mecha" }, create: { name: "Mecha", slug: "mecha" } },
        ],
      },
      warningTags: {
        connect: [{ id: pickWarning("Violence").id }],
      },

      chapterCount: 1,
      chapters: {
        create: [
          {
            number: 1,
            title: "Chapter 1",
            status: ChapterStatus.PUBLISHED,
            pages: {
              create: [
                { order: 1, imageUrl: "/images/comic2.png" },
                { order: 2, imageUrl: "/images/comic3.png" },
              ],
            },
          },
        ],
      },
    },
  });

  // Optional sample mature work (hidden unless user opts-in)
  const matureTitle = "Night Bloom (Mature Demo)";
  const matureSlug = `${slugify(matureTitle)}-${admin.id.slice(-6)}`;

  await prisma.work.upsert({
    where: { slug: matureSlug },
    update: {},
    create: {
      slug: matureSlug,
      title: matureTitle,
      description: "Demo karya yang ditandai Mature + warning tags (untuk ngetes gating).",
      type: WorkType.NOVEL,
      status: WorkStatus.PUBLISHED,
      coverImage: "/images/novel2.png",
      authorId: admin.id,

      language: "en",
      origin: WorkOrigin.ORIGINAL,
      completion: WorkCompletion.ONGOING,
      isMature: true,

      genres: {
        connect: [{ id: pickGenre("Romance").id }, { id: pickGenre("Mature").id }, { id: pickGenre("Drama").id }],
      },
      warningTags: {
        connect: [{ id: pickWarning("Sexual Content").id }, { id: pickWarning("Nudity").id }],
      },

      chapterCount: 1,
      chapters: {
        create: [
          {
            number: 1,
            title: "Chapter 1",
            status: ChapterStatus.PUBLISHED,
            publishedAt: new Date(),
            isMature: true,
            warningTags: { connect: [{ id: pickWarning("Sexual Content").id }] },
            text: {
              create: {
                content: "Ini chapter demo Mature.\n\nKalau kamu belum opt-in di Settings, halaman ini bakal kegate.",
              },
            },
          },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log("- Admin user:", admin.email);
  console.log("- Novel:", novelTitle);
  console.log("- Comic:", comicTitle);
  console.log("- Mature:", matureTitle);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });