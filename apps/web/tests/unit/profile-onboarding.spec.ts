import { describe, expect, it } from "vitest";

import { hasCompletedProfileOnboarding } from "@/server/services/profile/demographics";

describe("profile onboarding completion", () => {
  it("requires demographics and inkura language", () => {
    expect(
      hasCompletedProfileOnboarding({
        gender: "PREFER_NOT_TO_SAY",
        birthMonth: 1,
        birthYear: 2000,
        inkuraLanguage: "EN",
      })
    ).toBe(true);

    expect(
      hasCompletedProfileOnboarding({
        gender: "PREFER_NOT_TO_SAY",
        birthMonth: 1,
        birthYear: 2000,
        inkuraLanguage: null,
      })
    ).toBe(false);

    expect(
      hasCompletedProfileOnboarding({
        gender: null,
        birthMonth: 1,
        birthYear: 2000,
        inkuraLanguage: "ID",
      })
    ).toBe(false);
  });
});
