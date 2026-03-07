const path = require("path");
const { collectBaseline } = require("./refactor-stage0-baseline");

function main() {
  const rootDir = path.resolve(__dirname, "..");
  const report = collectBaseline(rootDir);

  const summary = {
    appApiJsonImports: report.appApiJsonImports,
    appApiJsonCalls: report.appApiJsonCalls,
    cacheControlNoStore: report.totals.cacheControlNoStore,
    forceDynamic: report.totals.forceDynamic,
    fetchNoStore: report.totals.fetchNoStore,
    setInterval: report.totals.setInterval,
  };

  console.log("Inkura perf refactor stage 8 audit");
  console.log(JSON.stringify(summary, null, 2));

  const failures = [];
  if (report.appApiJsonImports !== 0) failures.push(`expected 0 app apiJson imports, got ${report.appApiJsonImports}`);
  if (report.appApiJsonCalls !== 0) failures.push(`expected 0 app apiJson calls, got ${report.appApiJsonCalls}`);
  if (report.totals.cacheControlNoStore !== 0) {
    failures.push(`expected 0 Cache-Control no-store headers, got ${report.totals.cacheControlNoStore}`);
  }

  if (failures.length) {
    console.error(`Audit failed:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("Audit passed.");
}

if (require.main === module) {
  main();
}
