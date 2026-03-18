import { describe, expect, it } from "vitest";

import {
  summarizeHeldSpecialBadges,
  type CommunitySpecialBadgeSummary,
} from "@/server/services/community/specialBadges";

describe("community special badges", () => {
  it("summarizes held special badges for title page usage", () => {
    const summary: CommunitySpecialBadgeSummary = {
      user: {
        id: "user-1",
        username: "cleo",
        name: "Cleo",
        image: null,
        gender: "FEMALE",
        role: "USER",
      },
      isEligible: true,
      heldBadges: [
        {
          badgeKey: "WRATH",
          label: "Wrath",
          userId: "user-1",
          username: "cleo",
          name: "Cleo",
          image: null,
          gender: "FEMALE",
          score: 128,
          metadata: { commentCount: 128, distinctTargets: 19 },
          badgeTone: "GOLD",
          snapshotAt: new Date("2026-03-18T00:00:00.000Z"),
        },
        {
          badgeKey: "PRIDE",
          label: "Pride",
          userId: "user-1",
          username: "cleo",
          name: "Cleo",
          image: null,
          gender: "FEMALE",
          score: 860,
          metadata: { accountAgeDays: 650, distinctActiveMonths: 7 },
          badgeTone: "GOLD",
          snapshotAt: new Date("2026-03-18T00:00:00.000Z"),
        },
      ],
    };

    expect(summarizeHeldSpecialBadges(summary)).toEqual({
      badgeKeys: ["WRATH", "PRIDE"],
      labels: ["Wrath", "Pride"],
      hasAny: true,
    });
  });

  it("returns an empty summary for users without a special badge", () => {
    const summary: CommunitySpecialBadgeSummary = {
      user: {
        id: "user-2",
        username: "mika",
        name: "Mika",
        image: null,
        gender: "PREFER_NOT_TO_SAY",
        role: "USER",
      },
      isEligible: true,
      heldBadges: [],
    };

    expect(summarizeHeldSpecialBadges(summary)).toEqual({
      badgeKeys: [],
      labels: [],
      hasAny: false,
    });
  });
});
