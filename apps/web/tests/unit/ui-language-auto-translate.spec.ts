import { describe, expect, it } from "vitest";

import {
  buildAutoTranslatePartialCandidates,
  buildAutoTranslateReverseLookup,
  buildAutoTranslateSourceMap,
  replaceAutoTranslateKnownPhrases,
  resolveAutoTranslateSourceText,
  shouldAllowAutoTranslatePartialReplacement,
} from "@/lib/uiLanguageAutoTranslate";
import { lookupUILanguageText, parseUILanguageCatalog } from "@/lib/uiLanguageCatalog";

const sourceCatalog = parseUILanguageCatalog(
  "EN",
  `==========
Navigation
==========

Home
Search

==========
Page Studio
==========

Commit failed
Upload complete`
);

const translatedCatalog = parseUILanguageCatalog(
  "ID",
  `==========
Navigation
==========

Home = Beranda
Search = Pencarian

==========
Page Studio
==========

Commit failed = Gagal menyimpan perubahan
Upload complete = Unggahan selesai`,
  sourceCatalog
);

const catalogs = {
  EN: sourceCatalog,
  ID: translatedCatalog,
} as const;

describe("ui auto-translate policy", () => {
  it("only reverse-resolves translated text during a full-document pass", () => {
    const sourceMap = buildAutoTranslateSourceMap(sourceCatalog);
    const reverseLookup = buildAutoTranslateReverseLookup(catalogs);

    expect(
      resolveAutoTranslateSourceText("Beranda", {
        mode: "incremental",
        sourceMap,
        reverseLookup,
      })
    ).toBeNull();

    expect(
      resolveAutoTranslateSourceText("Beranda", {
        mode: "full",
        sourceMap,
        reverseLookup,
      })
    ).toBe("Home");
  });

  it("keeps partial replacement opt-in only", () => {
    expect(shouldAllowAutoTranslatePartialReplacement({ hasExplicitOptIn: false })).toBe(false);
    expect(shouldAllowAutoTranslatePartialReplacement({ hasExplicitOptIn: true })).toBe(true);
  });

  it("replaces known phrases when a component explicitly opts in", () => {
    const partialCandidates = buildAutoTranslatePartialCandidates(catalogs, sourceCatalog);
    const replaced = replaceAutoTranslateKnownPhrases(
      "Upload complete · Home",
      translatedCatalog,
      sourceCatalog,
      partialCandidates
    );

    expect(replaced).toBe("Unggahan selesai · Beranda");
    expect(lookupUILanguageText(translatedCatalog, "Commit failed", { section: "Page Studio" })).toBe(
      "Gagal menyimpan perubahan"
    );
  });
});
