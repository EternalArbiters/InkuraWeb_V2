import "server-only";

import { logInfo, logWarn } from "@/server/observability/logger";
import { getSlowQueryThresholdMs } from "@/server/observability/metrics";

export type ProfileProbeMeta = Record<string, unknown>;

function normalizeDuration(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export async function profileHotspot<T>(probe: string, meta: ProfileProbeMeta, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    const durationMs = normalizeDuration(Date.now() - startedAt);
    const payload = { probe, durationMs, ...meta };
    if (durationMs >= getSlowQueryThresholdMs()) {
      logWarn("db.profile_probe", payload);
    } else if (process.env.INKURA_PROFILE_HOTSPOTS === "1") {
      logInfo("db.profile_probe", payload);
    }
  }
}
