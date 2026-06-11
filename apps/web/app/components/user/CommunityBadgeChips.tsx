"use client";

import { useMemo } from "react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import type { CommunityIdentityBadge } from "@/lib/communityBadges";

type BadgeStyle = {
  base: string;
  text: string;
  shadow: string;
  ring?: string;
};

const TONE_STYLE: Record<string, BadgeStyle> = {
  PURPLE: {
    base: "bg-gradient-to-r from-purple-600 to-violet-500",
    text: "text-white",
    shadow: "shadow-md shadow-purple-500/40",
    ring: "ring-1 ring-purple-400/30",
  },
  INDIGO: {
    base: "bg-gradient-to-r from-indigo-600 to-blue-500",
    text: "text-white",
    shadow: "shadow-md shadow-indigo-500/40",
  },
  BLUE: {
    base: "bg-gradient-to-r from-blue-500 to-cyan-400",
    text: "text-white",
    shadow: "shadow-md shadow-blue-500/40",
  },
  GREEN: {
    base: "bg-gradient-to-r from-emerald-500 to-teal-400",
    text: "text-white",
    shadow: "shadow-md shadow-emerald-500/40",
  },
  YELLOW: {
    base: "bg-gradient-to-r from-amber-500 to-yellow-400",
    text: "text-white",
    shadow: "shadow-md shadow-amber-400/40",
  },
  ORANGE: {
    base: "bg-gradient-to-r from-orange-500 to-amber-400",
    text: "text-white",
    shadow: "shadow-md shadow-orange-500/40",
  },
  RED: {
    base: "bg-gradient-to-r from-rose-600 to-red-500",
    text: "text-white",
    shadow: "shadow-md shadow-rose-500/40",
  },
  GOLD: {
    base: "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400",
    text: "text-white",
    shadow: "shadow-md shadow-yellow-400/50",
    ring: "ring-1 ring-yellow-300/50",
  },
  PLATINUM: {
    base: "bg-gradient-to-r from-slate-400 to-zinc-400",
    text: "text-white",
    shadow: "shadow-md shadow-slate-400/30",
  },
  GRAY: {
    base: "bg-transparent border border-gray-300 dark:border-gray-600",
    text: "text-gray-600 dark:text-gray-400",
    shadow: "",
  },
};

function getBadgeStyle(tone: string | null | undefined): BadgeStyle {
  if (!tone) return TONE_STYLE.GRAY;
  return TONE_STYLE[tone] || TONE_STYLE.GRAY;
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
        translatedLabel: badge.kind === "MAIN" ? badge.label : t(badge.label),
      })),
    [badges, t]
  );

  if (!normalized.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {normalized.map((badge, index) => {
        const style = getBadgeStyle(badge.tone);
        const isMain = badge.kind === "MAIN";
        const sizeClass = compact
          ? "px-2 py-0.5 text-[10px]"
          : isMain
            ? "px-3 py-1 text-[11px]"
            : "px-2.5 py-0.5 text-[10px]";

        return (
          <span
            key={`${badge.kind}-${badge.badgeKey || badge.label}-${index}`}
            className={[
              "inline-flex items-center rounded-full font-semibold tracking-wide",
              sizeClass,
              style.base,
              style.text,
              style.shadow,
              style.ring || "",
              isMain ? "font-bold" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {badge.translatedLabel}
          </span>
        );
      })}
    </div>
  );
}
