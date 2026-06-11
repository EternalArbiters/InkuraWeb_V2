"use client";

import { useMemo } from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import type { CommunityIdentityBadge } from "@/lib/communityBadges";
import GemRankIcon from "./GemRankIcons";

type ToneConfig = {
  gradient: string;
  dropShadow: string;
  notch: number;
};

const TONE_CONFIG: Record<string, ToneConfig> = {
  PURPLE: {
    gradient: "linear-gradient(160deg, #c4b5fd 0%, #7c3aed 50%, #4c1d95 100%)",
    dropShadow:
      "drop-shadow(0 0 6px rgba(139,92,246,0.7)) drop-shadow(0 4px 8px rgba(76,29,149,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
    notch: 11,
  },
  INDIGO: {
    gradient: "linear-gradient(160deg, #a5b4fc 0%, #4338ca 50%, #1e1b4b 100%)",
    dropShadow:
      "drop-shadow(0 0 4px rgba(99,102,241,0.55)) drop-shadow(0 3px 7px rgba(30,27,75,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
    notch: 10,
  },
  BLUE: {
    gradient: "linear-gradient(160deg, #93c5fd 0%, #2563eb 50%, #1e3a8a 100%)",
    dropShadow:
      "drop-shadow(0 0 3px rgba(59,130,246,0.5)) drop-shadow(0 3px 6px rgba(30,58,138,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
    notch: 9,
  },
  GREEN: {
    gradient: "linear-gradient(160deg, #6ee7b7 0%, #059669 50%, #064e3b 100%)",
    dropShadow:
      "drop-shadow(0 2px 6px rgba(5,150,105,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
    notch: 9,
  },
  YELLOW: {
    gradient: "linear-gradient(160deg, #fde68a 0%, #d97706 50%, #78350f 100%)",
    dropShadow:
      "drop-shadow(0 2px 5px rgba(217,119,6,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
    notch: 8,
  },
  ORANGE: {
    gradient: "linear-gradient(160deg, #fdba74 0%, #ea580c 50%, #7c2d12 100%)",
    dropShadow:
      "drop-shadow(0 2px 5px rgba(234,88,12,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
    notch: 8,
  },
  RED: {
    gradient: "linear-gradient(160deg, #fca5a5 0%, #dc2626 50%, #7f1d1d 100%)",
    dropShadow:
      "drop-shadow(0 2px 4px rgba(220,38,38,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
    notch: 8,
  },
  GOLD: {
    gradient: "linear-gradient(160deg, #fef08a 0%, #eab308 35%, #ca8a04 65%, #78350f 100%)",
    dropShadow:
      "drop-shadow(0 0 6px rgba(234,179,8,0.65)) drop-shadow(0 3px 8px rgba(120,53,15,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
    notch: 10,
  },
  PLATINUM: {
    gradient: "linear-gradient(160deg, #f1f5f9 0%, #94a3b8 50%, #334155 100%)",
    dropShadow:
      "drop-shadow(0 0 4px rgba(148,163,184,0.5)) drop-shadow(0 3px 6px rgba(51,65,85,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
    notch: 10,
  },
};

// Mid-tone border color per rank (for gem pill outline)
const GEM_BORDER: Record<string, string> = {
  PURPLE: "rgba(139,92,246,0.55)",
  INDIGO: "rgba(99,102,241,0.55)",
  BLUE:   "rgba(59,130,246,0.55)",
  GREEN:  "rgba(5,150,105,0.55)",
  YELLOW: "rgba(217,119,6,0.55)",
  ORANGE: "rgba(234,88,12,0.55)",
  RED:    "rgba(220,38,38,0.55)",
};

