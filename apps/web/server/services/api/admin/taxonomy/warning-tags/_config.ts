import "server-only";
import prisma from "@/server/db/prisma";
import type { TaxonomyConfig, TaxonomySortConfig } from "../_factory";

export const config: TaxonomyConfig = {
  entity: "WarningTag",
  tableQuoted: '"WarningTag"',
  nameMax: 80,
  slugMax: 100,
  listTake: 800,
  model: prisma.warningTag,
  txModel: (tx) => tx.warningTag,
};

export const sortConfig: TaxonomySortConfig = {
  countSelect: { works: true, chapters: true },
  getScore: (count) => (count.works ?? 0) + (count.chapters ?? 0),
};
