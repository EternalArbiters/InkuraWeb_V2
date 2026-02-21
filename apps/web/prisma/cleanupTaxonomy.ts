import { Prisma, PrismaClient } from "@prisma/client";
import { uniqueWarningCatalog, slugifyTag } from "../lib/warningCatalog";
import { uniqueDeviantLoveCatalog } from "../lib/deviantLoveCatalog";

// One-time data cleanup:
// - Move legacy Genre slugs that are now NSFW into WarningTag (work + blocked prefs)
// - Move legacy Genre slugs that are now Deviant Love into DeviantLoveTag (work + blocked prefs)
// - Remove legacy Genre slugs (Comic / Light Novel / LGBTQ umbrella, etc.) from works + user blocks
// - Optionally delete the legacy Genre rows if no longer referenced
//
// Usage:
//   npm run db:cleanup-taxonomy
//   npm run db:cleanup-taxonomy -- --dry-run

const prisma = new PrismaClient();

function slugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type MapKind = "warning" | "deviant" | "delete";
type Mapping = {
  kind: MapKind;
  // legacy Genre.slug values to look for
  legacyGenreSlugs: string[];
  // target canonical tag name (WarningTag / DeviantLoveTag)
  targetName?: string;
};

// Canonical targets
const WARNING_TARGETS = {
  Abuse: "Abuse",
  Alcohol: "Alcohol",
  DomesticViolence: "Domestic Violence",
  DrugUse: "Drug Use",
  Fetish: "Fetish",
  Gore: "Gore",
  GraphicViolence: "Graphic Violence",
  Harassment: "Harassment",
  NonConsensual: "Non-Consensual",
  BDSM: "SM/BDSM/SUB-DOM",
  SelfHarm: "Self-Harm",
} as const;

const DEVIANT_TARGETS = {
  YuriGL: "Yuri (GL)",
  YaoiBL: "Yaoi (BL)",
  ShoujoAi: "Shoujo Ai (GL Bait)",
  ShounenAi: "Shounen Ai (BL Bait)",
  Omegaverse: "Omegaverse",
  Futanari: "Futanari",
  Incest: "Incest",
} as const;

