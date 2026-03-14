import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeUILanguageText, lookupUILanguageText, parseUILanguageCatalog } from "@/lib/uiLanguageCatalog";

const appRoot = process.cwd();
const enRaw = fs.readFileSync(path.join(appRoot, "UIlanguage", "EN"), "utf8");
const idRaw = fs.readFileSync(path.join(appRoot, "UIlanguage", "ID"), "utf8");
const enCatalog = parseUILanguageCatalog("EN", enRaw);
const idCatalog = parseUILanguageCatalog("ID", idRaw, enCatalog);

const semanticSections = [
  "Page Browse Catalog",
  "Page App Download",
  "Page Admin Report",
  "Page Studio",
  "Page Comments",
  "Page Lists",
  "Page Admin Taxonomy",
  "Page Profile",
  "Page Chat",
  "Page Admin",
  "Page Reset Password Legacy",
] as const;

const getActivePattern = /getActiveUILanguageText\(\s*(["'])(.*?)\1\s*,\s*\{\s*section:\s*(["'])(.*?)\3\s*\}/gs;
const useSectionPattern = /const\s+(\w+)\s*=\s*useUILanguageText\((["'])(.*?)\2\)/g;

function listCodeFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listCodeFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) results.push(fullPath);
  }
  return results;
}

function relativeFromAppRoot(filePath: string) {
  return path.relative(appRoot, filePath).replace(/\\/g, "/");
}

type StaticLookup = {
  file: string;
  section: string;
  source: string;
};

function collectStaticLookups(): StaticLookup[] {
  const roots = ["app", "components", "server", "lib"].map((segment) => path.join(appRoot, segment));
  const lookups: StaticLookup[] = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const filePath of listCodeFiles(root)) {
      const relativePath = relativeFromAppRoot(filePath);
      const content = fs.readFileSync(filePath, "utf8");

      for (const match of content.matchAll(getActivePattern)) {
        lookups.push({
          file: relativePath,
          section: String(match[4] || "").trim(),
          source: String(match[2] || "").trim(),
        });
      }

      const sectionVars = Array.from(content.matchAll(useSectionPattern)).map((match) => ({
        name: String(match[1] || "").trim(),
        section: String(match[3] || "").trim(),
      }));

      for (const { name, section } of sectionVars) {
        const localCallPattern = new RegExp(String.raw`\b${name}\(\s*(["'])(.*?)\1`, "gs");
        for (const match of content.matchAll(localCallPattern)) {
          lookups.push({
            file: relativePath,
            section,
            source: String(match[2] || "").trim(),
          });
        }
      }
    }
  }

  return lookups;
}

describe("semantic UI language sections", () => {
  it("keeps the semantic sections present in both EN and ID catalogs", () => {
    for (const section of semanticSections) {
      expect(enCatalog.sectionLookup[section], `EN missing section ${section}`).toBeTruthy();
      expect(idCatalog.sectionLookup[section], `ID missing section ${section}`).toBeTruthy();
    }
  });

  it("keeps static translation lookups inside their requested section", () => {
    const lookups = collectStaticLookups();
    const checked = new Set<string>();

    for (const lookup of lookups) {
      if (!lookup.section || !lookup.source) continue;
      const sourceKey = canonicalizeUILanguageText(lookup.source);
      const dedupeKey = `${lookup.file}::${lookup.section}::${sourceKey}`;
      if (checked.has(dedupeKey)) continue;
      checked.add(dedupeKey);

      expect(
        enCatalog.sectionLookup[lookup.section]?.[sourceKey],
        `EN missing ${lookup.section} -> ${lookup.source} (${lookup.file})`
      ).toBeDefined();
      expect(
        idCatalog.sectionLookup[lookup.section]?.[sourceKey],
        `ID missing ${lookup.section} -> ${lookup.source} (${lookup.file})`
      ).toBeDefined();
    }
  });

  it("resolves the previously conflicting comment and studio strings through the semantic sections", () => {
    expect(
      lookupUILanguageText(idCatalog, "Comment pinned", {
        section: "Page Comments",
        fallbackCatalog: enCatalog,
      })
    ).toBe("Komentar disematkan");

    expect(
      lookupUILanguageText(idCatalog, "Commit failed", {
        section: "Page Studio",
        fallbackCatalog: enCatalog,
      })
    ).toBe("Gagal menyimpan perubahan");

    expect(
      lookupUILanguageText(idCatalog, "Inbox reports from users.", {
        section: "Page Admin Report",
        fallbackCatalog: enCatalog,
      })
    ).toBe("Kotak masuk laporan dari pengguna.");
  });
});
