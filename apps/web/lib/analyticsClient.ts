"use client";

import { ANALYTICS_COOKIE_NAME, ANALYTICS_SESSION_IDLE_MINUTES } from "@/server/analytics/event-types";

type ClientAnalyticsPayload = {
  eventType: string;
  path?: string;
  routeName?: string;
  workId?: string;
  chapterId?: string;
  ownerUserId?: string;
  workType?: string;
  publishType?: string;
  comicType?: string;
  workOrigin?: string;
  translationLanguage?: string;
  isMature?: boolean;
  isDeviantLove?: boolean;
  genreIds?: string[];
  searchQuery?: string;
  searchType?: string;
  resultCount?: number;
  metadata?: Record<string, unknown> | null;
};

const ENDPOINT = "/api/analytics/events";
const SESSION_SEEN_KEY = "inkura.analytics.lastSeenAt";

function canUseBeacon() {
  return typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
}

function sanitizeString(value: unknown, max = 240) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  return text.slice(0, max);
}

function sanitizePayload(input: ClientAnalyticsPayload) {
  return {
    eventType: sanitizeString(input.eventType, 64),
    path: sanitizeString(input.path ?? window.location.pathname, 500),
    routeName: sanitizeString(input.routeName, 160),
    workId: sanitizeString(input.workId, 64),
    chapterId: sanitizeString(input.chapterId, 64),
    ownerUserId: sanitizeString(input.ownerUserId, 64),
    workType: sanitizeString(input.workType, 32),
    publishType: sanitizeString(input.publishType, 32),
    comicType: sanitizeString(input.comicType, 32),
    workOrigin: sanitizeString(input.workOrigin, 32),
    translationLanguage: sanitizeString(input.translationLanguage, 32),
    isMature: typeof input.isMature === "boolean" ? input.isMature : undefined,
    isDeviantLove: typeof input.isDeviantLove === "boolean" ? input.isDeviantLove : undefined,
    genreIds: Array.isArray(input.genreIds) ? input.genreIds.map((entry) => sanitizeString(entry, 64)).filter(Boolean) as string[] : undefined,
    searchQuery: sanitizeString(input.searchQuery, 200),
    searchType: sanitizeString(input.searchType, 80),
    resultCount: typeof input.resultCount === "number" && Number.isFinite(input.resultCount) ? input.resultCount : undefined,
    metadata: input.metadata ?? undefined,
  };
}

export function sendAnalyticsEvent(input: ClientAnalyticsPayload) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(sanitizePayload(input));

  if (canUseBeacon()) {
    try {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      return;
    } catch {
      // fall through
    }
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "include",
  }).catch(() => null);
}

export function maybeSendSessionSeen(pathname: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const lastSeen = Number(window.localStorage.getItem(SESSION_SEEN_KEY) || "0");
  const thresholdMs = ANALYTICS_SESSION_IDLE_MINUTES * 60 * 1000;
  if (Number.isFinite(lastSeen) && now - lastSeen < thresholdMs) return;
  window.localStorage.setItem(SESSION_SEEN_KEY, String(now));
  sendAnalyticsEvent({ eventType: "SESSION_SEEN", path: pathname, routeName: "session" });
}

export function hasAnalyticsCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((chunk) => chunk.trim().startsWith(`${ANALYTICS_COOKIE_NAME}=`));
}
