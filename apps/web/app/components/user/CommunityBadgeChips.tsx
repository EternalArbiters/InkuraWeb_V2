"use client";

import { useMemo } from "react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import type { CommunityIdentityBadge } from "@/lib/communityBadges";

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

function toneClasses(tone: string | null | undefined) {
  if (!tone) return BADGE_TONE_CLASSES.GRAY;
  return BADGE_TONE_CLASSES[tone] || BADGE_TONE_CLASSES.GRAY;
}

export default function CommunityBadgeChips({
  badges,
  className = "",
  compact = false,
}: {
  badges: CommunityIdentityBadge[];
  className?: string;
  compact?: boolean;
}) {
  const t = useUILanguageText("Page Community Badge Chips");

  const normalized = useMemo(
    () =>
      (badges || []).map((badge) => ({
        ...badge,
        translatedLabel:
          badge.kind === "MAIN"
            ? badge.label
            : t(badge.label),
      })),
    [badges, t]
  );

  if (!normalized.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {normalized.map((badge, index) => (
        <span
          key={`${badge.kind}-${badge.badgeKey || badge.label}-${index}`}
          className={`inline-flex items-center rounded-full border ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} font-semibold ${toneClasses(badge.tone)}`}
        >
          {badge.translatedLabel}
        </span>
      ))}
    </div>
  );
}
