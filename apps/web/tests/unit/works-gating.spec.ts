import { describe, expect, it } from "vitest";

import { computeChapterGate, computeWorkGate } from "@/server/services/works/gating";

const adultViewer = {
  id: "user-1",
  role: "USER",
  adultConfirmed: true,
  deviantLoveConfirmed: false,
} as const;

const unlockedViewer = {
  id: "user-2",
  role: "USER",
  adultConfirmed: true,
  deviantLoveConfirmed: true,
} as const;

describe("works gating", () => {
  it("blocks anonymous viewers from mature works", () => {
    const result = computeWorkGate({
      viewer: null,
      work: { authorId: "author-1", isMature: true, genres: [], deviantLoveTags: [] },
    });

    expect(result.requiresMatureGate).toBe(true);
    expect(result.requiresDeviantGate).toBe(false);
    expect(result.gateReason).toBe("MATURE");
  });

  it("keeps deviant-love gated until both confirmations are unlocked", () => {
    const result = computeWorkGate({
      viewer: adultViewer,
      work: {
        authorId: "author-1",
        isMature: false,
        genres: [],
        deviantLoveTags: [{ slug: "omegaverse" }],
      },
    });

    expect(result.canViewMature).toBe(true);
    expect(result.canViewDeviantLove).toBe(false);
    expect(result.requiresMatureGate).toBe(false);
    expect(result.requiresDeviantGate).toBe(true);
    expect(result.gateReason).toBe("DEVIANT_LOVE");
  });

  it("lets fully unlocked viewers pass both work and chapter gates", () => {
    const result = computeChapterGate({
      viewer: unlockedViewer,
      work: {
        authorId: "author-1",
        isMature: true,
        genres: [{ slug: "omegaverse" }],
        deviantLoveTags: [{ slug: "omegaverse" }],
      },
      chapter: { isMature: true },
    });

    expect(result.canViewMature).toBe(true);
    expect(result.canViewDeviantLove).toBe(true);
    expect(result.requiresMatureGate).toBe(false);
    expect(result.requiresDeviantGate).toBe(false);
    expect(result.gateReason).toBeNull();
  });
});
