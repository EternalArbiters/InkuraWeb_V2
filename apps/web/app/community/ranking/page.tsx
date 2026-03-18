import Link from "next/link";

import PageScaffold from "@/app/components/PageScaffold";
import {
  getCommunityLeaderboardPageData,
  type CommunityLeaderboardEntry,
} from "@/server/services/community/leaderboards";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

const BADGE_TONE_CLASSES: Record<string, string> = {
  PURPLE: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200",
  INDIGO: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200",
  BLUE: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
  GREEN: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  YELLOW: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  ORANGE: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200",
  RED: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
  GOLD: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200",
  PLATINUM: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  GRAY: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
};

function displayName(entry: Pick<CommunityLeaderboardEntry, "name" | "username">) {
  return entry.name || (entry.username ? `@${entry.username}` : "User");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatEntryValue(entry: CommunityLeaderboardEntry, pointsLabel: string) {
  if (entry.isAmountBased) {
    const currency = typeof entry.metadata?.currency === "string" ? entry.metadata.currency : "IDR";
    return formatAmount(entry.score, currency);
  }
  return `${formatNumber(entry.score)} ${pointsLabel}`;
}

function toneClasses(tone: string | null | undefined) {
  if (!tone) return BADGE_TONE_CLASSES.GRAY;
  return BADGE_TONE_CLASSES[tone] || BADGE_TONE_CLASSES.GRAY;
}

function Avatar({ entry }: { entry: CommunityLeaderboardEntry }) {
  const label = displayName(entry);
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
      {entry.image ? (
        <img src={entry.image} alt={label} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-gray-500 dark:text-gray-300">
          {label.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  pointsLabel,
  donorTitleLabel,
}: {
  entry: CommunityLeaderboardEntry;
  pointsLabel: string;
  donorTitleLabel: string;
}) {
  const title = entry.title === "Donatur" ? donorTitleLabel : entry.title;
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-extrabold text-white dark:bg-white dark:text-gray-900">
          #{entry.rank}
        </div>
        <Avatar entry={entry} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName(entry)}</div>
          {entry.username ? <div className="truncate text-xs text-gray-500 dark:text-gray-400">@{entry.username}</div> : null}
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {title ? (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(entry.badgeTone)}`}>
            {title}
          </span>
        ) : null}
        <div className="text-right text-xs font-semibold text-gray-600 dark:text-gray-300">{formatEntryValue(entry, pointsLabel)}</div>
      </div>
    </>
  );

  if (entry.username) {
    return (
      <Link
        href={`/u/${entry.username}`}
        className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-white/5"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">{content}</div>;
}

export default async function CommunityRankingPage() {
  const [{ sections }, topSevenLabel, emptyLabel, pointsLabel, donorTitleLabel] = await Promise.all([
    getCommunityLeaderboardPageData(),
    getActiveUILanguageText("Top 7", { section: "Page Community Ranking" }),
    getActiveUILanguageText("No ranked users yet.", { section: "Page Community Ranking" }),
    getActiveUILanguageText("points", { section: "Page Community Ranking" }),
    getActiveUILanguageText("Donatur", { section: "Page Community Ranking" }),
  ]);

  const translatedSectionLabels = new Map(
    await Promise.all(
      sections.map(async (section) => [
        section.category,
        await getActiveUILanguageText(section.label, { section: "Page Community Ranking" }),
      ])
    )
  );

  return (
    <PageScaffold title="Ranking" titleLookupOptions={{ section: "Navigation Community" }}>
      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((section) => {
          const sectionLabel = translatedSectionLabels.get(section.category) || section.label;
          return (
            <section
              key={section.category}
              className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{sectionLabel}</h2>
                <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  {topSevenLabel}
                </span>
              </div>

              {section.entries.length ? (
                <div className="mt-4 space-y-2">
                  {section.entries.map((entry) => (
                    <EntryRow
                      key={`${section.category}-${entry.userId}`}
                      entry={entry}
                      pointsLabel={pointsLabel}
                      donorTitleLabel={donorTitleLabel}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  {emptyLabel}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </PageScaffold>
  );
}
