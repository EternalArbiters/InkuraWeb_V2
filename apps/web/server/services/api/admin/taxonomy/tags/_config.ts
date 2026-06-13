import "server-only";
import prisma from "@/server/db/prisma";
import type { TaxonomyConfig, TaxonomySortConfig } from "../_factory";

export const config: TaxonomyConfig = {
  entity: "Tag",
  tableQuoted: '"Tag"',
  nameMax: 60,
  slugMax: 80,
  listTake: 500,
  model: prisma.tag,
  txModel: (tx) => tx.tag,
};

export const sortConfig: TaxonomySortConfig = {
  countSelect: { works: true },
  getScore: (count) => count.works,
};
