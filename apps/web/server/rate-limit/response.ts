import "server-only";

import { json } from "@/server/http/response";
import { enforceRateLimit, type RateLimitDecision } from "./enforce";
import type { RateLimitPolicyName } from "./policies";

function retryAfterSecondsFrom(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function tooManyRequestsFromRateLimit(result: RateLimitDecision) {
  const retryAfterSeconds = retryAfterSecondsFrom(result.reset);
  return json(
    {
      ok: false,
      error: "too_many_requests",
      message: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}

export async function enforceRateLimitOrResponse(args: {
  req: Request;
  policyName: RateLimitPolicyName;
  userId?: string | null;
}) {
  const result = await enforceRateLimit(args);
  if (!result.success) return tooManyRequestsFromRateLimit(result);
  return null;
}
