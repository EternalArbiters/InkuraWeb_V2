import { describe, expect, it } from "vitest";

import { inkuraLanguageToHtmlLang, resolveInkuraLanguage } from "@/lib/inkuraLanguage";
import { lookupUILanguageText, parseUILanguageCatalog } from "@/lib/uiLanguageCatalog";

const sourceText = `==========
Navigation
==========

Home
Search

==========
Page Home
==========

See all`;

const indonesianText = `==========
Navigation
==========

Home = Beranda
Search = Pencarian

==========
Page Home
==========

See all = Lihat semua`;

describe("UI language catalog", () => {
  it("parses EN sections as source-to-source entries", () => {
    const catalog = parseUILanguageCatalog("EN", sourceText);

    expect(catalog.sectionLookup.Navigation.Home).toBe("Home");
    expect(catalog.sectionLookup.Navigation.Search).toBe("Search");
    expect(catalog.sectionLookup["Page Home"]["See all"]).toBe("See all");
  });

  it("parses translated entries and resolves by section", () => {
    const sourceCatalog = parseUILanguageCatalog("EN", sourceText);
    const translatedCatalog = parseUILanguageCatalog("ID", indonesianText, sourceCatalog);

    expect(lookupUILanguageText(translatedCatalog, "Home", { section: "Navigation" })).toBe("Beranda");
    expect(lookupUILanguageText(translatedCatalog, "See all", { section: "Page Home" })).toBe("Lihat semua");
  });

  it("falls back to EN when a translated line is missing", () => {
    const sourceCatalog = parseUILanguageCatalog("EN", sourceText);
    const translatedCatalog = parseUILanguageCatalog(
      "ID",
      `==========\nNavigation\n==========\n\nHome = Beranda`,
      sourceCatalog
    );

    expect(
      lookupUILanguageText(translatedCatalog, "Search", {
        section: "Navigation",
        fallbackCatalog: sourceCatalog,
      })
    ).toBe("Search");
  });

  it("rejects translated entries that do not exist in EN", () => {
    const sourceCatalog = parseUILanguageCatalog("EN", sourceText);

    expect(() =>
      parseUILanguageCatalog(
        "ID",
        `==========\nNavigation\n==========\n\nNot in English = Tidak ada di English`,
        sourceCatalog
      )
    ).toThrow(/Source text not found in EN/);
  });
});


describe("inkura language helpers", () => {
  it("normalizes unknown values to the guest fallback", () => {
    expect(resolveInkuraLanguage("id")).toBe("ID");
    expect(resolveInkuraLanguage(null)).toBe("EN");
  });

  it("maps the active UI language to a valid html lang attribute", () => {
    expect(inkuraLanguageToHtmlLang("EN")).toBe("en");
    expect(inkuraLanguageToHtmlLang("ID")).toBe("id");
  });
});
