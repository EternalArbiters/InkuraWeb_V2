import "server-only";

import { AnalyticsEventType } from "@prisma/client";
import { getSession } from "@/server/auth/session";
import { apiRoute, badRequest, json, readJsonObject } from "@/server/http";
import { ANALYTICS_COOKIE_NAME, CLIENT_TRACKABLE_EVENTS } from "@/server/analytics/event-types";
import { getAnalyticsSessionKeyFromRequest, createAnalyticsSessionKey } from "@/server/analytics/session";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

function asString(value: unknown, max = 240) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

export const POST = apiRoute(async (req) => {
  const body = await readJsonObject(req);
  const eventTypeRaw = asString(body.eventType, 64);
  if (!eventTypeRaw || !Object.values(AnalyticsEventType).includes(eventTypeRaw as AnalyticsEventType)) {
    return badRequest("Valid eventType is required");
  }

  const eventType = eventTypeRaw as AnalyticsEventType;
  if (!CLIENT_TRACKABLE_EVENTS.has(eventType)) {
    return badRequest("This event type is not allowed from the client");
  }

  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  const existingSessionKey = getAnalyticsSessionKeyFromRequest(req);
  const sessionKey = existingSessionKey || createAnalyticsSessionKey();

  await trackAnalyticsEventSafe({
    req,
    eventType,
    userId: userId || null,
    sessionKey,
    path: asString(body.path, 500) || undefined,
    routeName: asString(body.routeName, 160) || undefined,
    workId: asString(body.workId, 64) || undefined,
    chapterId: asString(body.chapterId, 64) || undefined,
    ownerUserId: asString(body.ownerUserId, 64) || undefined,
    workType: asString(body.workType, 32) as any,
    publishType: asString(body.publishType, 32) as any,
    comicType: asString(body.comicType, 32),
    workOrigin: asString(body.workOrigin, 32),
    translationLanguage: asString(body.translationLanguage, 32),
    isMature: typeof body.isMature === "boolean" ? body.isMature : undefined,
    isDeviantLove: typeof body.isDeviantLove === "boolean" ? body.isDeviantLove : undefined,
    genreIds: Array.isArray(body.genreIds) ? body.genreIds.map((entry) => String(entry).trim()).filter(Boolean).slice(0, 16) : undefined,
    searchQuery: asString(body.searchQuery, 200) || undefined,
    searchType: asString(body.searchType, 80) || undefined,
    resultCount: typeof body.resultCount === "number" && Number.isFinite(body.resultCount) ? body.resultCount : undefined,
    metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : undefined,
  });

  const response = json({ ok: true });
  if (!existingSessionKey) {
    response.headers.set(
      "Set-Cookie",
      `${ANALYTICS_COOKIE_NAME}=${sessionKey}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );
  }
  return response;
});
