import Link from "next/link";

import PageScaffold from "@/app/components/PageScaffold";
import GemRankIcon from "@/app/components/user/GemRankIcons";
import AdminDonorPanel from "@/app/community/title/AdminDonorPanel";
import { getSession } from "@/server/auth/session";
import { getAdminCommunityPageData } from "@/server/services/admin/community";
import {
  getCommunityStandingSummary,
  type CommunityStandingItem,
} from "@/server/services/community/leaderboards";
import {
  getCommunitySpecialBadgeWinners,
  getCommunityUserSpecialBadgeSummary,
  type CommunitySpecialBadgeEntry,
} from "@/server/services/community/specialBadges";
import {
  resolveCreatorTitle,
  resolveNobleTitle,
  resolveRankBadgeTone,
  type RankBadgeTone,
  type StaticBadgeTone,
} from "@/server/services/community/ranking";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

const RIBBON_TONE_CONFIG: Record<string, { gradient: string; dropShadow: string; notch: number }> = {
  PURPLE: { gradient: "linear-gradient(160deg,#c4b5fd 0%,#7c3aed 50%,#4c1d95 100%)", dropShadow: "drop-shadow(0 0 6px rgba(139,92,246,.7)) drop-shadow(0 4px 8px rgba(76,29,149,.55)) drop-shadow(0 1px 2px rgba(0,0,0,.4))", notch: 11 },
  INDIGO: { gradient: "linear-gradient(160deg,#a5b4fc 0%,#4338ca 50%,#1e1b4b 100%)", dropShadow: "drop-shadow(0 0 4px rgba(99,102,241,.55)) drop-shadow(0 3px 7px rgba(30,27,75,.5)) drop-shadow(0 1px 2px rgba(0,0,0,.35))", notch: 10 },
  BLUE: { gradient: "linear-gradient(160deg,#93c5fd 0%,#2563eb 50%,#1e3a8a 100%)", dropShadow: "drop-shadow(0 0 3px rgba(59,130,246,.5)) drop-shadow(0 3px 6px rgba(30,58,138,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 9 },
  GREEN: { gradient: "linear-gradient(160deg,#6ee7b7 0%,#059669 50%,#064e3b 100%)", dropShadow: "drop-shadow(0 2px 6px rgba(5,150,105,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 9 },
  YELLOW: { gradient: "linear-gradient(160deg,#fde68a 0%,#d97706 50%,#78350f 100%)", dropShadow: "drop-shadow(0 2px 5px rgba(217,119,6,.45)) drop-shadow(0 1px 2px rgba(0,0,0,.25))", notch: 8 },
  ORANGE: { gradient: "linear-gradient(160deg,#fdba74 0%,#ea580c 50%,#7c2d12 100%)", dropShadow: "drop-shadow(0 2px 5px rgba(234,88,12,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.25))", notch: 8 },
  RED: { gradient: "linear-gradient(160deg,#fca5a5 0%,#dc2626 50%,#7f1d1d 100%)", dropShadow: "drop-shadow(0 2px 4px rgba(220,38,38,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.2))", notch: 8 },
  GOLD: { gradient: "linear-gradient(160deg,#fef08a 0%,#eab308 35%,#ca8a04 65%,#78350f 100%)", dropShadow: "drop-shadow(0 0 6px rgba(234,179,8,.65)) drop-shadow(0 3px 8px rgba(120,53,15,.5)) drop-shadow(0 1px 2px rgba(0,0,0,.35))", notch: 10 },
  PLATINUM: { gradient: "linear-gradient(160deg,#f1f5f9 0%,#94a3b8 50%,#334155 100%)", dropShadow: "drop-shadow(0 0 4px rgba(148,163,184,.5)) drop-shadow(0 3px 6px rgba(51,65,85,.4)) drop-shadow(0 1px 2px rgba(0,0,0,.3))", notch: 10 },
};

const SPECIAL_BADGE_GUIDE = [
  {
    key: "PRIDE",
    label: "Pride",
    description: "Most loyal user across account age and active months.",
  },
  {
    key: "ENVY",
    label: "Envy",
    description: "Reads the widest range of deviant love signals.",
  },
  {
    key: "WRATH",
    label: "Wrath",
    description: "Writes the most comments.",
  },
  {
    key: "SLOTH",
    label: "Sloth",
    description: "Reads a lot without interacting or uploading.",
  },
  {
    key: "GREED",
    label: "Greed",
    description: "Donates the most to Inkura.",
  },
  {
    key: "GLUTTONY",
    label: "Gluttony",
    description: "Reads the widest range of genres.",
  },
  {
    key: "LUST",
    label: "Lust",
    description: "Reads or uploads the most adult or deviant works.",
  },
] as const;

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

function formatStandingValue(item: CommunityStandingItem, pointsLabel: string) {
  if (item.isAmountBased) {
    const currency = typeof item.metadata?.currency === "string" ? item.metadata.currency : "IDR";
    return formatAmount(item.score, currency);
  }
  return `${formatNumber(item.score)} ${pointsLabel}`;
}

function displayName(input: { name: string | null; username: string | null }) {
  return input.name || (input.username ? `@${input.username}` : "User");
}

function BadgePill({ label, tone }: { label: string; tone: RankBadgeTone | StaticBadgeTone | null | undefined }) {
  const config = RIBBON_TONE_CONFIG[tone || ""];
  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
        {label}
      </span>
    );
  }
  const { gradient, dropShadow, notch } = config;
  return (
    <span style={{ filter: dropShadow, display: "inline-flex" }}>
      <span style={{
        background: gradient,
        clipPath: `polygon(${notch}px 0%,calc(100% - ${notch}px) 0%,100% 50%,calc(100% - ${notch}px) 100%,${notch}px 100%,0% 50%)`,
        padding: `4px ${notch + 10}px`,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}>
        {label}
      </span>
    </span>
  );
}

function WinnerAvatar({ entry }: { entry: CommunitySpecialBadgeEntry }) {
  const label = displayName(entry);
  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
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

export default async function CommunityTitlePage() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const isAdmin = String(session?.user?.role || "").toUpperCase() === "ADMIN";

  const [standingSummary, specialSummary, specialWinners, adminCommunityData] = await Promise.all([
    userId ? getCommunityStandingSummary(userId) : Promise.resolve(null),
    userId ? getCommunityUserSpecialBadgeSummary(userId) : Promise.resolve(null),
    getCommunitySpecialBadgeWinners(),
    isAdmin ? getAdminCommunityPageData() : Promise.resolve(null),
  ]);

  const textSources = [
    "My Standing",
    "Sign in to see your standing.",
    "Community ranking is not available for admins.",
    "Current Title",
    "Current Special Badge",
    "Current Donor Badge",
    "No active title",
    "No active badge",
    "Unranked",
    "points",
    "Creator Titles",
    "Top creator titles for Best Author and Best Translator.",
    "Reader & User Titles",
    "Top noble titles for Best Reader and Best User.",
    "Special Badges",
    "Unique gold badges with only one active holder each.",
    "Current holder",
    "No holder yet.",
    "Rank color",
    "Default / Male",
    "Female",
    "How titles combine",
    "Best creator title + best reader title create one main title.",
    "Donatur stays separate as a gold badge.",
    "Guide",
    "Best Author",
    "Best Translator",
    "Best Reader",
    "Best User",
    "Best Donor",
    "Donatur",
    "Admin Donor Tools",
    "Only admins can record manual donor data here.",
    "Open manual input",
    "Close manual input",
    "Target (@username or email)",
    "Amount",
    "Currency",
    "Donation date",
    "Note (optional)",
    "Save donor entry",
    "Saving...",
    "Rebuild community snapshots",
    "Rebuilding...",
    "Overall Donor Table",
    "Top 7 from this table become Best Donor, and #1 becomes Greed.",
    "Rank",
    "Donor",
    "Total",
    "Entries",
    "Latest donation",
    "No donor data yet.",
    "No date",
    "Greed",
    "Open full donor ledger",
    "Donor entry saved and leaderboard rebuilt.",
    "Failed to create donation entry",
    "Failed to rebuild community snapshots",
    ...SPECIAL_BADGE_GUIDE.flatMap((item) => [item.label, item.description]),
  ];

  const textEntries = await Promise.all(
    Array.from(new Set(textSources)).map(async (source): Promise<readonly [string, string]> => [
      source,
      await getActiveUILanguageText(source, { section: "Page Community Title" }),
    ])
  );

  const textMap = new Map<string, string>(textEntries);
  const t = (source: string) => textMap.get(source) || source;

  const creatorGuide = Array.from({ length: 7 }, (_, index) => {
    const rank = index + 1;
    return {
      rank,
      title: resolveCreatorTitle(rank) || "-",
      tone: resolveRankBadgeTone(rank),
    };
  });

  const nobleGuide = Array.from({ length: 7 }, (_, index) => {
    const rank = index + 1;
    return {
      rank,
      maleTitle: resolveNobleTitle(rank, "MALE") || "-",
      femaleTitle: resolveNobleTitle(rank, "FEMALE") || "-",
      tone: resolveRankBadgeTone(rank),
    };
  });

  const winnerByKey = new Map(specialWinners.map((winner) => [winner.badgeKey, winner]));

  return (
    <PageScaffold title="Title" titleLookupOptions={{ section: "Navigation Community" }}>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("My Standing")}</h2>
            <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-300">
              {t("Guide")}
            </span>
          </div>

          {!userId ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
              {t("Sign in to see your standing.")}
            </div>
          ) : standingSummary && !standingSummary.isEligible ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
              {t("Community ranking is not available for admins.")}
            </div>
          ) : standingSummary ? (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {t("Current Title")}
                  </div>
                  <div className="mt-3">
                    {standingSummary.mainTitle && standingSummary.mainBadgeTone ? (
                      <BadgePill label={standingSummary.mainTitle} tone={standingSummary.mainBadgeTone} />
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-300">{t("No active title")}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {t("Current Special Badge")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {specialSummary?.badges.length ? (
                      specialSummary.badges.map((badge) => (
                        <BadgePill key={badge.badgeKey} label={t(badge.label)} tone={badge.badgeTone} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-300">{t("No active badge")}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {t("Current Donor Badge")}
                  </div>
                  <div className="mt-3">
                    {standingSummary.donorBadgeTone ? (
                      <BadgePill label={t("Donatur")} tone={standingSummary.donorBadgeTone} />
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-300">{t("No active badge")}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {standingSummary.standing.map((item) => {
                  const itemTitle = item.title === "Donatur" ? t("Donatur") : item.title;
                  return (
                    <div key={item.category} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{t(item.label)}</div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-2xl font-extrabold tracking-tight">
                          {item.rank ? `#${item.rank}` : t("Unranked")}
                        </div>
                        {itemTitle && item.badgeTone ? <BadgePill label={itemTitle} tone={item.badgeTone} /> : null}
                      </div>
                      <div className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {formatStandingValue(item, t("points"))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>

        {isAdmin && adminCommunityData ? (
          <AdminDonorPanel
            initial={{ donorTotals: adminCommunityData.donorTotals }}
            labels={{
              adminDonorTools: t("Admin Donor Tools"),
              adminDonorToolsHint: t("Only admins can record manual donor data here."),
              openManualInput: t("Open manual input"),
              closeManualInput: t("Close manual input"),
              usernameOrEmail: t("Target (@username or email)"),
              amount: t("Amount"),
              currency: t("Currency"),
              donationDate: t("Donation date"),
              noteOptional: t("Note (optional)"),
              saveDonorEntry: t("Save donor entry"),
              saving: t("Saving..."),
              rebuildCommunitySnapshots: t("Rebuild community snapshots"),
              rebuilding: t("Rebuilding..."),
              donorTotals: t("Overall Donor Table"),
              donorTotalsHint: t("Top 7 from this table become Best Donor, and #1 becomes Greed."),
              rank: t("Rank"),
              donor: t("Donor"),
              total: t("Total"),
              entries: t("Entries"),
              latestDonation: t("Latest donation"),
              noDonorDataYet: t("No donor data yet."),
              noDate: t("No date"),
              top7Rule: t("Top 7 from this table become Best Donor, and #1 becomes Greed."),
              greedLabel: t("Greed"),
              openFullDonorLedger: t("Open full donor ledger"),
              donorEntrySavedAndRebuilt: t("Donor entry saved and leaderboard rebuilt."),
              failedToCreateDonationEntry: t("Failed to create donation entry"),
              failedToRebuildCommunitySnapshots: t("Failed to rebuild community snapshots"),
            }}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Creator Titles")}</h2>
            <div className="mt-4 space-y-2">
              {creatorGuide.map((item) => {
                const cfg = RIBBON_TONE_CONFIG[item.tone || ""];
                return (
                  <div key={item.rank} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-extrabold text-white dark:bg-white dark:text-gray-900">
                        #{item.rank}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                    </div>
                    {cfg ? (
                      <span style={{ filter: cfg.dropShadow, display: "inline-flex" }}>
                        <span style={{
                          background: cfg.gradient,
                          clipPath: `polygon(${cfg.notch}px 0%,calc(100% - ${cfg.notch}px) 0%,100% 50%,calc(100% - ${cfg.notch}px) 100%,${cfg.notch}px 100%,0% 50%)`,
                          padding: `5px ${cfg.notch + 10}px`,
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#fff",
                        }}>
                          <GemRankIcon tone={item.tone} size={16} />
                        </span>
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Reader & User Titles")}</h2>
            <div className="mt-4 space-y-2">
              {nobleGuide.map((item) => (
                <div key={item.rank} className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-extrabold text-white dark:bg-white dark:text-gray-900">
                      #{item.rank}
                    </div>
                    <BadgePill label={t("Rank color")} tone={item.tone} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{t("Default / Male")}</div>
                      <div className="mt-1 font-semibold text-gray-900 dark:text-white">{item.maleTitle}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{t("Female")}</div>
                      <div className="mt-1 font-semibold text-gray-900 dark:text-white">{item.femaleTitle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Special Badges")}</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SPECIAL_BADGE_GUIDE.map((item) => {
              const winner = winnerByKey.get(item.key);
              return (
                <div key={item.key} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <BadgePill label={t(item.label)} tone="GOLD" />
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{SPECIAL_BADGE_GUIDE.findIndex((entry) => entry.key === item.key) + 1}</div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t(item.description)}</p>
                  <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    {t("Current holder")}
                  </div>
                  {winner ? (
                    winner.username ? (
                      <Link
                        href={`/u/${winner.username}`}
                        className="mt-2 flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-white/5"
                      >
                        <WinnerAvatar entry={winner} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName(winner)}</div>
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">@{winner.username}</div>
                        </div>
                      </Link>
                    ) : (
                      <div className="mt-2 flex items-center gap-3 rounded-2xl px-2 py-2">
                        <WinnerAvatar entry={winner} />
                        <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName(winner)}</div>
                      </div>
                    )
                  ) : (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">{t("No holder yet.")}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageScaffold>
  );
}
