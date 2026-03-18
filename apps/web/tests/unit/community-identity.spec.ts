import { describe, expect, it } from "vitest";

import {
  buildCommunityUserIdentityFromSnapshots,
  resolveCommunityRoleBadges,
  sortAndDeduplicateCommunityIdentityBadges,
} from "@/server/services/community/identity";

describe("buildCommunityUserIdentityFromSnapshots", () => {
  it("builds main, donor, and special badges in the expected order", () => {
    const identity = buildCommunityUserIdentityFromSnapshots({
      user: {
        id: "user-1",
        username: "clio",
        name: "Clio",
        image: null,
        gender: "FEMALE",
        role: "USER",
      },
      ranks: {
        BEST_AUTHOR: 1,
        BEST_USER: 2,
        BEST_DONOR: 4,
      },
      specialBadgeKeys: ["WRATH", "LUST"],
    });

    expect(identity.mainTitle).toBe("Diamond Queen");
    expect(identity.badges.map((badge) => badge.label)).toEqual([
      "Diamond Queen",
      "Donatur",
      "Wrath",
      "Lust",
    ]);
    expect(identity.badges.map((badge) => badge.tone)).toEqual([
      "PURPLE",
      "GOLD",
      "GOLD",
      "GOLD",
    ]);
  });

  it("adds gray role badges after main, donor, and special badges", () => {
    const identity = buildCommunityUserIdentityFromSnapshots({
      user: {
        id: "user-2",
        username: "mika",
        name: "Mika",
        image: null,
        gender: "PREFER_NOT_TO_SAY",
        role: "USER",
      },
      ranks: {
        BEST_READER: 4,
      },
      specialBadgeKeys: ["PRIDE"],
      roleBadgeFlags: {
        isAuthor: true,
        isTranslator: true,
        isReuploader: true,
      },
    });

    expect(identity.mainTitle).toBe("Marquis");
    expect(identity.badges.map((badge) => badge.label)).toEqual([
      "Marquis",
      "Pride",
      "Author",
      "Translator",
      "Reuploader",
    ]);
    expect(identity.badges.slice(-3).map((badge) => badge.tone)).toEqual([
      "GRAY",
      "GRAY",
      "GRAY",
    ]);
  });

  it("keeps admins outside community ranking and shows only the platinum admin badge", () => {
    const identity = buildCommunityUserIdentityFromSnapshots({
      user: {
        id: "admin-1",
        username: "root",
        name: "Root",
        image: null,
        gender: null,
        role: "ADMIN",
      },
      ranks: {
        BEST_AUTHOR: 1,
        BEST_USER: 1,
      },
      specialBadgeKeys: ["WRATH"],
      roleBadgeFlags: {
        isAuthor: true,
      },
    });

    expect(identity.isAdmin).toBe(true);
    expect(identity.mainTitle).toBeNull();
    expect(identity.badges).toEqual([
      {
        kind: "ADMIN",
        label: "Admin",
        tone: "PLATINUM",
      },
    ]);
  });
});

describe("community identity badge helpers", () => {
  it("builds gray creator role badges in a stable order", () => {
    expect(
      resolveCommunityRoleBadges({
        isTranslator: true,
        isAuthor: true,
        isReuploader: true,
      }).map((badge) => badge.label)
    ).toEqual(["Author", "Translator", "Reuploader"]);
  });

  it("deduplicates and sorts mixed badges predictably", () => {
    const sorted = sortAndDeduplicateCommunityIdentityBadges([
      { kind: "ROLE", label: "Translator", tone: "GRAY", badgeKey: "TRANSLATOR" },
      { kind: "SPECIAL", label: "Lust", tone: "GOLD", badgeKey: "LUST" },
      { kind: "ROLE", label: "Author", tone: "GRAY", badgeKey: "AUTHOR" },
      { kind: "DONOR", label: "Donatur", tone: "GOLD" },
      { kind: "SPECIAL", label: "Wrath", tone: "GOLD", badgeKey: "WRATH" },
      { kind: "MAIN", label: "Diamond Emperor", tone: "PURPLE" },
      { kind: "SPECIAL", label: "Wrath", tone: "GOLD", badgeKey: "WRATH" },
    ]);

    expect(sorted.map((badge) => `${badge.kind}:${badge.label}`)).toEqual([
      "MAIN:Diamond Emperor",
      "DONOR:Donatur",
      "SPECIAL:Wrath",
      "SPECIAL:Lust",
      "ROLE:Author",
      "ROLE:Translator",
    ]);
  });
});
