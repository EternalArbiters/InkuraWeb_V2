import { describe, expect, it } from "vitest";

import {
  isAmountBasedLeaderboardCategory,
  isAdminExcludedFromCommunityRanking,
  isCommunityRankingEligibleUser,
  pickBestLeaderboardRank,
  resolveCommunityMainTitle,
  resolveCreatorTitle,
  resolveNobleTitle,
  resolveRankBadgeTone,
} from "@/server/services/community/ranking";

describe("community ranking foundation", () => {
  it("excludes admin accounts from ranking", () => {
    expect(isAdminExcludedFromCommunityRanking({ role: "ADMIN" })).toBe(true);
    expect(isCommunityRankingEligibleUser({ role: "USER" })).toBe(true);
    expect(isCommunityRankingEligibleUser(null)).toBe(false);
  });

  it("maps creator leaderboard rank to gem titles", () => {
    expect(resolveCreatorTitle(1)).toBe("Diamond");
    expect(resolveCreatorTitle(4)).toBe("Emerald");
    expect(resolveCreatorTitle(7)).toBe("Garnet");
    expect(resolveCreatorTitle(8)).toBeNull();
  });

  it("maps noble leaderboard rank to gendered titles", () => {
    expect(resolveNobleTitle(1, "MALE")).toBe("Emperor");
    expect(resolveNobleTitle(1, "FEMALE")).toBe("Empress");
    expect(resolveNobleTitle(3, "FEMALE")).toBe("Duchess");
    expect(resolveNobleTitle(4, "FEMALE")).toBe("Marchioness");
    expect(resolveNobleTitle(4, "PREFER_NOT_TO_SAY")).toBe("Marquis");
  });

  it("uses the best available rank when combining titles", () => {
    expect(pickBestLeaderboardRank(6, 2, 4)).toBe(2);

    expect(
      resolveCommunityMainTitle({
        authorRank: 3,
        translatorRank: 1,
        readerRank: 2,
        userRank: 6,
        gender: "FEMALE",
      })
    ).toEqual({
      creatorRank: 1,
      nobleRank: 2,
      primaryRank: 1,
      creatorTitle: "Diamond",
      nobleTitle: "Queen",
      mainTitle: "Diamond Queen",
      badgeTone: "PURPLE",
    });
  });

  it("uses the best rank across creator and noble tracks for the badge tone", () => {
    expect(
      resolveCommunityMainTitle({
        authorRank: 4,
        readerRank: 1,
        gender: "MALE",
      })
    ).toMatchObject({
      mainTitle: "Emerald Emperor",
      primaryRank: 1,
      badgeTone: "PURPLE",
    });
  });

  it("flags donor leaderboard as amount-based and resolves rank colors", () => {
    expect(isAmountBasedLeaderboardCategory("BEST_DONOR")).toBe(true);
    expect(isAmountBasedLeaderboardCategory("BEST_READER")).toBe(false);
    expect(resolveRankBadgeTone(6)).toBe("ORANGE");
    expect(resolveRankBadgeTone(0)).toBeNull();
  });
});
