const fs = require('fs');
const path = require('path');

const SOURCE_DIRS = ['app', 'components', 'hooks', 'server'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const HOTSPOT_PATTERNS = {
  forceDynamic: /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/g,
  apiJsonImport: /from\s+["']@\/server\/http\/apiJson["']/g,
  apiJsonCall: /\bapiJson(?:\s*<[^\n]+?>)?\s*\(/g,
  fetchNoStore: /cache:\s*["']no-store["']/g,
  cacheControlNoStore: /["']Cache-Control["']\s*:\s*["']no-store["']/g,
  setInterval: /\bsetInterval\s*\(/g,
};

function listCodeFiles(rootDir, sourceDirs = SOURCE_DIRS) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!CODE_EXTENSIONS.has(path.extname(entry.name))) continue;
      files.push(fullPath);
    }
  }

  for (const dir of sourceDirs) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) walk(fullPath);
  }

  return files.sort();
}

function relativeToRoot(rootDir, filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function countMatches(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function scanFile(rootDir, filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const relativePath = relativeToRoot(rootDir, filePath);

  const counts = {
    forceDynamic: countMatches(source, HOTSPOT_PATTERNS.forceDynamic),
    apiJsonImport: countMatches(source, HOTSPOT_PATTERNS.apiJsonImport),
    apiJsonCall: countMatches(source, HOTSPOT_PATTERNS.apiJsonCall),
    fetchNoStore: countMatches(source, HOTSPOT_PATTERNS.fetchNoStore),
    cacheControlNoStore: countMatches(source, HOTSPOT_PATTERNS.cacheControlNoStore),
    setInterval: countMatches(source, HOTSPOT_PATTERNS.setInterval),
  };

  return {
    file: relativePath,
    counts,
    totalHotspots: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

function summarizeScans(scans) {
  const totals = {
    forceDynamic: 0,
    apiJsonImport: 0,
    apiJsonCall: 0,
    fetchNoStore: 0,
    cacheControlNoStore: 0,
    setInterval: 0,
  };

  for (const scan of scans) {
    for (const [key, value] of Object.entries(scan.counts)) {
      totals[key] += value;
    }
  }

  const appScans = scans.filter((scan) => scan.file.startsWith('app/'));

  const serverApiJsonCallers = appScans
    .filter((scan) => scan.counts.apiJsonImport > 0)
    .sort((left, right) => {
      if (right.counts.apiJsonCall !== left.counts.apiJsonCall) {
        return right.counts.apiJsonCall - left.counts.apiJsonCall;
      }
      return left.file.localeCompare(right.file);
    });

  const hottestFiles = scans
    .filter((scan) => scan.totalHotspots > 0)
    .sort((left, right) => {
      if (right.totalHotspots !== left.totalHotspots) {
        return right.totalHotspots - left.totalHotspots;
      }
      return left.file.localeCompare(right.file);
    })
    .slice(0, 15);

  return {
    totals,
    appApiJsonImports: appScans.reduce((sum, scan) => sum + scan.counts.apiJsonImport, 0),
    appApiJsonCalls: appScans.reduce((sum, scan) => sum + scan.counts.apiJsonCall, 0),
    serverApiJsonCallers,
    hottestFiles,
    scannedFileCount: scans.length,
  };
}

function collectBaseline(rootDir) {
  const scans = listCodeFiles(rootDir).map((filePath) => scanFile(rootDir, filePath));
  return summarizeScans(scans);
}

function formatBaselineReport(report) {
  const lines = [];
  lines.push('Inkura perf refactor stage 0 baseline');
  lines.push('');
  lines.push(`Scanned code files: ${report.scannedFileCount}`);
  lines.push(`force-dynamic exports: ${report.totals.forceDynamic}`);
  lines.push(`server page apiJson imports: ${report.appApiJsonImports}`);
  lines.push(`apiJson calls inside app/: ${report.appApiJsonCalls}`);
  lines.push(`fetch cache:no-store calls: ${report.totals.fetchNoStore}`);
  lines.push(`Cache-Control no-store headers: ${report.totals.cacheControlNoStore}`);
  lines.push(`setInterval calls: ${report.totals.setInterval}`);
  lines.push('');
  lines.push('Top app/ server-page apiJson callers:');

  if (report.serverApiJsonCallers.length === 0) {
    lines.push('- none');
  } else {
    for (const entry of report.serverApiJsonCallers.slice(0, 12)) {
      lines.push(`- ${entry.file} -> ${entry.counts.apiJsonCall} apiJson call(s)`);
    }
  }

  lines.push('');
  lines.push('Hottest files by combined hotspot count:');

  if (report.hottestFiles.length === 0) {
    lines.push('- none');
  } else {
    for (const entry of report.hottestFiles) {
      const parts = [];
      for (const [key, value] of Object.entries(entry.counts)) {
        if (value > 0) parts.push(`${key}:${value}`);
      }
      lines.push(`- ${entry.file} -> ${parts.join(', ')}`);
    }
  }

  return lines.join('\n');
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const report = collectBaseline(rootDir);
  const wantsJson = process.argv.includes('--json');
  const output = wantsJson ? JSON.stringify(report, null, 2) : formatBaselineReport(report);
  console.log(output);
}

module.exports = {
  HOTSPOT_PATTERNS,
  SOURCE_DIRS,
  CODE_EXTENSIONS,
  listCodeFiles,
  countMatches,
  scanFile,
  summarizeScans,
  collectBaseline,
  formatBaselineReport,
};

if (require.main === module) {
  main();
}
