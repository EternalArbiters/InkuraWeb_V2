import "server-only";

import { randomUUID, createHash } from "crypto";
import { AnalyticsDeviceType } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { ANALYTICS_COOKIE_NAME } from "./event-types";

function parseCookieHeader(req?: Request | null) {
  const cookieHeader = req?.headers.get("cookie") || "";
  const out = new Map<string, string>();
  for (const chunk of cookieHeader.split(";")) {
    const [rawKey, ...rest] = chunk.split("=");
    const key = rawKey?.trim();
    if (!key) continue;
    out.set(key, decodeURIComponent(rest.join("=").trim()));
  }
  return out;
}

export function getAnalyticsSessionKeyFromRequest(req?: Request | null) {
  return parseCookieHeader(req).get(ANALYTICS_COOKIE_NAME) || null;
}

export function createAnalyticsSessionKey() {
  return randomUUID();
}

export function hashValue(value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

export function getRequestIp(req?: Request | null) {
  if (!req) return null;
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export function getRequestCountryCode(req?: Request | null) {
  if (!req) return null;
  const value =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    "";
  const normalized = value.trim().toUpperCase();
  return normalized || null;
}

export function detectDeviceType(userAgent?: string | null): AnalyticsDeviceType {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return AnalyticsDeviceType.UNKNOWN;
  if (/bot|crawler|spider|preview/.test(ua)) return AnalyticsDeviceType.BOT;
  if (/ipad|tablet/.test(ua)) return AnalyticsDeviceType.TABLET;
  if (/mobile|iphone|android/.test(ua)) return AnalyticsDeviceType.MOBILE;
  return AnalyticsDeviceType.DESKTOP;
}

export async function ensureAnalyticsSession(args: {
  req?: Request | null;
  userId?: string | null;
  sessionKey?: string | null;
}) {
  const req = args.req;
  const sessionKey = args.sessionKey || getAnalyticsSessionKeyFromRequest(req) || createAnalyticsSessionKey();
  const userAgent = req?.headers.get("user-agent") || null;
  const ipHash = hashValue(getRequestIp(req));
  const userAgentHash = hashValue(userAgent);
  const countryCode = getRequestCountryCode(req);
  const deviceType = detectDeviceType(userAgent);

  const session = await prisma.analyticsSession.upsert({
    where: { sessionKey },
    update: {
      lastSeenAt: new Date(),
      userId: args.userId ?? undefined,
      ipHash: ipHash ?? undefined,
      userAgentHash: userAgentHash ?? undefined,
      countryCode: countryCode ?? undefined,
      deviceType,
    },
    create: {
      sessionKey,
      userId: args.userId ?? null,
      ipHash,
      userAgentHash,
      countryCode,
      deviceType,
    },
    select: { id: true, sessionKey: true },
  });

  return {
    sessionId: session.id,
    sessionKey: session.sessionKey,
    ipHash,
    userAgentHash,
    countryCode,
    deviceType,
  };
}