const MAPPINGS: Mapping[] = [
  // --- Legacy Genre -> WarningTag (NSFW gate) ---
  {
    kind: "warning",
    targetName: WARNING_TARGETS.Abuse,
    legacyGenreSlugs: ["abuse"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.Alcohol,
    legacyGenreSlugs: ["alcohol", "alcohol-use"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.DomesticViolence,
    legacyGenreSlugs: ["domestic-violence", "domestic-abuse"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.DrugUse,
    legacyGenreSlugs: ["drug-use", "drug", "drugs"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.Fetish,
    legacyGenreSlugs: ["fetish", "kink"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.Gore,
    legacyGenreSlugs: ["gore"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.GraphicViolence,
    legacyGenreSlugs: ["graphic-violence"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.Harassment,
    legacyGenreSlugs: ["harassment"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.NonConsensual,
    legacyGenreSlugs: ["non-consensual", "non-consent", "rape"],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.BDSM,
    legacyGenreSlugs: [
      "sm-bdsm-sub-dom",
      "bdsm",
      "sub-dom",
      "dom-sub",
      "s-m",
      "sadomasochism",
    ],
  },
  {
    kind: "warning",
    targetName: WARNING_TARGETS.SelfHarm,
    legacyGenreSlugs: ["self-harm", "selfharm"],
  },

  // --- Legacy Genre -> Deviant Love ---
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.YuriGL,
    legacyGenreSlugs: ["yuri", "gl", "girls-love", "girlslove", "yuri-gl"],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.YaoiBL,
    legacyGenreSlugs: [
      "yaoi",
      "bl",
      "boys-love",
      "boyslove",
      "yaoi-bl",
      // user requested: Bara -> BL/Yaoi
      "bara",
      "bara-ml",
      "ml",
    ],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.ShoujoAi,
    legacyGenreSlugs: ["shoujo-ai", "shojo-ai", "shoujoai", "shoujo-ai-gl-bait"],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.ShounenAi,
    legacyGenreSlugs: ["shounen-ai", "shonen-ai", "shounenai", "shounen-ai-bl-bait"],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.Omegaverse,
    legacyGenreSlugs: [
      "omegaverse",
      // user requested: Alpha/Beta/Omega -> Omegaverse
      "alpha-beta-omega",
      "alpha-beta-omega-aob",
      "alpha-beta-omega-abo",
      "a-b-o",
      "abo",
      "aob",
    ],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.Futanari,
    legacyGenreSlugs: ["futanari"],
  },
  {
    kind: "deviant",
    targetName: DEVIANT_TARGETS.Incest,
    legacyGenreSlugs: ["incest"],
  },

  // --- Legacy Genre to delete (not mapped) ---
  {
    kind: "delete",
    legacyGenreSlugs: [
      // user requested: remove (category exists elsewhere)
      "comic",
      "comics",
      "light-novel",
      "lightnovel",
      // umbrella tag requested to be removed
      "lgbt",
      "lgbtq",
      "lgbtq-plus",
      "lgbtq+",
    ],
  },
];

async function ensureWarningTagIdByName(name: string) {
  const slug = slugifyTag(name);
  const tag = await prisma.warningTag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  return tag.id;
}

async function ensureDeviantTagIdByName(name: string) {
  const slug = slugify(name);
  const tag = await prisma.deviantLoveTag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  return tag.id;
}

async function countLinks(table: "_WorkGenres" | "_UserBlockedGenres", genreId: string) {
  const rows =
    table === "_WorkGenres"
      ? await prisma.$queryRaw<{ c: bigint }[]>(
          Prisma.sql`SELECT COUNT(*)::bigint as c FROM "_WorkGenres" WHERE "A" = ${genreId}`
        )
      : await prisma.$queryRaw<{ c: bigint }[]>(
          Prisma.sql`SELECT COUNT(*)::bigint as c FROM "_UserBlockedGenres" WHERE "A" = ${genreId}`
        );
  return Number(rows?.[0]?.c ?? 0);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--dry");

  console.log("\n[cleanupTaxonomy] starting", { dryRun });

  // Ensure canonical tags exist (idempotent)
  // - warnings: include full warning catalog because DBs may be empty
  for (const name of uniqueWarningCatalog()) {
    await ensureWarningTagIdByName(name);
  }
  for (const name of uniqueDeviantLoveCatalog()) {
    await ensureDeviantTagIdByName(name);
  }

  // Resolve target IDs
  const warningIdByName = new Map<string, string>();
  for (const n of Object.values(WARNING_TARGETS)) {
    warningIdByName.set(n, await ensureWarningTagIdByName(n));
  }
  const deviantIdByName = new Map<string, string>();
  for (const n of Object.values(DEVIANT_TARGETS)) {
    deviantIdByName.set(n, await ensureDeviantTagIdByName(n));
  }

  // Flatten mappings into per-legacy-slug operations so we can process each Genre row once.
  const opByLegacySlug = new Map<string, { kind: MapKind; targetId?: string }>();
  for (const m of MAPPINGS) {
    const targetId =
      m.kind === "warning" && m.targetName
        ? warningIdByName.get(m.targetName)
        : m.kind === "deviant" && m.targetName
          ? deviantIdByName.get(m.targetName)
          : undefined;
    for (const slug of m.legacyGenreSlugs) {
      opByLegacySlug.set(slugify(slug), { kind: m.kind, targetId });
    }
  }

  let totalWorkLinksTouched = 0;
  let totalUserLinksTouched = 0;
  let totalGenresDeleted = 0;
  let totalGenresProcessed = 0;

  for (const [legacySlug, op] of opByLegacySlug.entries()) {
    const genre = await prisma.genre.findUnique({ where: { slug: legacySlug } });
    if (!genre) continue;

    const workLinks = await countLinks("_WorkGenres", genre.id);
    const userLinks = await countLinks("_UserBlockedGenres", genre.id);

    if (workLinks === 0 && userLinks === 0) {
      // Nothing references this legacy genre: delete it (unless dry run)
      console.log(`- [skip links] genre ${legacySlug} (${genre.id}) has no links; deleting row`);
      totalGenresProcessed++;
      if (!dryRun) {
        await prisma.genre.delete({ where: { id: genre.id } });
      }
      totalGenresDeleted++;
      continue;
    }

    totalGenresProcessed++;
    totalWorkLinksTouched += workLinks;
    totalUserLinksTouched += userLinks;

    console.log(
      `- [process] ${legacySlug} (${genre.id}) kind=${op.kind} workLinks=${workLinks} userLinks=${userLinks}`
    );

    if (dryRun) continue;

    await prisma.$transaction(async (tx) => {
      if (op.kind === "warning") {
        const warningId = op.targetId;
        if (!warningId) return;

        // Move work relations
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "_WorkWarnings" ("A", "B")
            SELECT ${warningId}::text, wg."B"
            FROM "_WorkGenres" wg
            WHERE wg."A" = ${genre.id}
            ON CONFLICT DO NOTHING;
          `
        );
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "_WorkGenres" WHERE "A" = ${genre.id};`
        );

        // Move user blocked prefs
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "_UserBlockedWarnings" ("A", "B")
            SELECT ${warningId}::text, ubg."B"
            FROM "_UserBlockedGenres" ubg
            WHERE ubg."A" = ${genre.id}
            ON CONFLICT DO NOTHING;
          `
        );
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "_UserBlockedGenres" WHERE "A" = ${genre.id};`
        );
      } else if (op.kind === "deviant") {
        const deviantId = op.targetId;
        if (!deviantId) return;

        // Move work relations
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "_WorkDeviantLove" ("A", "B")
            SELECT ${deviantId}::text, wg."B"
            FROM "_WorkGenres" wg
            WHERE wg."A" = ${genre.id}
            ON CONFLICT DO NOTHING;
          `
        );
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "_WorkGenres" WHERE "A" = ${genre.id};`
        );

        // Move user blocked prefs
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "_UserBlockedDeviantLove" ("A", "B")
            SELECT ${deviantId}::text, ubg."B"
            FROM "_UserBlockedGenres" ubg
            WHERE ubg."A" = ${genre.id}
            ON CONFLICT DO NOTHING;
          `
        );
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "_UserBlockedGenres" WHERE "A" = ${genre.id};`
        );
      } else {
        // delete-only
        await tx.$executeRaw(Prisma.sql`DELETE FROM "_WorkGenres" WHERE "A" = ${genre.id};`);
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "_UserBlockedGenres" WHERE "A" = ${genre.id};`
        );
      }
    });

    // Delete the legacy Genre row if it's now unused
    const remainingWorkLinks = await countLinks("_WorkGenres", genre.id);
    const remainingUserLinks = await countLinks("_UserBlockedGenres", genre.id);
    if (remainingWorkLinks === 0 && remainingUserLinks === 0) {
      await prisma.genre.delete({ where: { id: genre.id } });
      totalGenresDeleted++;
    }
  }

  console.log("\n[cleanupTaxonomy] done", {
    dryRun,
    totalGenresProcessed,
    totalWorkLinksTouched,
    totalUserLinksTouched,
    totalGenresDeleted,
  });
}

main()
  .catch((e) => {
    console.error("[cleanupTaxonomy] error", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
