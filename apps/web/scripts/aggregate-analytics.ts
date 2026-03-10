import { aggregateAnalyticsRange } from "@/server/analytics/aggregate/run";

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const start = readArg("--start");
  const end = readArg("--end");
  const daysArg = readArg("--days");
  const days = daysArg ? Math.max(1, Math.floor(Number(daysArg))) : undefined;

  const result = await aggregateAnalyticsRange({ start, end, days });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[analytics:aggregate] failed", error);
  process.exit(1);
});