function ribbonClipPath(notch: number) {
  return `polygon(${notch}px 0%, calc(100% - ${notch}px) 0%, 100% 50%, calc(100% - ${notch}px) 100%, ${notch}px 100%, 0% 50%)`;
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
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {normalized.map((badge, index) => {
        const key = `${badge.kind}-${badge.badgeKey || badge.label}-${index}`;
        const isGray = !badge.tone || badge.tone === "GRAY";
        const isMain = badge.kind === "MAIN";
        const config = TONE_CONFIG[badge.tone || ""];

        const vertPad = compact ? "2px" : isMain ? "4px" : "3px";
        const fontSize = compact ? "10px" : isMain ? "11px" : "10px";
        const horizPad = config ? `${config.notch + 10}px` : "10px";
        const fontWeight = isMain ? "800" : "700";
        const letterSpacing = isMain ? "0.03em" : "0.02em";
        const gemSize = compact ? 12 : 14;

        if (isGray) {
          return (
            <span
              key={key}
              style={{ fontSize, fontWeight }}
              className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 px-2.5 py-0.5 tracking-wide"
            >
              {badge.translatedLabel}
            </span>
          );
        }

        // MAIN badge with both creator + noble parts → gem icon + ribbon side by side
        if (
          isMain &&
          badge.creatorTitle &&
          badge.nobleTitle &&
          badge.creatorTone &&
          badge.nobleTone
        ) {
          const creatorConfig = TONE_CONFIG[badge.creatorTone];
          const nobleConfig = TONE_CONFIG[badge.nobleTone];
          const gemBorder = GEM_BORDER[badge.creatorTone] ?? "rgba(255,255,255,0.3)";

          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              {/* Creator part — gem icon + name in a soft pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: `${vertPad} 8px ${vertPad} 6px`,
                  fontSize,
                  fontWeight,
                  letterSpacing,
                  color: "#fff",
                  background: creatorConfig?.gradient,
                  border: `1px solid ${gemBorder}`,
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                  lineHeight: 1.4,
                  filter: creatorConfig?.dropShadow,
                }}
              >
                <GemRankIcon tone={badge.creatorTone} size={gemSize} />
                {badge.creatorTitle}
              </span>
              {/* Noble part — ribbon */}
              <span style={{ filter: nobleConfig?.dropShadow, display: "inline-flex" }}>
                <span
                  style={{
                    background: nobleConfig?.gradient,
                    clipPath: ribbonClipPath(nobleConfig?.notch ?? 8),
                    padding: `${vertPad} ${`${(nobleConfig?.notch ?? 8) + 10}px`}`,
                    fontSize,
                    fontWeight,
                    letterSpacing,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}
                >
                  {badge.nobleTitle}
                </span>
              </span>
            </span>
          );
        }

        // MAIN badge with creator only → gem icon + name (pill)
        if (isMain && badge.creatorTitle && badge.creatorTone && !badge.nobleTitle) {
          const creatorConfig = TONE_CONFIG[badge.creatorTone];
          const gemBorder = GEM_BORDER[badge.creatorTone] ?? "rgba(255,255,255,0.3)";
          return (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: `${vertPad} 8px ${vertPad} 6px`,
                fontSize,
                fontWeight,
                letterSpacing,
                color: "#fff",
                border: `1px solid ${gemBorder}`,
                borderRadius: "999px",
                whiteSpace: "nowrap",
                lineHeight: 1.4,
                filter: creatorConfig?.dropShadow,
              }}
            >
              <GemRankIcon tone={badge.creatorTone} size={gemSize} />
              {badge.creatorTitle}
            </span>
          );
        }

        // MAIN badge with noble only → ribbon as normal (fallthrough)
        // All other colored badges → ribbon
        return (
          <span key={key} style={{ filter: config?.dropShadow, display: "inline-flex" }}>
            <span
              style={{
                background: config?.gradient,
                clipPath: ribbonClipPath(config?.notch ?? 8),
                padding: `${vertPad} ${horizPad}`,
                fontSize,
                fontWeight,
                letterSpacing,
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                lineHeight: 1.4,
              }}
            >
              {badge.translatedLabel}
            </span>
          </span>
        );
      })}
    </div>
  );
}
