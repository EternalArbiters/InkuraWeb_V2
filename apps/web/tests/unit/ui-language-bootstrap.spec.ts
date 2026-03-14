import { describe, expect, it } from "vitest";

import { resolveClientInkuraLanguage } from "@/lib/uiLanguageBootstrap";

describe("resolveClientInkuraLanguage", () => {
  it("preserves the current language while the session is still loading", () => {
    expect(
      resolveClientInkuraLanguage({
        status: "loading",
        sessionLanguage: "EN",
        initialLanguage: "ID",
        currentLanguage: "ID",
      })
    ).toBe("ID");
  });

  it("uses the authenticated session language when available", () => {
    expect(
      resolveClientInkuraLanguage({
        status: "authenticated",
        sessionLanguage: "ID",
        initialLanguage: "EN",
        currentLanguage: "EN",
      })
    ).toBe("ID");
  });

  it("falls back to the server-bootstrapped language for authenticated users with a missing session language", () => {
    expect(
      resolveClientInkuraLanguage({
        status: "authenticated",
        sessionLanguage: null,
        initialLanguage: "ID",
        currentLanguage: "EN",
      })
    ).toBe("ID");
  });

  it("returns the guest fallback once the session is unauthenticated", () => {
    expect(
      resolveClientInkuraLanguage({
        status: "unauthenticated",
        sessionLanguage: "ID",
        initialLanguage: "ID",
        currentLanguage: "ID",
      })
    ).toBe("EN");
  });
});
