DO $$ BEGIN
  CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsDeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'BOT', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsEventType" AS ENUM (
    'SESSION_SEEN',
    'PAGE_VIEW',
    'WORK_VIEW',
    'CHAPTER_VIEW',
    'BOOKMARK_ADD',
    'BOOKMARK_REMOVE',
    'WORK_LIKE',
    'CHAPTER_LIKE',
    'COMMENT_CREATE',
    'RATING_SUBMIT',
    'FOLLOW_USER',
    'SEARCH_SUBMIT',
    'SEARCH_RESULT_CLICK',
    'SIGNUP_COMPLETE',
    'LOGIN_SUCCESS',
    'PROFILE_ONBOARDING_COMPLETE',
    'WORK_PUBLISH',
    'CHAPTER_PUBLISH',
    'REPORT_CREATE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsTrafficSource" AS ENUM ('DIRECT', 'INTERNAL', 'SEARCH', 'SOCIAL', 'EXTERNAL', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsAgeBand" AS ENUM ('UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_PLUS', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" "UserGender";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthMonth" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthYear" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "analyticsOnboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "demographicsUpdatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AnalyticsSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionKey" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "countryCode" TEXT,
  "deviceType" "AnalyticsDeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsSession_sessionKey_key" ON "AnalyticsSession"("sessionKey");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_userId_lastSeenAt_idx" ON "AnalyticsSession"("userId", "lastSeenAt");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_lastSeenAt_idx" ON "AnalyticsSession"("lastSeenAt");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_countryCode_lastSeenAt_idx" ON "AnalyticsSession"("countryCode", "lastSeenAt");
CREATE INDEX IF NOT EXISTS "AnalyticsSession_deviceType_lastSeenAt_idx" ON "AnalyticsSession"("deviceType", "lastSeenAt");

CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventType" "AnalyticsEventType" NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "sessionKey" TEXT,
  "isAuthenticated" BOOLEAN NOT NULL DEFAULT false,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "countryCode" TEXT,
  "deviceType" "AnalyticsDeviceType" NOT NULL DEFAULT 'UNKNOWN',
  "path" TEXT,
  "routeName" TEXT,
  "referrer" TEXT,
  "trafficSource" "AnalyticsTrafficSource" NOT NULL DEFAULT 'UNKNOWN',
  "workId" TEXT,
  "chapterId" TEXT,
  "genreId" TEXT,
  "actorUserId" TEXT,
  "ownerUserId" TEXT,
  "workType" "WorkType",
  "publishType" "WorkPublishType",
  "comicType" "ComicType",
  "workOrigin" "WorkOrigin",
  "translationLanguage" TEXT,
  "isMature" BOOLEAN,
  "isDeviantLove" BOOLEAN,
  "searchQuery" TEXT,
  "searchType" TEXT,
  "resultCount" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_occurredAt_idx" ON "AnalyticsEvent"("eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_occurredAt_idx" ON "AnalyticsEvent"("sessionId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_workId_occurredAt_idx" ON "AnalyticsEvent"("workId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_chapterId_occurredAt_idx" ON "AnalyticsEvent"("chapterId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_genreId_occurredAt_idx" ON "AnalyticsEvent"("genreId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_ownerUserId_occurredAt_idx" ON "AnalyticsEvent"("ownerUserId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_searchQuery_occurredAt_idx" ON "AnalyticsEvent"("searchQuery", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_workId_occurredAt_idx" ON "AnalyticsEvent"("eventType", "workId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_chapterId_occurredAt_idx" ON "AnalyticsEvent"("eventType", "chapterId", "occurredAt");

CREATE TABLE IF NOT EXISTS "AnalyticsDailyOverview" (
  "date" TIMESTAMP(3) NOT NULL,
  "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
  "activeUsers" INTEGER NOT NULL DEFAULT 0,
  "guestVisitors" INTEGER NOT NULL DEFAULT 0,
  "newUsers" INTEGER NOT NULL DEFAULT 0,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "workViews" INTEGER NOT NULL DEFAULT 0,
  "chapterViews" INTEGER NOT NULL DEFAULT 0,
  "bookmarkAdds" INTEGER NOT NULL DEFAULT 0,
  "bookmarkRemoves" INTEGER NOT NULL DEFAULT 0,
  "workLikes" INTEGER NOT NULL DEFAULT 0,
  "chapterLikes" INTEGER NOT NULL DEFAULT 0,
  "commentsCreated" INTEGER NOT NULL DEFAULT 0,
  "ratingsSubmitted" INTEGER NOT NULL DEFAULT 0,
  "followsCreated" INTEGER NOT NULL DEFAULT 0,
  "searches" INTEGER NOT NULL DEFAULT 0,
  "reportsCreated" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyOverview_pkey" PRIMARY KEY ("date")
);

CREATE TABLE IF NOT EXISTS "AnalyticsDailyGenre" (
  "date" TIMESTAMP(3) NOT NULL,
  "genreId" TEXT NOT NULL,
  "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
  "workViews" INTEGER NOT NULL DEFAULT 0,
  "chapterViews" INTEGER NOT NULL DEFAULT 0,
  "bookmarkAdds" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "ratingsCount" INTEGER NOT NULL DEFAULT 0,
  "ratingSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyGenre_pkey" PRIMARY KEY ("date", "genreId")
);
CREATE INDEX IF NOT EXISTS "AnalyticsDailyGenre_genreId_date_idx" ON "AnalyticsDailyGenre"("genreId", "date");

CREATE TABLE IF NOT EXISTS "AnalyticsDailyWork" (
  "date" TIMESTAMP(3) NOT NULL,
  "workId" TEXT NOT NULL,
  "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "chapterViews" INTEGER NOT NULL DEFAULT 0,
  "bookmarkAdds" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "ratingsCount" INTEGER NOT NULL DEFAULT 0,
  "ratingSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyWork_pkey" PRIMARY KEY ("date", "workId")
);
CREATE INDEX IF NOT EXISTS "AnalyticsDailyWork_workId_date_idx" ON "AnalyticsDailyWork"("workId", "date");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyWork_date_views_idx" ON "AnalyticsDailyWork"("date", "views");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyWork_date_uniqueViewers_idx" ON "AnalyticsDailyWork"("date", "uniqueViewers");

CREATE TABLE IF NOT EXISTS "AnalyticsDailyChapter" (
  "date" TIMESTAMP(3) NOT NULL,
  "chapterId" TEXT NOT NULL,
  "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyChapter_pkey" PRIMARY KEY ("date", "chapterId")
);
CREATE INDEX IF NOT EXISTS "AnalyticsDailyChapter_chapterId_date_idx" ON "AnalyticsDailyChapter"("chapterId", "date");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyChapter_date_views_idx" ON "AnalyticsDailyChapter"("date", "views");

CREATE TABLE IF NOT EXISTS "AnalyticsDailyCreator" (
  "date" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "publishedWorks" INTEGER NOT NULL DEFAULT 0,
  "publishedChapters" INTEGER NOT NULL DEFAULT 0,
  "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
  "workViews" INTEGER NOT NULL DEFAULT 0,
  "chapterViews" INTEGER NOT NULL DEFAULT 0,
  "bookmarkAdds" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "followersGained" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyCreator_pkey" PRIMARY KEY ("date", "userId")
);
CREATE INDEX IF NOT EXISTS "AnalyticsDailyCreator_userId_date_idx" ON "AnalyticsDailyCreator"("userId", "date");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyCreator_date_uniqueViewers_idx" ON "AnalyticsDailyCreator"("date", "uniqueViewers");

CREATE TABLE IF NOT EXISTS "AnalyticsDailySearch" (
  "date" TIMESTAMP(3) NOT NULL,
  "normalizedQuery" TEXT NOT NULL,
  "searchType" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "zeroResultCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailySearch_pkey" PRIMARY KEY ("date", "normalizedQuery", "searchType")
);
CREATE INDEX IF NOT EXISTS "AnalyticsDailySearch_date_count_idx" ON "AnalyticsDailySearch"("date", "count");

CREATE TABLE IF NOT EXISTS "AnalyticsDailyDemographic" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "gender" "UserGender",
  "ageBand" "AnalyticsAgeBand" NOT NULL,
  "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
  "workViews" INTEGER NOT NULL DEFAULT 0,
  "chapterViews" INTEGER NOT NULL DEFAULT 0,
  "bookmarkAdds" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsDailyDemographic_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsDailyDemographic_date_gender_ageBand_key" ON "AnalyticsDailyDemographic"("date", "gender", "ageBand");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyDemographic_date_uniqueUsers_idx" ON "AnalyticsDailyDemographic"("date", "uniqueUsers");

ALTER TABLE "AnalyticsSession"
  ADD CONSTRAINT "AnalyticsSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_genreId_fkey"
  FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsDailyGenre"
  ADD CONSTRAINT "AnalyticsDailyGenre_genreId_fkey"
  FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsDailyWork"
  ADD CONSTRAINT "AnalyticsDailyWork_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsDailyChapter"
  ADD CONSTRAINT "AnalyticsDailyChapter_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsDailyCreator"
  ADD CONSTRAINT "AnalyticsDailyCreator_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
