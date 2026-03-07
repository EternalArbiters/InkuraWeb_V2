import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const {
  countMatches,
  formatBaselineReport,
  scanFile,
  summarizeScans,
} = require("@/scripts/refactor-stage0-baseline.js");

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("refactor stage 0 baseline scanner", () => {
  it("counts hotspot patterns inside a source file", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "inkura-stage0-"));
    tempDirs.push(rootDir);
    const filePath = path.join(rootDir, "app", "home", "page.tsx");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      [
        'export const dynamic = "force-dynamic";',
        'import { apiJson } from "@/server/http/apiJson";',
        'void apiJson("/api/works");',
        'void apiJson<{ works: any[] }>("/api/works?take=20");',
        'fetch("/api/demo", { cache: "no-store" });',
        'setInterval(() => {}, 30_000);',
      ].join("\n")
    );

    const scan = scanFile(rootDir, filePath);

    expect(scan.file).toBe("app/home/page.tsx");
    expect(scan.counts.forceDynamic).toBe(1);
    expect(scan.counts.apiJsonImport).toBe(1);
    expect(scan.counts.apiJsonCall).toBe(2);
    expect(scan.counts.fetchNoStore).toBe(1);
    expect(scan.counts.setInterval).toBe(1);
    expect(scan.totalHotspots).toBe(6);
  });

  it("summarizes scans and prints a readable report", () => {
    const summary = summarizeScans([
      {
        file: "app/home/page.tsx",
        counts: {
          forceDynamic: 1,
          apiJsonImport: 1,
          apiJsonCall: 5,
          fetchNoStore: 0,
          cacheControlNoStore: 0,
          setInterval: 0,
        },
        totalHotspots: 7,
      },
      {
        file: "app/components/NavCountBadge.tsx",
        counts: {
          forceDynamic: 0,
          apiJsonImport: 0,
          apiJsonCall: 0,
          fetchNoStore: 1,
          cacheControlNoStore: 0,
          setInterval: 1,
        },
        totalHotspots: 2,
      },
    ]);

    expect(summary.totals.apiJsonCall).toBe(5);
    expect(summary.totals.fetchNoStore).toBe(1);
    expect(summary.serverApiJsonCallers[0]?.file).toBe("app/home/page.tsx");

    const report = formatBaselineReport(summary);

    expect(report).toContain("force-dynamic exports: 1");
    expect(report).toContain("app/home/page.tsx -> 5 apiJson call(s)");
    expect(report).toContain("app/components/NavCountBadge.tsx -> fetchNoStore:1, setInterval:1");
  });

  it("counts apiJson generic calls without overcounting other symbols", () => {
    const source = [
      'void apiJson<{ works: any[] }>("/api/works");',
      'void apiJson("/api/warnings");',
      'const notApiJson = () => null;',
    ].join("\n");

    expect(countMatches(source, /\bapiJson(?:\s*<[^\n]+?>)?\s*\(/g)).toBe(2);
  });
});
