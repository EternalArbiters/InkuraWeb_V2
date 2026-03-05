import prisma from "../server/db/prisma";

function byName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

async function reorderModel(model: "genre" | "tag" | "warningTag" | "deviantLoveTag") {
  const rows = await (prisma as any)[model].findMany({
    select: { id: true, name: true },
  });

  rows.sort(byName);

  // Use gaps so future inserts can be placed between without a full reorder.
  const updates = rows.map((r: any, idx: number) =>
    (prisma as any)[model].update({
      where: { id: r.id },
      data: { sortOrder: idx * 10 },
    })
  );

  // Chunk to avoid huge transactions
  const chunkSize = 200;
  for (let i = 0; i < updates.length; i += chunkSize) {
    await prisma.$transaction(updates.slice(i, i + chunkSize));
  }

  return rows.length;
}

async function main() {
  const g = await reorderModel("genre");
  const t = await reorderModel("tag");
  const w = await reorderModel("warningTag");
  const d = await reorderModel("deviantLoveTag");

  console.log("Reordered taxonomy alphabetically:");
  console.log({ genres: g, tags: t, warningTags: w, deviantLoveTags: d });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
