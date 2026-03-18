import { describe, expect, it } from "vitest";

import {
  buildBestUserCommunityRows,
  rankCommunityScoreRows,
  summarizeStandingMainMetrics,
  type CommunityScoreRow,
  type CommunityStandingSummary,
} from "@/server/services/community/leaderboards";

describe("community leaderboard engine", () => {
  it("ranks rows by score, primary metric, breadth, then older account", () => {
    const baseDate = new Date("2026-03-01T00:00:00.000Z");
    const rows: CommunityScoreRow[] = [
      {
        userId: "newer",
        score: 120,
        primaryMetric: 3,
        breadthMetric: 8,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        metadata: { publishedWorks: 3 },
      },
      {
        userId: "older",
        score: 120,
        primaryMetric: 3,
        breadthMetric: 8,
        createdAt: baseDate,
        metadata: { publishedWorks: 3 },
      },
      {
        userId: "higher-primary",
        score: 120,
        primaryMetric: 4,
        breadthMetric: 1,
        createdAt: baseDate,
        metadata: { publishedWorks: 4 },
      },
      {
        userId: "higher-score",
        score: 150,
        primaryMetric: 1,
        breadthMetric: 1,
        createdAt: baseDate,
        metadata: { publishedWorks: 1 },
      },
    ];

    const ranked = rankCommunityScoreRows(rows);
    expect(ranked.map((row) => row.userId)).toEqual([
      "higher-score",
      "higher-primary",
      "older",
      "newer",
    ]);
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });



  it("filters out zero-or-negative score rows before ranking", () => {
    const ranked = rankCommunityScoreRows([
      {
        userId: "drop-zero",
        score: 0,
        primaryMetric: 10,
        breadthMetric: 5,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        metadata: { uniqueWorksRead: 10 },
      },
      {
        userId: "keep-positive",
        score: 1,
        primaryMetric: 1,
        breadthMetric: 1,
        createdAt: new Date("2026-03-02T00:00:00.000Z"),
        metadata: { uniqueWorksRead: 1 },
      },
      {
        userId: "drop-negative",
        score: -5,
        primaryMetric: 99,
        breadthMetric: 99,
        createdAt: new Date("2026-03-03T00:00:00.000Z"),
        metadata: { uniqueWorksRead: 99 },
      },
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.userId).toBe("keep-positive");
    expect(ranked[0]?.rank).toBe(1);
  });

  it("merges author, translator, and reader rows into best user rows", () => {
    const usersById = new Map([
      [
        "user-1",
        {
          id: "user-1",
          username: "cleo",
          name: "Cleo",
          image: null,
          gender: "FEMALE" as const,
          role: "USER",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    ]);

    const bestUserRows = buildBestUserCommunityRows({
      usersById,
      authorRows: [
        {
          userId: "user-1",
          score: 1000,
          primaryMetric: 2,
          breadthMetric: 12,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          metadata: { publishedWorks: 2 },
        },
      ],
      translatorRows: [
        {
          userId: "user-1",
          score: 400,
          primaryMetric: 1,
          breadthMetric: 5,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          metadata: { publishedWorks: 1 },
        },
      ],
      readerRows: [
        {
          userId: "user-1",
          score: 250,
          primaryMetric: 7,
          breadthMetric: 9,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          metadata: { uniqueWorksRead: 7 },
        },
      ],
    });

    expect(bestUserRows).toHaveLength(1);
    expect(bestUserRows[0]).toMatchObject({
      userId: "user-1",
      score: 1650,
      primaryMetric: 10,
      breadthMetric: 29,
      metadata: {
        authorScore: 1000,
        translatorScore: 400,
        readerScore: 250,
        authorWorks: 2,
        translatorWorks: 1,
        uniqueWorksRead: 7,
        activeTracks: 3,
      },
    });
  });

  it("summarizes standing metrics for downstream title page usage", () => {
    const summary: CommunityStandingSummary = {
      user: {
        id: "user-1",
        username: "cleo",
        name: "Cleo",
        image: null,
        gender: "FEMALE",
        role: "USER",
      },
      isEligible: true,
      mainTitle: "Diamond Queen",
      mainBadgeTone: "PURPLE",
      donorBadgeTone: "GOLD",
      standing: [
        {
          category: "BEST_AUTHOR",
          label: "Best Author",
          rank: 1,
          score: 2200,
          title: "Diamond",
          badgeTone: "PURPLE",
          isTopRanked: true,
          isAmountBased: false,
          metadata: { publishedWorks: 4 },
        },
        {
          category: "BEST_TRANSLATOR",
          label: "Best Translator",
          rank: null,
          score: 0,
          title: null,
          badgeTone: null,
          isTopRanked: false,
          isAmountBased: false,
          metadata: null,
        },
        {
          category: "BEST_READER",
          label: "Best Reader",
          rank: 2,
          score: 900,
          title: "Queen",
          badgeTone: "INDIGO",
          isTopRanked: true,
          isAmountBased: false,
          metadata: { uniqueWorksRead: 18 },
        },
        {
          category: "BEST_USER",
          label: "Best User",
          rank: 5,
          score: 3100,
          title: "Countess",
          badgeTone: "YELLOW",
          isTopRanked: true,
          isAmountBased: false,
          metadata: { activeTracks: 2 },
        },
        {
          category: "BEST_DONOR",
          label: "Best Donor",
          rank: 3,
          score: 125000,
          title: "Donatur",
          badgeTone: "GOLD",
          isTopRanked: true,
          isAmountBased: true,
          metadata: { currency: "IDR", donationCount: 2 },
        },
      ],
    };

    expect(summarizeStandingMainMetrics(summary)).toEqual({
      authorRank: 1,
      translatorRank: null,
      readerRank: 2,
      userRank: 5,
      donorRank: 3,
      donorCurrency: "IDR",
    });
  });
});
