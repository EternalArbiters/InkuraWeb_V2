import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { getRequestPath } from "@/server/observability/api";
import { logWarn } from "@/server/observability/logger";
import { buildRateLimitIdentifier } from "./identify";
import { RATE_LIMIT_POLICIES, type RateLimitPolicyName } from "./policies";
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

const ephemeralCache = new Map<string, number>();
const ratelimiters = new Map<RateLimitPolicyName, Ratelimit>();

function getRatelimiter(policyName: RateLimitPolicyName) {
  const existing = ratelimiters.get(policyName);
  if (existing) return existing;

  const redis = getRedis();
  if (!redis) return null;

  const policy = RATE_LIMIT_POLICIES[policyName];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: `inkura:ratelimit:${policyName}`,
    analytics: true,
    ephemeralCache,
    timeout: 500,
  });

  ratelimiters.set(policyName, limiter);
  return limiter;
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

  const ratelimiter = getRatelimiter(args.policyName);
  if (!ratelimiter) return fallback;

  try {
    const result = await ratelimiter.limit(identifier);
    const decision: RateLimitDecision = {
      enabled: true,
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
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
