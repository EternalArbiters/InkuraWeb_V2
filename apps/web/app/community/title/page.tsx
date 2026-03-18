import Link from "next/link";

import PageScaffold from "@/app/components/PageScaffold";
import { getSession } from "@/server/auth/session";
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

function toneClasses(tone: string | null | undefined) {
  if (!tone) return BADGE_TONE_CLASSES.GRAY;
  return BADGE_TONE_CLASSES[tone] || BADGE_TONE_CLASSES.GRAY;
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
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(tone)}`}>
      {label}
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

  const [standingSummary, specialSummary, specialWinners] = await Promise.all([
    userId ? getCommunityStandingSummary(userId) : Promise.resolve(null),
    userId ? getCommunityUserSpecialBadgeSummary(userId) : Promise.resolve(null),
    getCommunitySpecialBadgeWinners(),
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
    ...SPECIAL_BADGE_GUIDE.flatMap((item) => [item.label, item.description]),
  ];

  const textMap = new Map(
    await Promise.all(
      Array.from(new Set(textSources)).map(async (source) => [
        source,
        await getActiveUILanguageText(source, { section: "Page Community Title" }),
      ])
    )
  );
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

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1.15fr_0.7fr]">
          <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Creator Titles")}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("Top creator titles for Best Author and Best Translator.")}</p>
            <div className="mt-4 space-y-2">
              {creatorGuide.map((item) => (
                <div key={item.rank} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-extrabold text-white dark:bg-white dark:text-gray-900">
                      #{item.rank}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                  </div>
                  <BadgePill label={t("Rank color")} tone={item.tone} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Reader & User Titles")}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("Top noble titles for Best Reader and Best User.")}</p>
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

          <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("How titles combine")}</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                {t("Best creator title + best reader title create one main title.")}
                <div className="mt-2 font-semibold text-gray-900 dark:text-white">Diamond Emperor</div>
              </div>
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                {t("Donatur stays separate as a gold badge.")}
                <div className="mt-2">
                  <BadgePill label={t("Donatur")} tone="GOLD" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{t("Special Badges")}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("Unique gold badges with only one active holder each.")}</p>

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
