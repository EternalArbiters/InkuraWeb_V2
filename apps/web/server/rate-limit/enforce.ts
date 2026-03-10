import "server-only";

import { getRequestPath } from "@/server/observability/api";
import { logWarn } from "@/server/observability/logger";
import { buildRateLimitIdentifier } from "./identify";
import { RATE_LIMIT_POLICIES, type RateLimitPolicyName, type RateLimitWindow } from "./policies";
import { getRedis } from "./redis";

export type RateLimitDecision = {
  enabled: boolean;
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  policyName: RateLimitPolicyName;
  identifier: string;
};

function windowToMs(window: RateLimitWindow) {
  const [valueRaw, unit] = window.split(" ") as [string, "s" | "m" | "h"];
  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value <= 0) return 60_000;
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60_000;
  return value * 3_600_000;
}

export async function enforceRateLimit(args: {
  req: Request;
  policyName: RateLimitPolicyName;
  userId?: string | null;
}): Promise<RateLimitDecision> {
  const policy = RATE_LIMIT_POLICIES[args.policyName];
  const identifier = buildRateLimitIdentifier({
    req: args.req,
    policyName: args.policyName,
    mode: policy.identifier,
    userId: args.userId,
  });

  const fallback: RateLimitDecision = {
    enabled: false,
    success: true,
    limit: policy.limit,
    remaining: policy.limit,
    reset: Date.now(),
    policyName: args.policyName,
    identifier,
  };

  const redis = getRedis() as any;
  if (!redis) return fallback;

  const windowMs = windowToMs(policy.window);
  const now = Date.now();
  const bucketStart = Math.floor(now / windowMs) * windowMs;
  const reset = bucketStart + windowMs;
  const redisKey = `inkura:ratelimit:${identifier}:${bucketStart}`;

  try {
    const current = Number(await redis.incr(redisKey));
    if (current === 1) {
      await redis.expire(redisKey, Math.max(1, Math.ceil(windowMs / 1000) + 5));
    }

    const decision: RateLimitDecision = {
      enabled: true,
      success: current <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - current),
      reset,
      policyName: args.policyName,
      identifier,
    };

    if (!decision.success) {
      logWarn("rate_limit.blocked", {
        policy: args.policyName,
        identifier,
        userId: args.userId ?? null,
        path: getRequestPath(args.req),
        method: args.req.method || "GET",
        reset: decision.reset,
        remaining: decision.remaining,
      });
    }

    return decision;
  } catch (error) {
    logWarn("rate_limit.error", {
      policy: args.policyName,
      identifier,
      userId: args.userId ?? null,
      path: getRequestPath(args.req),
      method: args.req.method || "GET",
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}
