import "server-only";

import { Redis } from "@upstash/redis";
import { logWarn } from "@/server/observability/logger";

let redisSingleton: Redis | null = null;
let missingConfigWarned = false;

export function hasRateLimitConfig() {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

export function getRedis() {
  if (!hasRateLimitConfig()) {
    if (!missingConfigWarned) {
      missingConfigWarned = true;
      logWarn("rate_limit.disabled_missing_env", {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return null;
  }

  if (!redisSingleton) {
    redisSingleton = Redis.fromEnv();
  }

  return redisSingleton;
}
