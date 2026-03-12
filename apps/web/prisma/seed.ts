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
import { uniqueDeviantLoveCatalog } from "../lib/deviantLoveCatalog";

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
    // v14: single admin email
    where: { email: "noelephgoddess.game@gmail.com" },
    update: {
      adultConfirmed: true,
      preferredLanguagesJson: JSON.stringify(["id", "en"]),
    },
    create: {
      name: "Inkura Admin",
      username: "noel",
      email: "noelephgoddess.game@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
      image: "/images/default-avatar.png",
      adultConfirmed: true,
      preferredLanguagesJson: JSON.stringify(["id", "en"]),
    },
  });

  // --- Taxonomy seed ---
  // V15: taxonomy seed is additive and must NOT override admin changes.
  // - We create missing system items with sortOrder.
  // - We DO NOT re-activate or rename existing rows.
  const genreNames = uniqueGenreCatalog().slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const genres = await Promise.all(
    genreNames.map((name, idx) => {
      const slug = slugify(name);
      return prisma.genre.upsert({
        where: { slug },
        update: { isSystem: true },
        create: { name, slug, isSystem: true, isActive: true, sortOrder: idx * 10 },
      });
    })
  );

  const warningNames = uniqueWarningCatalog().slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const warnings = await Promise.all(
    warningNames.map((name, idx) => {
      const slug = slugify(name);
      return prisma.warningTag.upsert({
        where: { slug },
        update: { isSystem: true },
        create: { name, slug, isSystem: true, isActive: true, sortOrder: idx * 10 },
      });
    })
  );

  const deviantNames = uniqueDeviantLoveCatalog().slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const deviantLoveTags = await Promise.all(
    deviantNames.map((name, idx) => {
      const slug = slugify(name);
      return prisma.deviantLoveTag.upsert({
        where: { slug },
        update: { isSystem: true },
        create: { name, slug, isSystem: true, isActive: true, sortOrder: idx * 10 },
      });
    })
  );

  // Backfill sortOrder for existing rows that still have the default 0.
  // This keeps ordering stable without overriding admin re-orders (non-zero values are preserved).
  for (let i = 0; i < genreNames.length; i++) {
    const slug = slugify(genreNames[i]);
    await prisma.genre.updateMany({
      where: { slug, sortOrder: 0 },
      data: { sortOrder: i * 10, isSystem: true },
    });
  }
  for (let i = 0; i < warningNames.length; i++) {
    const slug = slugify(warningNames[i]);
    await prisma.warningTag.updateMany({
      where: { slug, sortOrder: 0 },
      data: { sortOrder: i * 10, isSystem: true },
    });
  }
  for (let i = 0; i < deviantNames.length; i++) {
    const slug = slugify(deviantNames[i]);
    await prisma.deviantLoveTag.updateMany({
      where: { slug, sortOrder: 0 },
      data: { sortOrder: i * 10, isSystem: true },
    });
  }

  const pickGenre = (name: string) => genres.find((g) => g.slug === slugify(name))!;
  const pickWarning = (name: string) => warnings.find((w) => w.slug === slugify(name))!;
  const pickDeviant = (name: string) => deviantLoveTags.find((d) => d.slug === slugify(name))!;

  // Sample NOVEL work
  const novelTitle = "Benara: Dosa Besar InSys Lab";
  const novelSlug = `${slugify(novelTitle)}-${admin.id.slice(-6)}`;

  const novel = await prisma.work.upsert({
    where: { slug: novelSlug },
    update: {},
    create: {
      slug: novelSlug,
      title: novelTitle,
      description: "Sample NOVEL work for the reader + studio demo (v8 taxonomy + warning).",
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
                  "Welcome to Inkura.\n\nThis is sample NOVEL content.\n\nTry opening Studio → Work → New Chapter / Edit Chapter.",
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
      description: "Sample COMIC work for the upload-pages + reader demo.",
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
      description: "Demo work marked as Mature + warning tags (for gating tests).",
      type: WorkType.NOVEL,
      status: WorkStatus.PUBLISHED,
      coverImage: "/images/novel2.png",
      authorId: admin.id,

      language: "en",
      origin: WorkOrigin.ORIGINAL,
      completion: WorkCompletion.ONGOING,
      isMature: true,

      genres: {
        // "Mature" is now treated as an NSFW tag (warningTag) so it can be age-locked.
        connect: [{ id: pickGenre("Romance").id }, { id: pickGenre("Drama").id }],
      },
      warningTags: {
        connect: [{ id: pickWarning("NSFW").id }, { id: pickWarning("Sexual Content").id }, { id: pickWarning("Nudity").id }],
      },

      // Example: no deviant love tags here.

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
                content: "This is a Mature demo chapter.\n\nIf you have not opted in under Settings, this page will be gated.",
              },
            },
          },
        ],
      },
    },
  });

  // Optional sample Deviant Love work (hidden unless user opts-in Deviant Love)
  const deviantTitle = "Forbidden Knot (Deviant Love Demo)";
  const deviantSlug = `${slugify(deviantTitle)}-${admin.id.slice(-6)}`;

  await prisma.work.upsert({
    where: { slug: deviantSlug },
    update: {},
    create: {
      slug: deviantSlug,
      title: deviantTitle,
      description: "Demo work marked with Deviant Love tags (for gating tests).",
      type: WorkType.NOVEL,
      status: WorkStatus.PUBLISHED,
      coverImage: "/images/novel3.png",
      authorId: admin.id,

      language: "en",
      origin: WorkOrigin.ORIGINAL,
      completion: WorkCompletion.ONGOING,
      isMature: true,

      genres: {
        connect: [{ id: pickGenre("Romance").id }, { id: pickGenre("Drama").id }],
      },
      warningTags: {
        connect: [{ id: pickWarning("NSFW").id }, { id: pickWarning("Mature").id }],
      },
      deviantLoveTags: {
        connect: [{ id: pickDeviant("Omegaverse").id }],
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
            text: {
              create: {
                content:
                  "This is a Deviant Love demo chapter.\n\nIf you have not unlocked it in Settings, this page will be gated.",
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