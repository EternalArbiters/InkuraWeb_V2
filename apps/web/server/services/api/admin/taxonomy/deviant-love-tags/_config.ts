import "server-only";
import prisma from "@/server/db/prisma";
import type { TaxonomyConfig, TaxonomySortConfig } from "../_factory";

export const config: TaxonomyConfig = {
  entity: "DeviantLoveTag",
  tableQuoted: '"DeviantLoveTag"',
  nameMax: 80,
  slugMax: 100,
  listTake: 800,
  model: prisma.deviantLoveTag,
  txModel: (tx) => tx.deviantLoveTag,
};

export const sortConfig: TaxonomySortConfig = {
  countSelect: { works: true },
  getScore: (count) => count.works,
};
