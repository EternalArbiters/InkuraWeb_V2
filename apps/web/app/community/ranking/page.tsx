import Link from "next/link";

import PageScaffold from "@/app/components/PageScaffold";
import GemRankIcon from "@/app/components/user/GemRankIcons";
import {
  getCommunityLeaderboardPageData,
  type CommunityLeaderboardEntry,
} from "@/server/services/community/leaderboards";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

const CREATOR_CATEGORIES = new Set(["BEST_AUTHOR", "BEST_TRANSLATOR"]);

const RIBBON_CONFIG: Record<string, { gradient: string; dropShadow: string; notch: number }> = {
  PURPLE: { gradient: "linear-gradient(160deg,#c4b5fd 0%,#7c3aed 50%,#4c1d95 100%)", dropShadow: "drop-shadow(0 0 6px rgba(139,92,246,.7)) drop-shadow(0 4px 8px rgba(76,29,149,.55)) drop-shadow(0 1px 2px rgba(0,0,0,.4))", notch: 11 },
  INDIGO: { gradient: "linear-gradient(160deg,#a5b4fc 0%,#4338ca 50%,#1e1b4b 100%)", dropShadow: "drop-shadow(0 0 4px rgba(99,102,241,.55)) drop-shadow(0 3px 7px rgba(30,27,75,.5)) drop-shadow(0 1px 2px rgba(0,0,0,.35))", notch: 10 },
  BLUE:   { gradient: "linear-gradient(160deg,#93c5fd 0%,#2563eb 50%,#1e3a8a 100%)", dropShadow: "drop-shadow(0 0 3px rgba(59,130,246,.5)) drop-shadow(0 3px 6px rgba(30,58,138,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 9 },
  GREEN:  { gradient: "linear-gradient(160deg,#6ee7b7 0%,#059669 50%,#064e3b 100%)", dropShadow: "drop-shadow(0 2px 6px rgba(5,150,105,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 9 },
  YELLOW: { gradient: "linear-gradient(160deg,#fde68a 0%,#d97706 50%,#78350f 100%)", dropShadow: "drop-shadow(0 2px 5px rgba(217,119,6,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.25))", notch: 8 },
  ORANGE: { gradient: "linear-gradient(160deg,#fdba74 0%,#ea580c 50%,#7c2d12 100%)", dropShadow: "drop-shadow(0 2px 5px rgba(234,88,12,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.25))", notch: 8 },
  RED:    { gradient: "linear-gradient(160deg,#fca5a5 0%,#dc2626 50%,#7f1d1d 100%)", dropShadow: "drop-shadow(0 2px 4px rgba(220,38,38,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.2))", notch: 8 },
  GOLD:     { gradient: "linear-gradient(160deg,#fef08a 0%,#eab308 35%,#ca8a04 65%,#78350f 100%)", dropShadow: "drop-shadow(0 0 6px rgba(234,179,8,.65)) drop-shadow(0 3px 8px rgba(120,53,15,.5)) drop-shadow(0 1px 2px rgba(0,0,0,.35))", notch: 10 },
  PLATINUM: { gradient: "linear-gradient(160deg,#f1f5f9 0%,#94a3b8 50%,#334155 100%)", dropShadow: "drop-shadow(0 0 4px rgba(148,163,184,.5)) drop-shadow(0 3px 6px rgba(51,65,85,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 10 },
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

function TitleBadge({ title, tone, isCreator }: { title: string; tone: string | null | undefined; isCreator: boolean }) {
  const cfg = RIBBON_CONFIG[tone || ""];
  if (!cfg) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
        {title}
      </span>
    );
  }
  return (
    <span style={{ filter: cfg.dropShadow, display: "inline-flex" }}>
      <span style={{
        background: cfg.gradient,
        clipPath: `polygon(${cfg.notch}px 0%,calc(100% - ${cfg.notch}px) 0%,100% 50%,calc(100% - ${cfg.notch}px) 100%,${cfg.notch}px 100%,0% 50%)`,
        padding: `4px ${cfg.notch + 10}px`,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        gap: isCreator ? "5px" : undefined,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}>
        {isCreator && <GemRankIcon tone={tone!} size={11} />}
        {title}
      </span>
    </span>
  );
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
          <TitleBadge
            title={title}
            tone={entry.badgeTone}
            isCreator={CREATOR_CATEGORIES.has(entry.category)}
          />
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

  const translatedSectionLabelEntries = await Promise.all(
    sections.map(async (section): Promise<readonly [string, string]> => [
      section.category,
      await getActiveUILanguageText(section.label, { section: "Page Community Ranking" }),
    ])
  );

  const translatedSectionLabels = new Map<string, string>(translatedSectionLabelEntries);

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
