import { describe, expect, it } from "vitest";

import {
  canViewNonPublishedWork,
  computeChapterGate,
  computeWorkGate,
} from "@/server/services/works/gating";

// inkuraLanguage is part of ViewerBasic but irrelevant to gating, so it stays null here.
const adultViewer = {
  id: "user-1",
  role: "USER",
  adultConfirmed: true,
  deviantLoveConfirmed: false,
  inkuraLanguage: null,
} as const;

const unlockedViewer = {
  id: "user-2",
  role: "USER",
  adultConfirmed: true,
  deviantLoveConfirmed: true,
  inkuraLanguage: null,
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

// "Koleksi Admin" is a product requirement for the APK build: the app serves the open
// public catalogue (Project 1's behaviour) AND keeps SPECIAL_USER's access to
// admin-flagged drafts (Project 2's). That works because this rule is purely
// role-based — it never consults PRIVATE_MODE or any deployment flag, so it behaves
// identically on every deployment. These tests exist to keep it that way.
describe("Koleksi Admin visibility (SPECIAL_USER)", () => {
  const draft = { status: "DRAFT", isAdminCollection: true };
  const plainDraft = { status: "DRAFT", isAdminCollection: false };
  const published = { status: "PUBLISHED", isAdminCollection: false };

  const specialUser = {
    id: "special-1",
    role: "SPECIAL_USER",
    adultConfirmed: false,
    deviantLoveConfirmed: false,
    inkuraLanguage: null,
  } as const;

  const admin = { ...specialUser, id: "admin-1", role: "ADMIN" } as const;
  const normalUser = { ...specialUser, id: "user-3", role: "USER" } as const;
  const iosUser = { ...specialUser, id: "ios-1", role: "IOS_USER" } as const;

  it("shows published works to everyone, signed in or not", () => {
    expect(canViewNonPublishedWork(null, published)).toBe(true);
    expect(canViewNonPublishedWork(normalUser, published)).toBe(true);
    expect(canViewNonPublishedWork(specialUser, published)).toBe(true);
  });

  it("lets SPECIAL_USER read a draft that the admin flagged as Koleksi Admin", () => {
    expect(canViewNonPublishedWork(specialUser, draft)).toBe(true);
  });

  it("still hides unflagged drafts from SPECIAL_USER", () => {
    expect(canViewNonPublishedWork(specialUser, plainDraft)).toBe(false);
  });

  it("never leaks a flagged draft to anonymous visitors or normal users", () => {
    expect(canViewNonPublishedWork(null, draft)).toBe(false);
    expect(canViewNonPublishedWork(normalUser, draft)).toBe(false);
  });

  // v41: IOS_USER gets into Project 2 like SPECIAL_USER (see middleware.ts), but
  // must NOT inherit the Koleksi Admin bypass — it is treated exactly like USER here.
  it("gives IOS_USER no Koleksi Admin bypass, unlike SPECIAL_USER", () => {
    expect(canViewNonPublishedWork(iosUser, draft)).toBe(false);
    expect(canViewNonPublishedWork(iosUser, plainDraft)).toBe(false);
    expect(canViewNonPublishedWork(iosUser, published)).toBe(true);
  });

  it("keeps ADMIN able to see every draft, flagged or not", () => {
    expect(canViewNonPublishedWork(admin, draft)).toBe(true);
    expect(canViewNonPublishedWork(admin, plainDraft)).toBe(true);
  });

  it("gives SPECIAL_USER no bypass of the mature / deviant-love gates", () => {
    const result = computeWorkGate({
      viewer: specialUser,
      work: {
        authorId: "author-1",
        isMature: true,
        genres: [],
        deviantLoveTags: [{ slug: "omegaverse" }],
      },
    });

    expect(result.requiresMatureGate).toBe(true);
    expect(result.requiresDeviantGate).toBe(true);
    expect(result.gateReason).toBe("BOTH");
  });
});
