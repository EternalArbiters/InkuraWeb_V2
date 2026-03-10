import "server-only";

import type { RateLimitIdentifierMode } from "./policies";

export function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

export function buildRateLimitIdentifier(args: {
  req: Request;
  policyName: string;
  mode: RateLimitIdentifierMode;
  userId?: string | null;
}) {
  const ip = getRequestIp(args.req);
  const userId = args.userId ?? null;

  switch (args.mode) {
    case "ip":
      return `${args.policyName}:ip:${ip}`;
    case "user":
      return `${args.policyName}:user:${userId ?? "anon"}`;
    case "user_or_ip":
      return userId ? `${args.policyName}:user:${userId}` : `${args.policyName}:ip:${ip}`;
    case "user_and_ip":
      return `${args.policyName}:user:${userId ?? "anon"}:ip:${ip}`;
    default:
      return `${args.policyName}:ip:${ip}`;
  }
}
