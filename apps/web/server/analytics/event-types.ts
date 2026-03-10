import type { AnalyticsEventType } from "@prisma/client";

export const ANALYTICS_COOKIE_NAME = "inkura_analytics_session";
export const ANALYTICS_SESSION_IDLE_MINUTES = 30;

export const CLIENT_TRACKABLE_EVENTS = new Set<AnalyticsEventType>([
  "SESSION_SEEN",
  "PAGE_VIEW",
  "WORK_VIEW",
  "CHAPTER_VIEW",
  "SEARCH_SUBMIT",
  "SEARCH_RESULT_CLICK",
]);
