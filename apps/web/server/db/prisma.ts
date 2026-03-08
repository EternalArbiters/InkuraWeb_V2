import "server-only";

import { Prisma, PrismaClient } from "@prisma/client";
import { getSlowQueryThresholdMs, logPrismaQueryMetric } from "@/server/observability/metrics";

type InkuraPrismaClient = PrismaClient<Prisma.PrismaClientOptions, "query">;

declare global {
  // eslint-disable-next-line no-var
  var prisma: InkuraPrismaClient | undefined;
  var inkuraPrismaQueryLoggingAttached: boolean | undefined;
}

// Prisma singleton (prevents exhausting connections in dev / hot-reload).
const prisma: InkuraPrismaClient = global.prisma || new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

if (!global.inkuraPrismaQueryLoggingAttached) {
  prisma.$on("query", (event: Prisma.QueryEvent) => {
    const durationMs = Number(event.duration || 0);
    if (durationMs < getSlowQueryThresholdMs() && process.env.INKURA_LOG_QUERIES !== "1") return;

    const queryPreview = event.query.replace(/\s+/g, " ").trim().slice(0, 240);
    logPrismaQueryMetric({
      durationMs,
      target: event.target,
      queryPreview,
      paramsBytes: typeof event.params === "string" ? event.params.length : 0,
    });
  });
  global.inkuraPrismaQueryLoggingAttached = true;
}

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
